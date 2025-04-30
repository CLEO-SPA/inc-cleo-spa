CREATE OR REPLACE FUNCTION get_or_create_status(p_status_name VARCHAR(50))
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_status_id BIGINT;
BEGIN
    -- Try to get existing status
    SELECT status_id INTO v_status_id
    FROM cs_status
    WHERE status_name = p_status_name;

    -- If not found, create new status
    IF v_status_id IS NULL THEN
        INSERT INTO cs_status (
            status_name,
            status_description,
            created_at
        ) VALUES (
            p_status_name,
            'Auto created status for ' || p_status_name,
            CURRENT_TIMESTAMP
        )
        RETURNING status_id INTO v_status_id;
    END IF;

    RETURN v_status_id;
END;
$$;