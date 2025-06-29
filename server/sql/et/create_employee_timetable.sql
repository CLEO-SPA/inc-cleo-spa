CREATE OR REPLACE FUNCTION create_employee_timetable (
    p_employee_id BIGINT,
    p_current_date TIMESTAMPTZ,
    p_restday_number SMALLINT,
    p_effective_startdate TIMESTAMPTZ,
    p_effective_enddate TIMESTAMPTZ,
    p_created_by BIGINT,
    p_created_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_prev_id BIGINT;
    v_next_id BIGINT;
    v_new_enddate TIMESTAMPTZ := p_effective_enddate;
    v_next_startdate TIMESTAMPTZ;
    v_timetable_id BIGINT;
    v_conflict_count INT;
    v_conflict_details JSONB;
    o_response JSONB;
    v_prev_timetable_details JSONB; -- To store the updated previous timetable details
    v_updated_new_enddate TIMESTAMPTZ; -- To store the updated new timetable's end date
BEGIN
    -- 1. Validate effective_startdate not earlier than current date
    IF p_effective_startdate::DATE < p_current_date::DATE THEN
        RAISE EXCEPTION USING MESSAGE ='Invalid timetable. The start date cannot be earlier than the current date.', ERRCODE = '40000';
    END IF;

    -- 2. Validate effective_enddate (if given) not earlier than current date or start date
    IF p_effective_enddate IS NOT NULL THEN
        IF p_effective_enddate::DATE < p_current_date::DATE OR p_effective_enddate < p_effective_startdate THEN
            RAISE EXCEPTION USING MESSAGE ='Invalid timetable. The end date cannot be earlier than the current date or the start date.', ERRCODE = '40000';
        END IF;
    END IF;

    -- 3. Check if timetable with same effective_startdate exists
    PERFORM 1 FROM timetables
    WHERE employee_id = p_employee_id AND effective_startdate = p_effective_startdate;
    IF FOUND THEN
        RAISE EXCEPTION USING MESSAGE = 'A timetable already exists with the same start date.', ERRCODE = '40900';
    END IF;

    -- 3.1. If effective start date = effective end date, set effective end date to 23:59:59
    IF p_effective_enddate = p_effective_startdate THEN
        v_new_enddate := p_effective_enddate + INTERVAL '23 hours 59 minutes 59 seconds';
    END IF;

    -- 4. Identify previous timetable (the last timetable with start date before new timetable's start date or open-ended)
    SELECT id INTO v_prev_id FROM timetables
    WHERE employee_id = p_employee_id
    AND effective_startdate < p_effective_startdate
    ORDER BY effective_startdate DESC
    LIMIT 1;

    -- 5. Identify next timetable (the first timetable with start date after new timetable's start date)
    SELECT id, effective_startdate INTO v_next_id, v_next_startdate FROM timetables
    WHERE employee_id = p_employee_id
    AND effective_startdate > p_effective_startdate
    ORDER BY effective_startdate ASC
    LIMIT 1;

    -- 6. Adjust previous timetable's effective_enddate to 1 day before new timetable's start date (if previous timetable exists)
    IF v_prev_id IS NOT NULL THEN
        -- Update the previous timetable's effective end date
        UPDATE timetables
        SET effective_enddate = (p_effective_startdate::date - INTERVAL '1 day') + INTERVAL '23 hours 59 minutes 59 seconds',
            updated_at = p_created_at,
            updated_by = p_created_by
        WHERE id = v_prev_id;
	
        -- Get previous timetable details after updating it
        SELECT row_to_json(t) INTO v_prev_timetable_details
        FROM timetables t
        WHERE t.id = v_prev_id;
	END IF;

    -- 7. Adjust new timetable's effective_enddate to 1 day before next timetable's start date (if next timetable exists)
    IF v_next_id IS NOT NULL THEN
        -- Update the new timetable's effective end date
        v_new_enddate := v_next_startdate - INTERVAL '1 day' + INTERVAL '23 hours 59 minutes 59 seconds';

        -- Capture the updated effective end date for the new timetable
        v_updated_new_enddate := v_new_enddate;
    END IF;

    -- 8. Insert the new timetable
    INSERT INTO timetables (
        employee_id,
        restday_number,
        effective_startdate,
        effective_enddate,
        created_at,
        created_by
    ) VALUES (
        p_employee_id,
        p_restday_number,
        p_effective_startdate,
        v_new_enddate,
        p_created_at,
        p_created_by
    ) RETURNING id INTO v_timetable_id;

    -- 9. Check appointment conflicts on the rest day within the timetable period, grouped by date
    SELECT
        COUNT(*) AS total_conflicts,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'rest_day_date', rest_day,
                    'conflicted_count', conflicted_count
                )
            ), '[]'::jsonb
        ) AS conflict_dates
    INTO v_conflict_count, v_conflict_details
    FROM (
        SELECT
            appointment_date::date AS rest_day,
            COUNT(*) AS conflicted_count
        FROM appointments
        WHERE servicing_employee_id = p_employee_id
          AND EXTRACT(ISODOW FROM appointment_date) = p_restday_number
          AND appointment_date::date BETWEEN p_effective_startdate::date AND COALESCE(v_new_enddate::date, 'infinity'::date)
        GROUP BY appointment_date::date
    ) sub;

    -- 10. Build structured JSON response with updated timetable details
    o_response := jsonb_build_object(
        'timetable_details', jsonb_build_object(
            'employee_id', p_employee_id,
            'restday_number', p_restday_number,
            'effective_startdate', to_char(p_effective_startdate, 'YYYY-MM-DD"T"HH24:MI:SSOF'),
            'effective_enddate', CASE WHEN v_new_enddate IS NULL THEN NULL ELSE to_char(v_new_enddate, 'YYYY-MM-DD"T"HH24:MI:SSOF') END,
            'created_by', p_created_by,
            'created_at', to_char(p_created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF')
        ),
        'updated_previous_timetable', v_prev_timetable_details, -- Return the updated previous timetable details
        'updated_new_timetable_effective_enddate', to_char(v_updated_new_enddate, 'YYYY-MM-DD"T"HH24:MI:SSOF'), -- Return the updated new timetable's end date
        'conflicted_appointments_day_count', COALESCE(v_conflict_count, 0),
        'conflict_details', v_conflict_details
    );

    RETURN o_response;
END;
$$;
