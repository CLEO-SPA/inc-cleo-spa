CREATE OR REPLACE FUNCTION notify_data_change()
RETURNS trigger AS $$
DECLARE
    payload JSON;
BEGIN
    IF TG_OP = 'DELETE' THEN
        payload = json_build_object(
            'table', TG_TABLE_NAME,
            'action', 'delete',
            'data', row_to_json(OLD)
        );
    ELSIF TG_OP = 'INSERT' THEN
        payload = json_build_object(
            'table', TG_TABLE_NAME,
            'action', 'insert',
            'data', row_to_json(NEW)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        payload = json_build_object(
            'table', TG_TABLE_NAME,
            'action', 'update',
            'data', row_to_json(NEW),
            'old_data', row_to_json(OLD)
        );
    END IF;

    PERFORM pg_notify('db_changes', payload::text);
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER system_parameters_notify ON system_parameters;

-- Attach to system_parameters
CREATE TRIGGER system_parameters_notify
AFTER INSERT OR UPDATE OR DELETE ON system_parameters
FOR EACH ROW EXECUTE FUNCTION notify_data_change();