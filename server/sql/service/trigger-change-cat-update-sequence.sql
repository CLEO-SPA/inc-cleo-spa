DROP TRIGGER IF EXISTS update_sequence_numbers ON services;

CREATE OR REPLACE FUNCTION increase_service_sequence_numbers_on_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only perform update if the category has changed
    IF NEW.service_category_id IS DISTINCT FROM OLD.service_category_id THEN
        -- Shift up the sequence numbers in the OLD category
        UPDATE services
        SET service_sequence_no = service_sequence_no - 1
        WHERE service_category_id = OLD.service_category_id
          AND service_sequence_no > OLD.service_sequence_no;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sequence_numbers
AFTER UPDATE ON services
FOR EACH ROW
WHEN (OLD.service_category_id IS NOT NULL 
AND NEW.service_category_id IS DISTINCT FROM OLD.service_category_id)
EXECUTE FUNCTION increase_service_sequence_numbers_on_update();
