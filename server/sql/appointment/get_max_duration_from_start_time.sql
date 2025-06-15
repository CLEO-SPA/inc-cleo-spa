CREATE OR REPLACE FUNCTION get_max_duration_from_start_time(
    p_appointment_date DATE,
    p_employee_id INT DEFAULT NULL,
	p_exclude_appointment_id INT DEFAULT NULL  -- /// NEW
)
RETURNS TABLE(
    start_time TIME,
    max_end_time TIME,
    max_duration_minutes INT
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN QUERY
    WITH time_slots AS (
        -- All possible start slots from 10:00 to 18:30
        SELECT generate_series(
            p_appointment_date + TIME '10:00',
            p_appointment_date + TIME '18:30',
            INTERVAL '30 minutes'
        ) AS slot_time
    ),
    active_employees AS (
        -- If a specific employee is given, use only that; otherwise all active employees
        SELECT id AS emp_id
        FROM employees
        WHERE (p_employee_id IS NOT NULL AND id = p_employee_id)
           OR (p_employee_id IS NULL AND employee_is_active = TRUE)
    ),
    employee_slot AS (
        -- Cross join slot times with relevant employees
        SELECT ts.slot_time, ae.emp_id
        FROM time_slots ts
        CROSS JOIN active_employees ae
    ),
    -- For each (slot_time, emp_id), find the next conflict start time after slot_time for that employee
    next_conflicts_per_emp AS (
        SELECT
            es.slot_time,
            es.emp_id,
            COALESCE(
                MIN(a.start_time),
                p_appointment_date + TIME '21:00'
            ) AS next_conflict_time
        FROM employee_slot es
        LEFT JOIN appointments a
            ON a.servicing_employee_id = es.emp_id
           AND DATE(a.start_time) = p_appointment_date
           AND a.start_time > es.slot_time
		   AND (p_exclude_appointment_id IS NULL OR a.id != p_exclude_appointment_id)
        GROUP BY es.slot_time, es.emp_id
    ),
    -- Exclude (slot_time, emp_id) where the employee is already booked at slot_time
    free_slots_per_emp AS (
        SELECT
            ncp.slot_time,
            ncp.emp_id,
            ncp.next_conflict_time
        FROM next_conflicts_per_emp ncp
        WHERE NOT EXISTS (
            SELECT 1
            FROM appointments a2
            WHERE a2.servicing_employee_id = ncp.emp_id
              AND DATE(a2.start_time) = p_appointment_date
              AND ncp.slot_time >= a2.start_time
              AND ncp.slot_time < a2.end_time
			  AND (p_exclude_appointment_id IS NULL OR a2.id != p_exclude_appointment_id)
        )
    ),
    -- For each slot_time, pick the employee that gives the latest next_conflict_time
    best_slot_per_time AS (
        SELECT
            slot_time,
            MAX(next_conflict_time) AS best_next_conflict_time
        FROM free_slots_per_emp
        GROUP BY slot_time
    )
    SELECT
        bst.slot_time::TIME AS start_time,
        LEAST(bst.best_next_conflict_time::TIME, TIME '21:00') AS max_end_time,
        -- Compute minutes between slot_time and that end
        EXTRACT(
          EPOCH FROM (
            LEAST(bst.best_next_conflict_time, p_appointment_date + TIME '21:00')
            - (p_appointment_date + bst.slot_time::TIME)
          )
        )::INT / 60 AS max_duration_minutes
    FROM best_slot_per_time bst
    ORDER BY bst.slot_time;
END;
$$;