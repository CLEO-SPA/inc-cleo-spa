CREATE OR REPLACE PROCEDURE create_temp_su(
    p_email VARCHAR(255),
    p_password_hash VARCHAR(255),
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_employee_id BIGINT;
    v_user_to_role_id BIGINT;
    v_user_auth_id BIGINT;
    v_role_id BIGINT;
    v_role_name TEXT := 'Super Admin';
BEGIN
    -- Check if the employee already exists
    SELECT id INTO v_employee_id
    FROM employees
    WHERE employee_email = p_email;

    IF v_employee_id IS NOT NULL THEN
        RAISE NOTICE 'Employee with email % already exists', p_email;
        RETURN;
    END IF;

    v_role_id := get_or_create_roles(v_role_name);

    -- Insert dummy employee
    INSERT INTO employees (
        employee_code,
        employee_contact
        employee_email,
        employee_name,
        created_at,
        updated_at
    ) VALUES (
        'SU000',
        '0000000000',
        p_email,
        'Temp Super Admin',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ) 
    RETURNING id INTO v_employee_id;

    -- Add the employee to user_auth
    INSERT INTO user_auths (
        employee_id,
        password,
        created_at,
        updated_at
    ) VALUES (
        v_employee_id,
        p_password_hash,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    RETURNING id INTO v_user_auth_id;

    -- Add the user to the role
    INSERT INTO user_to_role (
        user_id,
        role_id,
        created_at,
        updated_at
    ) VALUES (
        v_user_auth_id,
        v_role_id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    RETURNING id INTO v_user_to_role_id;

    -- Check if the user_to_role was created successfully
    IF v_user_to_role_id IS NOT NULL THEN
        RAISE NOTICE 'Super Admin user created successfully with email %', p_email;
    ELSE
        RAISE EXCEPTION 'Failed to create Super Admin user';
    END IF;
END;
$$;