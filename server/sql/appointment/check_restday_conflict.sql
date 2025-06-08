/*
 * Function: check_restday_conflict
 * Purpose : Determine if an employee’s requested appointment date falls on their scheduled rest day.
 *           Returns a user-friendly warning string if there’s a conflict, or NULL otherwise.
 *
 * Context :
 *   – Used by the front end to warn (but not block) booking creation when the employee is off.
 *   – Employees remain able to create the appointment despite the warning.
 *
 * Signature:
 *   check_restday_conflict(
 *     p_employee_id      INT,        -- the ID of the employee to check
 *     p_appointment_date DATE        -- the desired appointment date
 *   ) RETURNS TEXT                   -- warning message or NULL
 *
 * Notes:
 *   • EXTRACT(DOW) yields 1=Monday … 7=Sunday.
 *   • We map the numeric DOW back to a weekday name by adding to a base date (2000-01-03 = Monday).
 *   • Timetable entries carry effective_startdate / effective_enddate; an open-ended end date is NULL.
 *   • IMMUTABLE: no side effects, always same output for same inputs.
 */

CREATE OR REPLACE FUNCTION check_restday_conflict(
    p_employee_id      INT,           -- target employee
    p_appointment_date DATE           -- date of proposed appointment
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  -- day-of-week (1=Mon … 7=Sun) of the appointment
  v_dow      INT := EXTRACT(DOW FROM p_appointment_date)::INT;
  -- hold the employee’s name for message personalization
  v_name     TEXT;
  -- the matching rest-day number, if any
  v_restday  INT;
BEGIN
  -- fetch the employee’s name (assumes id exists)
  SELECT employee_name
    INTO v_name
    FROM employees
   WHERE id = p_employee_id;

  -- check if the requested date matches one of the employee’s rest days
  SELECT restday_number
    INTO v_restday
    FROM timetables
   WHERE employee_id       = p_employee_id
     AND restday_number    = v_dow
     AND p_appointment_date >= effective_startdate
     AND (effective_enddate IS NULL
          OR p_appointment_date <= effective_enddate)
   LIMIT 1;

  IF FOUND THEN
    -- build a clear, localized warning:
    RETURN CONCAT(
      'Warning: ', v_name,
      ' has a rest day on ',
      -- map 1–7 to weekday name (e.g. Tuesday)
      TO_CHAR(DATE '2000-01-03' + (v_dow - 1), 'FMDay'),
      ' which conflicts with ',
      TO_CHAR(p_appointment_date, 'DD Mon YYYY')
    );
  ELSE
    -- no conflict → no warning
    RETURN NULL;
  END IF;
END;
$$;
