CREATE OR REPLACE FUNCTION update_employee_timetable (
    p_timetable_id BIGINT,
	p_current_date TIMESTAMPTZ,
    p_restday_number SMALLINT,
    p_effective_startdate TIMESTAMPTZ,
    p_effective_enddate TIMESTAMPTZ,
    p_updated_by BIGINT,
    p_updated_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_updated_at TIMESTAMPTZ := p_updated_at;
    v_new_enddate TIMESTAMPTZ := p_effective_enddate;
    v_employee_id BIGINT;
    v_employee_name TEXT;
    v_prev_id BIGINT;
    v_next_id BIGINT;
    v_next_startdate TIMESTAMPTZ;
    v_prev_timetable_details JSONB;
    v_updated_current_enddate TIMESTAMPTZ;
    o_response JSONB;
BEGIN
    -- 1. Validate effective_startdate not earlier than current date
    IF (p_effective_startdate AT TIME ZONE 'Asia/Singapore')::DATE < (p_current_date AT TIME ZONE 'Asia/Singapore')::DATE THEN
        RAISE EXCEPTION USING MESSAGE ='Invalid timetable. The start date cannot be earlier than the current date.', ERRCODE = '40000';
    END IF;

    -- 2. Validate effective_enddate (if given) not earlier than current date or start date
    IF p_effective_enddate IS NOT NULL THEN
        IF p_effective_enddate::DATE < p_current_date::DATE OR p_effective_enddate < p_effective_startdate THEN
            RAISE EXCEPTION USING MESSAGE ='Invalid timetable. The end date cannot be earlier than the current date or the start date.', ERRCODE = '40000';
        END IF;
    END IF;

    -- 3. Extend end date to 23:59:59 if it's the same as start date
    IF p_effective_enddate = p_effective_startdate THEN
        v_new_enddate := p_effective_enddate + INTERVAL '23 hours 59 minutes 59 seconds';
    END IF;

    -- 4. Get employee_id from timetable
    SELECT employee_id INTO v_employee_id
    FROM timetables
    WHERE id = p_timetable_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Timetable not found for the given ID.';
    END IF;

    -- 5. Get employee name
    SELECT employee_name INTO v_employee_name
    FROM employees
    WHERE id = v_employee_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Employee not found for timetable.';
    END IF;

    -- 6. Check for conflicting timetable with the same start date (excluding self)
    IF EXISTS (
        SELECT 1
        FROM timetables
        WHERE employee_id = v_employee_id
          AND id <> p_timetable_id
          AND effective_startdate::DATE = p_effective_startdate::DATE
    ) THEN
        RAISE EXCEPTION USING MESSAGE ='A timetable already exists with the same start date.', ERRCODE = '40900';
    END IF;

    -- 7. Identify previous timetable (the last timetable with start date before new timetable's start date or open-ended)
    SELECT id INTO v_prev_id
    FROM timetables
    WHERE employee_id = v_employee_id
      AND id <> p_timetable_id
      AND effective_startdate < p_effective_startdate
    ORDER BY effective_startdate DESC
    LIMIT 1;

    -- 8. Identify next timetable (the first timetable with start date after new timetable's start date)
    SELECT id, effective_startdate INTO v_next_id, v_next_startdate
    FROM timetables
    WHERE employee_id = v_employee_id
      AND id <> p_timetable_id
      AND effective_startdate > p_effective_startdate
    ORDER BY effective_startdate ASC
    LIMIT 1;

    -- 9. Adjust previous timetable's effective_enddate to 1 day before the currently updated timetable's start date (if previous timetable exists)
    IF v_prev_id IS NOT NULL THEN
	  DECLARE
	    v_prev_target_enddate TIMESTAMPTZ := (p_effective_startdate - INTERVAL '1 day') + INTERVAL '23 hours 59 minutes 59 seconds';
	  BEGIN
	    -- Only update the previous timetable's effective end date if change is needed
	    IF EXISTS (
	      SELECT 1 FROM timetables
	      WHERE id = v_prev_id AND effective_enddate IS DISTINCT FROM v_prev_target_enddate
	    ) THEN
	      UPDATE timetables
	      SET effective_enddate = v_prev_target_enddate,
	          updated_at = v_updated_at,
	          updated_by = p_updated_by
	      WHERE id = v_prev_id;
	
	      -- Capture changes only if updated
	      SELECT row_to_json(t) INTO v_prev_timetable_details
	      FROM timetables t
	      WHERE t.id = v_prev_id;
	    END IF;
	  END;
	END IF;

    -- 10. Adjust currently updated timetable's effective_enddate to 1 day before next timetable's start date (if next timetable exists)
    IF v_next_id IS NOT NULL THEN
  DECLARE
    v_target_current_enddate TIMESTAMPTZ := v_next_startdate - INTERVAL '1 day' + INTERVAL '23 hours 59 minutes 59 seconds';
  BEGIN
    -- Adjust and capture the updated effective end date for the timetable only if change is needed
    IF v_new_enddate IS DISTINCT FROM v_target_current_enddate THEN
      v_new_enddate := v_target_current_enddate;
      v_updated_current_enddate := v_new_enddate;
    END IF;
  END;
END IF;

    -- 11. Update the timetable
    UPDATE timetables
    SET
        restday_number = p_restday_number,
        effective_startdate = p_effective_startdate,
        effective_enddate = v_new_enddate,
        updated_by = p_updated_by,
        updated_at = v_updated_at
    WHERE id = p_timetable_id;

    -- 12. Build JSON response
    o_response := jsonb_build_object(
        'message', 'Timetable successfully updated',
        'timetable_details', jsonb_build_object(
            'timetable_id', p_timetable_id,
            'employee_id', v_employee_id,
            'employee_name', v_employee_name,
            'restday_number', p_restday_number,
            'effective_startdate', to_char(p_effective_startdate, 'YYYY-MM-DD"T"HH24:MI:SSOF'),
            'effective_enddate', CASE 
                WHEN v_new_enddate IS NULL THEN NULL 
                ELSE to_char(v_new_enddate, 'YYYY-MM-DD"T"HH24:MI:SSOF') 
            END,
            'updated_by', p_updated_by,
            'updated_at', to_char(v_updated_at, 'YYYY-MM-DD"T"HH24:MI:SSOF'),
            'current_date', to_char(p_current_date, 'YYYY-MM-DD"T"HH24:MI:SSOF')
        ),
        'updated_previous_timetable', v_prev_timetable_details,
        'updated_current_timetable_enddate', CASE 
            WHEN v_updated_current_enddate IS NULL THEN NULL 
            ELSE to_char(v_updated_current_enddate, 'YYYY-MM-DD"T"HH24:MI:SSOF') 
        END
    );

    RETURN o_response;
END;
$$;
