CREATE OR REPLACE FUNCTION set_simulation(
    p_is_simulation BOOLEAN DEFAULT FALSE,
    p_start_date_utc TIMESTAMP DEFAULT NULL,
    p_end_date_utc TIMESTAMP DEFAULT NULL
)
RETURNS system_parameters
LANGUAGE plpgsql
AS $$
DECLARE
    v_sys_parameters RECORD;
BEGIN
    -- Try to get existing system parameters
    SELECT *
    INTO v_sys_parameters
    FROM system_parameters
    WHERE id = 1;

    -- If not found, create new system parameters
    IF v_sys_parameters IS NULL THEN
        INSERT INTO system_parameters (
            is_simulation,
            start_date_utc,
            end_date_utc
        ) VALUES (
            p_is_simulation,
            p_start_date_utc,
            p_end_date_utc
        )
        RETURNING * INTO v_sys_parameters;
    ELSE
        -- Update existing system parameters
        UPDATE system_parameters
        SET
            is_simulation = p_is_simulation,
            start_date_utc = p_start_date_utc,
            end_date_utc = p_end_date_utc
        WHERE id = 1
        RETURNING * INTO v_sys_parameters;
    END IF;
    RETURN v_sys_parameters;
END;
$$;