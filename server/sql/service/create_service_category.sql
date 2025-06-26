CREATE OR REPLACE FUNCTION create_service_category(p_name TEXT)
RETURNS TABLE (
  id BIGINT,
  service_category_name VARCHAR,
  service_category_sequence_no INT
) AS $$
DECLARE
  exists_check INT;
  next_seq INT;
BEGIN
  -- Check for duplicate
  SELECT 1 INTO exists_check
  FROM service_categories sc
  WHERE LOWER(sc.service_category_name) = LOWER(p_name)
  LIMIT 1;

  IF exists_check IS NOT NULL THEN
    RAISE EXCEPTION 'Category already exists';
  END IF;

  -- Get next sequence number
  SELECT COALESCE(MAX(sc.service_category_sequence_no), 0) + 1 INTO next_seq
  FROM service_categories sc;

  -- Insert and return
  RETURN QUERY
  INSERT INTO service_categories (
    service_category_name,
    service_category_sequence_no,
    created_at,
    updated_at
  )
  VALUES (
    p_name,
    next_seq,
    now(),
    now()
  )
  RETURNING 
    service_categories.id,
    service_categories.service_category_name,
    service_categories.service_category_sequence_no;
END;
$$ LANGUAGE plpgsql;
