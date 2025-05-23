CREATE OR REPLACE FUNCTION set_simulation(
    p_is_simulation BOOLEAN DEFAULT FALSE,
    p_start_date_utc TIMESTAMP DEFAULT NULL,
    p_end_date_utc TIMESTAMP DEFAULT NULL
)
RETURNS system_parameters
LANGUAGE plpgsql
AS $$
DECLARE
    v_sys_parameters system_parameters;
BEGIN
    -- Update or insert system parameters
    INSERT INTO system_parameters (id, is_simulation, start_date_utc, end_date_utc)
    VALUES (1, p_is_simulation, p_start_date_utc, p_end_date_utc)
    ON CONFLICT (id) DO UPDATE SET
        is_simulation = EXCLUDED.is_simulation,
        start_date_utc = EXCLUDED.start_date_utc,
        end_date_utc = EXCLUDED.end_date_utc
    RETURNING * INTO v_sys_parameters;

    RETURN v_sys_parameters;
END;
$$;