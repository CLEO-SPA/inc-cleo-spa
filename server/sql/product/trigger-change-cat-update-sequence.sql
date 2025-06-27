DROP TRIGGER IF EXISTS update_sequence_numbers ON products;

CREATE OR REPLACE FUNCTION increase_product_sequence_numbers_on_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only perform update if the category has changed
    IF NEW.product_category_id IS DISTINCT FROM OLD.product_category_id THEN
        -- Shift up the sequence numbers in the OLD category
        UPDATE products
        SET product_sequence_no = product_sequence_no - 1
        WHERE product_category_id = OLD.product_category_id
          AND product_sequence_no > OLD.product_sequence_no;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sequence_numbers
AFTER UPDATE ON products
FOR EACH ROW
WHEN (OLD.product_category_id IS NOT NULL 
AND NEW.product_category_id IS DISTINCT FROM OLD.product_category_id)
EXECUTE FUNCTION increase_product_sequence_numbers_on_update();
