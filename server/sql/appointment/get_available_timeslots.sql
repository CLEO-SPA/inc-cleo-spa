/*
 * Function: get_available_timeslots
 * Purpose : Generate all 30-minute timeslots between 10:00 and 17:00 on a given date
 *           that are not already booked for a specific employee (or, if NULL,
 *           across all active employees).
 *
 * Notes:
 *   – Business hours of 10:00–17:00 are based on Cleo Group’s OLA booking site:
 *     https://cleogroup.sg/book-now/ola/services
 *   – Individual services are assumed to last up to 2 hours; since the
 *     appointments table no longer stores service IDs or durations, we
 *     conservatively avoid any overlap by checking start_time ≤ slot < end_time.
 *   – p_employee_id = NULL ⇒ return slots that at least one active employee
 *     could fill (i.e. where no active employee is booked at that time).
 *   – Immutable because logic doesn’t depend on database state beyond lookups.
 *
 * Signature:
 *   get_available_timeslots(
 *     p_appointment_date DATE,       -- target date for which to find slots
 *     p_employee_id      INT DEFAULT NULL  -- optional: specific employee
 *   ) RETURNS TABLE(timeslot TIME)
 *
 * Example:
 *   SELECT * FROM get_available_timeslots('2025-05-08', 42);
 *   SELECT * FROM get_available_timeslots('2025-05-08', NULL);
 */
CREATE OR REPLACE FUNCTION get_available_timeslots(
    p_appointment_date DATE,          -- date to query (YYYY-MM-DD)
    p_employee_id      INT DEFAULT NULL  -- employee ID, or NULL for any
)
RETURNS TABLE(timeslot TIME)    -- return only the TIME part
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN QUERY
    WITH time_slots AS (
        -- Generate every 15-minute slot from 10:00 to 17:00 on the given date
        SELECT generate_series(
                   p_appointment_date + TIME '10:00',    -- business open
                   p_appointment_date + TIME '17:00',    -- business close
                   INTERVAL '30 minutes'                 -- step interval
               ) AS timeslot
    )
    SELECT ts.timeslot::TIME
    FROM time_slots ts
    WHERE
      (
        -- Case A: specific employee requested
        p_employee_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM appointments a
          WHERE a.servicing_employee_id = p_employee_id
            AND ts.timeslot >= a.start_time
            AND ts.timeslot < a.end_time
        )
      )
      OR
      (
        -- Case B: no employee specified 
        p_employee_id IS NULL
        AND EXISTS (
          SELECT 1
          FROM employees e
          WHERE e.employee_is_active = TRUE
            AND NOT EXISTS (
              SELECT 1
              FROM appointments a
              WHERE a.servicing_employee_id = e.id
                AND ts.timeslot >= a.start_time
                AND ts.timeslot < a.end_time
            )
        )
      )
    ORDER BY ts.timeslot;
END;
$$;
