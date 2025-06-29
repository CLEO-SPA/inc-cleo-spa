CREATE OR REPLACE FUNCTION update_service_category(p_id BIGINT, p_name TEXT)
RETURNS TABLE (
  category_id BIGINT,
  category_name VARCHAR
) AS $$
DECLARE
  exists_check INT;
BEGIN
  -- Check if category exists
  PERFORM 1 FROM service_categories sc WHERE sc.id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category with ID % does not exist', p_id;
  END IF;

  -- Check for duplicate name (excluding self)
  SELECT 1 INTO exists_check
  FROM service_categories sc
  WHERE LOWER(sc.service_category_name) = LOWER(TRIM(p_name))
    AND sc.id != p_id
  LIMIT 1;

  IF exists_check IS NOT NULL THEN
    RAISE EXCEPTION 'Category name "%" already exists', p_name;
  END IF;

  -- Update and return
  RETURN QUERY
  UPDATE service_categories
  SET 
    service_category_name = TRIM(p_name),
    updated_at = NOW()
  WHERE id = p_id
  RETURNING 
    service_categories.id AS category_id,
    service_categories.service_category_name AS category_name;
END;
$$ LANGUAGE plpgsql;
