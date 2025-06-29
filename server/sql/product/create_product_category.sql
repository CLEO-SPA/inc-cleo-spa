CREATE OR REPLACE FUNCTION create_product_category(p_name TEXT)
RETURNS TABLE (
  id BIGINT,
  product_category_name VARCHAR,
  product_category_sequence_no INT
) AS $$
DECLARE
  exists_check INT;
  next_seq INT;
BEGIN
  -- Check for duplicate
  SELECT 1 INTO exists_check
  FROM product_categories pc
  WHERE LOWER(pc.product_category_name) = LOWER(p_name)
  LIMIT 1;

  IF exists_check IS NOT NULL THEN
    RAISE EXCEPTION 'Category already exists';
  END IF;

  -- Get next sequence number
  SELECT COALESCE(MAX(pc.product_category_sequence_no), 0) + 1 INTO next_seq
  FROM product_categories pc;

  -- Insert and return
  RETURN QUERY
  INSERT INTO product_categories (
    product_category_name,
    product_category_sequence_no,
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
    product_categories.id,
    product_categories.product_category_name,
    product_categories.product_category_sequence_no;
END;
$$ LANGUAGE plpgsql;
