DROP TRIGGER IF EXISTS update_sequence_numbers ON services;

CREATE OR REPLACE FUNCTION increase_service_sequence_numbers_on_disable()
RETURNS TRIGGER AS $$
BEGIN
    -- Only perform update if the service_is_enabled is changed
    IF NEW.service_is_enabled IS DISTINCT FROM OLD.service_is_enabled THEN
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
WHEN (NEW.service_is_enabled IS FALSE
AND NEW.service_is_enabled IS DISTINCT FROM OLD.service_is_enabled)
EXECUTE FUNCTION increase_service_sequence_numbers_on_disable();