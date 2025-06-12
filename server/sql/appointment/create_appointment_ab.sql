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
  rec2             RECORD;
  v_employee_name  text;
  conflict_count   integer;
  conflict_rec     RECORD;
  idx              integer := 0;
  idx2             integer := 0;
  v_random_employee_id bigint;
  v_processed_appointments jsonb := '[]'::jsonb;
  v_appointment jsonb;
BEGIN
  -- STEP 1: Process appointments and assign random employees where needed
  FOR rec IN
    SELECT
      CASE 
        WHEN (item->>'servicing_employee_id') IS NULL OR (item->>'servicing_employee_id')::text = 'null' 
        THEN NULL 
        ELSE (item->>'servicing_employee_id')::bigint 
      END AS servicing_employee_id,
      (item->>'appointment_date')::date          AS appointment_date,
      (item->>'start_time')::timestamptz         AS start_time,
      (item->>'end_time')::timestamptz           AS end_time,
      (item->>'remarks')::text                   AS remarks
    FROM jsonb_array_elements(p_appointments) AS arr(item)
  LOOP
    idx := idx + 1;
    
    -- If employee_id is null, find a random available employee
    IF rec.servicing_employee_id IS NULL THEN
      SELECT e.id INTO v_random_employee_id
      FROM employees e
      WHERE e.id NOT IN (
        -- Exclude employees already booked at this time (existing appointments)
        SELECT DISTINCT a.servicing_employee_id
        FROM appointments a
        WHERE a.appointment_date = rec.appointment_date
          AND rec.start_time < a.end_time
          AND rec.end_time > a.start_time
        
        UNION
        
        -- Exclude employees already assigned in this batch (from processed appointments)
        SELECT DISTINCT (processed_item->>'servicing_employee_id')::bigint
        FROM jsonb_array_elements(v_processed_appointments) AS processed_arr(processed_item)
        WHERE (processed_item->>'appointment_date')::date = rec.appointment_date
          AND rec.start_time < (processed_item->>'end_time')::timestamptz
          AND rec.end_time > (processed_item->>'start_time')::timestamptz
      )
      ORDER BY RANDOM()
      LIMIT 1;
      
      -- If no available employee found, raise exception
      IF v_random_employee_id IS NULL THEN
        RAISE EXCEPTION 
          'No available employee found for appointment % on % from % to %',
          idx,
          rec.appointment_date,
          TO_CHAR(rec.start_time, 'HH24:MI'),
          TO_CHAR(rec.end_time, 'HH24:MI');
      END IF;
      
      -- Use the randomly assigned employee
      rec.servicing_employee_id := v_random_employee_id;
    END IF;
    
    -- Add this processed appointment to our tracking array
    v_appointment := jsonb_build_object(
      'servicing_employee_id', rec.servicing_employee_id,
      'appointment_date', rec.appointment_date,
      'start_time', rec.start_time,
      'end_time', rec.end_time,
      'remarks', rec.remarks
    );
    v_processed_appointments := v_processed_appointments || v_appointment;
  END LOOP;

  -- STEP 2: Check for conflicts between appointments in the processed request
  idx := 0;
  FOR rec IN
    SELECT
      (item->>'servicing_employee_id')::bigint   AS servicing_employee_id,
      (item->>'appointment_date')::date          AS appointment_date,
      (item->>'start_time')::timestamptz         AS start_time,
      (item->>'end_time')::timestamptz           AS end_time,
      (item->>'remarks')::text                   AS remarks
    FROM jsonb_array_elements(v_processed_appointments) AS arr(item)
  LOOP
    idx := idx + 1;
    idx2 := 0;
    
    -- Check against all other appointments in the same request
    FOR rec2 IN
      SELECT
        (item->>'servicing_employee_id')::bigint   AS servicing_employee_id,
        (item->>'appointment_date')::date          AS appointment_date,
        (item->>'start_time')::timestamptz         AS start_time,
        (item->>'end_time')::timestamptz           AS end_time
      FROM jsonb_array_elements(v_processed_appointments) AS arr(item)
    LOOP
      idx2 := idx2 + 1;
      
      -- Skip comparing appointment with itself
      IF idx = idx2 THEN
        CONTINUE;
      END IF;
      
      -- Check for conflict: same employee, same date, overlapping times
      IF rec.servicing_employee_id = rec2.servicing_employee_id
         AND rec.appointment_date = rec2.appointment_date
         AND rec.start_time < rec2.end_time
         AND rec.end_time > rec2.start_time THEN
        
        -- Get employee name for error message
        SELECT INITCAP(e.employee_name) INTO v_employee_name
        FROM employees e
        WHERE e.id = rec.servicing_employee_id;
        
        RAISE EXCEPTION
          'Conflict detected between appointments in request: appointment % and % both scheduled for employee % (ID: %) on % with overlapping times',
          idx,
          idx2,
          COALESCE(v_employee_name, 'Unknown'),
          rec.servicing_employee_id,
          rec.appointment_date;
      END IF;
    END LOOP;
  END LOOP;

  -- STEP 3: Check for conflicts with existing appointments
  idx := 0;
  FOR rec IN
    SELECT
      (item->>'servicing_employee_id')::bigint   AS servicing_employee_id,
      (item->>'appointment_date')::date          AS appointment_date,
      (item->>'start_time')::timestamptz         AS start_time,
      (item->>'end_time')::timestamptz           AS end_time,
      (item->>'remarks')::text                   AS remarks
    FROM jsonb_array_elements(v_processed_appointments) AS arr(item)
  LOOP
    idx := idx + 1;
  
    -- Fetch employee name
    SELECT INITCAP(e.employee_name) INTO v_employee_name
    FROM employees e
    WHERE e.id = rec.servicing_employee_id;

    -- Check for any conflicting existing appointment
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
        TO_CHAR(conflict_rec.start_time, 'HH24:MI'),
        TO_CHAR(conflict_rec.end_time, 'HH24:MI');
    END IF;
  END LOOP;

  -- STEP 4: Insert all appointments only if all validations passed
  FOR rec IN
    SELECT
      (item->>'servicing_employee_id')::bigint   AS servicing_employee_id,
      (item->>'appointment_date')::date          AS appointment_date,
      (item->>'start_time')::timestamptz         AS start_time,
      (item->>'end_time')::timestamptz           AS end_time,
      (item->>'remarks')::text                   AS remarks
    FROM jsonb_array_elements(v_processed_appointments) AS arr(item)
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