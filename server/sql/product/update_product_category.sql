CREATE OR REPLACE FUNCTION update_product_category(p_id BIGINT, p_name TEXT)
RETURNS TABLE (
  category_id BIGINT,
  category_name VARCHAR
) AS $$
DECLARE
  exists_check INT;
BEGIN
  -- Check if category exists
  PERFORM 1 FROM product_categories pc WHERE pc.id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category with ID % does not exist', p_id;
  END IF;

  -- Check for duplicate name (excluding self)
  SELECT 1 INTO exists_check
  FROM product_categories pc
  WHERE LOWER(pc.product_category_name) = LOWER(TRIM(p_name))
    AND pc.id != p_id
  LIMIT 1;

  IF exists_check IS NOT NULL THEN
    RAISE EXCEPTION 'Category name "%" already exists', p_name;
  END IF;

  -- Update and return
  RETURN QUERY
  UPDATE product_categories
  SET 
    product_category_name = TRIM(p_name),
    updated_at = NOW()
  WHERE id = p_id
  RETURNING 
    product_categories.id AS category_id,
    product_categories.product_category_name AS category_name;
END;
$$ LANGUAGE plpgsql;
