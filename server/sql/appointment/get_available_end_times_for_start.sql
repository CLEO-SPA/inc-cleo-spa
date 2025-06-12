/*
 * Function to get available end times for a specific start time
 * This is more targeted than the general availability function
 * Now handles NULL start_time values
 */
CREATE OR REPLACE FUNCTION get_available_end_times_for_start(
    p_appointment_date DATE,
    p_start_time TIME,
    p_employee_id INT DEFAULT NULL
)
RETURNS TABLE(
    end_time TIME
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    max_end TIME;
    series_start_ts TIMESTAMP;
    series_end_ts TIMESTAMP;
BEGIN
    -- If start time is NULL: return default end times 10:30 to 21:00
    IF p_start_time IS NULL THEN
        -- Generate from 10:30 to 21:00 on the given date
        RETURN QUERY
        SELECT (ts)::TIME
        FROM generate_series(
            -- start at 10:30
            (p_appointment_date + TIME '10:30')::timestamp,
            -- until 21:00
            (p_appointment_date + TIME '21:00')::timestamp,
            INTERVAL '30 minutes'
        ) AS ts;
        RETURN;
    END IF;

    -- Otherwise, find the maximum possible end time for this start time
    SELECT max_end_time INTO max_end
    FROM get_max_duration_from_start_time(p_appointment_date, p_employee_id)
    WHERE start_time = p_start_time;

    -- If no valid start time found or max_end is null, return empty set
    IF max_end IS NULL THEN
        RETURN;
    END IF;

    -- Build timestamps for series:
    -- series starts at p_start_time + 30 minutes
    series_start_ts := (p_appointment_date + p_start_time)::timestamp + INTERVAL '30 minutes';
    -- series_end is the earlier of max_end or 21:00
    series_end_ts := LEAST(
        (p_appointment_date + max_end)::timestamp,
        (p_appointment_date + TIME '21:00')::timestamp
    );

    -- If the start for series is already after series_end, return empty
    IF series_start_ts > series_end_ts THEN
        RETURN;
    END IF;

    -- Generate 30-minute steps from series_start_ts to series_end_ts
    RETURN QUERY
    SELECT (ts)::TIME
    FROM generate_series(
        series_start_ts,
        series_end_ts,
        INTERVAL '30 minutes'
    ) AS ts;
END;
$$;