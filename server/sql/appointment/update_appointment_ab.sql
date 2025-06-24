CREATE OR REPLACE PROCEDURE update_appointment_ab(
  IN p_member_id      bigint,
  IN p_appointments   jsonb,        
  IN p_updated_by     bigint,
  IN p_updated_at     timestamptz
)
LANGUAGE plpgsql
AS $$
DECLARE
  rec                  RECORD;
  v_employee_name      text;
  v_member_name        text;
  v_conflict_rec       RECORD;
  v_random_employee_id bigint;
BEGIN
  -- Loop through each appointment object in the JSON array
  FOR rec IN
    SELECT
      (item->>'id')::bigint                     AS appointment_id,
      CASE 
        WHEN (item->>'servicing_employee_id') IS NULL 
             OR (item->>'servicing_employee_id')::text = 'null'
        THEN NULL
        ELSE (item->>'servicing_employee_id')::bigint
      END                                     AS servicing_employee_id,
      (item->>'appointment_date')::date        AS appointment_date,
      (item->>'start_time')::timestamptz       AS start_time,
      (item->>'end_time')::timestamptz         AS end_time,
      (item->>'remarks')::text                 AS remarks
    FROM jsonb_array_elements(p_appointments) AS arr(item)
  LOOP

    -- 1) Assign random employee if NULL
    IF rec.servicing_employee_id IS NULL THEN
      SELECT e.id INTO v_random_employee_id
      FROM employees e
      WHERE e.id NOT IN (
        -- exclude employees booked at this time, except possibly the current appointment itself
        SELECT DISTINCT a2.servicing_employee_id
        FROM appointments a2
        WHERE a2.appointment_date = rec.appointment_date
          AND rec.start_time < a2.end_time
          AND rec.end_time > a2.start_time
          AND a2.id <> rec.appointment_id
      )
      ORDER BY RANDOM()
      LIMIT 1;

      IF v_random_employee_id IS NULL THEN
        RAISE EXCEPTION 
          'No available employee found for updating appointment id % on % from % to %',
          rec.appointment_id,
          rec.appointment_date,
          TO_CHAR(rec.start_time, 'HH24:MI'),
          TO_CHAR(rec.end_time, 'HH24:MI')
	      USING ERRCODE = 'P0001'; 
      END IF;
      rec.servicing_employee_id := v_random_employee_id;
    END IF;

    -- 2) External conflict check: employee conflicts excluding this appointment
    SELECT INITCAP(e.employee_name) INTO v_employee_name
    FROM employees e WHERE e.id = rec.servicing_employee_id;

    SELECT a3.start_time, a3.end_time
    INTO v_conflict_rec
    FROM appointments a3
    WHERE a3.servicing_employee_id = rec.servicing_employee_id
      AND a3.appointment_date = rec.appointment_date
      AND rec.start_time < a3.end_time
      AND rec.end_time > a3.start_time
      AND a3.id <> rec.appointment_id
    LIMIT 1;

    IF FOUND THEN
      RAISE EXCEPTION
        'Update conflict: employee % (ID: %) already has appointment on % from % to %',
        COALESCE(v_employee_name, 'Unknown'),
        rec.servicing_employee_id,
        rec.appointment_date,
        TO_CHAR(v_conflict_rec.start_time, 'HH24:MI'),
        TO_CHAR(v_conflict_rec.end_time, 'HH24:MI')
	    USING ERRCODE = 'P0001'; 
    END IF;

    -- 3) External conflict check: same member cannot have overlapping appointment, excluding this one
	SELECT INITCAP(m.name) INTO v_member_name
    FROM members m WHERE m.id = p_member_id;
	
    SELECT a4.start_time, a4.end_time
    INTO v_conflict_rec
    FROM appointments a4
    WHERE a4.member_id = p_member_id
      AND a4.appointment_date = rec.appointment_date
      AND rec.start_time < a4.end_time
      AND rec.end_time > a4.start_time
      AND a4.id <> rec.appointment_id
    LIMIT 1;

    IF FOUND THEN
      RAISE EXCEPTION
        'Update conflict: member % (ID: %) already has appointment on % from % to %',
		COALESCE(v_member_name, 'Unknown'),
        p_member_id,
        rec.appointment_date,
        TO_CHAR(v_conflict_rec.start_time, 'HH24:MI'),
        TO_CHAR(v_conflict_rec.end_time, 'HH24:MI')
		USING ERRCODE = 'P0001'; 
    END IF;

    -- 4) Perform the update
    UPDATE appointments
    SET
	  member_id              = p_member_id,
      servicing_employee_id  = rec.servicing_employee_id,
      appointment_date       = rec.appointment_date,
      start_time             = rec.start_time,
      end_time               = rec.end_time,
      remarks                = rec.remarks,
      updated_by             = p_updated_by,
      updated_at             = p_updated_at
    WHERE id = rec.appointment_id;
  END LOOP;
END;
$$;
