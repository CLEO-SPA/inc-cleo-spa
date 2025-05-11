CREATE OR REPLACE FUNCTION get_or_create_roles(p_role_name VARCHAR(50))
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_role_id BIGINT;
BEGIN
    -- Try to get existing role
    SELECT id INTO v_role_id
    FROM roles
    WHERE role_name = p_role_name;

    -- If not found, create new role
    IF v_role_id IS NULL THEN
        INSERT INTO roles (
            role_name,
            description,
            created_at
        ) VALUES (
            p_role_name,
            'Auto created role for ' || p_role_name,
            CURRENT_TIMESTAMP
        )
        RETURNING id INTO v_role_id;
    END IF;

    RETURN v_role_id;
END;
$$;