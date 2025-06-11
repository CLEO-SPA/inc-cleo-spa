CREATE OR REPLACE PROCEDURE create_appointment_ab(
  IN p_member_id          bigint,
  IN p_appointments       jsonb,
  IN p_created_by         bigint,
  IN p_created_at         timestamptz
)
LANGUAGE plpgsql
AS $$
DECLARE
  rec              RECORD;
  v_employee_name  text;
  conflict_count   integer;
  conflict_rec     RECORD;
  idx              integer := 0;  -- appointment index tracker
BEGIN
  FOR rec IN
    SELECT
      (item->>'servicing_employee_id')::bigint   AS servicing_employee_id,
      (item->>'appointment_date')::date          AS appointment_date,
      (item->>'start_time')::timestamptz         AS start_time,
      (item->>'end_time')::timestamptz           AS end_time,
      (item->>'remarks')::text                   AS remarks
    FROM jsonb_array_elements(p_appointments) AS arr(item)
  LOOP
    idx := idx + 1;  -- increment appointment index
  
    -- Fetch employee name
    SELECT INITCAP(e.employee_name) INTO v_employee_name
    FROM employees e
    WHERE e.id = rec.servicing_employee_id;

    -- Check for any conflicting existing appointment and get its details
    SELECT a.start_time, a.end_time
    INTO conflict_rec
    FROM appointments a
    WHERE a.servicing_employee_id = rec.servicing_employee_id
      AND a.appointment_date = rec.appointment_date
      AND rec.start_time < a.end_time
      AND rec.end_time > a.start_time
    LIMIT 1;

    IF FOUND THEN
      RAISE EXCEPTION
        'Appointment % has a conflict: employee % (ID: %) is already booked on % from % to %',
        idx,
        v_employee_name,
        rec.servicing_employee_id,
        rec.appointment_date,
        TO_CHAR(conflict_rec.start_time, 'HH24:MIAM'),
        TO_CHAR(conflict_rec.end_time, 'HH24:MIAM');
    END IF;
  END LOOP;

  -- Insert valid appointments only if validation passed
  FOR rec IN
    SELECT
      (item->>'servicing_employee_id')::bigint   AS servicing_employee_id,
      (item->>'appointment_date')::date          AS appointment_date,
      (item->>'start_time')::timestamptz         AS start_time,
      (item->>'end_time')::timestamptz           AS end_time,
      (item->>'remarks')::text                   AS remarks
    FROM jsonb_array_elements(p_appointments) AS arr(item)
  LOOP
    INSERT INTO appointments (
      member_id,
      servicing_employee_id,
      appointment_date,
      start_time,
      end_time,
      remarks,
      created_by,
      created_at
    )
    VALUES (
      p_member_id,
      rec.servicing_employee_id,
      rec.appointment_date,
      rec.start_time,
      rec.end_time,
      rec.remarks,
      p_created_by,
      p_created_at
    );
  END LOOP;
END;
$$;
