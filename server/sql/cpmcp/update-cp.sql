CREATE OR REPLACE PROCEDURE update_care_package(
    p_care_package_id BIGINT,
    p_date TIMESTAMPTZ,
    p_package_name VARCHAR,
    p_remarks TEXT,
    p_price NUMERIC,
    p_outlet_id BIGINT,
    p_services JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_service_record RECORD;
    v_care_package_item_details_id BIGINT;
    v_care_package_items_id BIGINT;
    v_max_details_id BIGINT;
    v_max_items_id BIGINT;
    v_details_seq_name TEXT;
    v_items_seq_name TEXT;
    v_is_customizable BOOLEAN;
    v_active_status_id BIGINT;
BEGIN
    -- Get sequence names dynamically
    v_details_seq_name := pg_get_serial_sequence('cs_care_package_item_details', 'care_package_item_details_id');
    v_items_seq_name := pg_get_serial_sequence('cs_care_package_items', 'care_package_items_id');

    -- Check if care package exists and get customizable status
    SELECT care_package_customizable INTO v_is_customizable
    FROM cs_care_package 
    WHERE care_package_id = p_care_package_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Care package ID % does not exist', p_care_package_id;
    END IF;

    -- Check if package is customizable
    IF NOT v_is_customizable THEN
        RAISE EXCEPTION 'Care package ID % is not customizable', p_care_package_id;
    END IF;

    -- Check and fix sequences if needed
    SELECT COALESCE(MAX(care_package_item_details_id), 0) INTO v_max_details_id 
    FROM cs_care_package_item_details;
    
    SELECT COALESCE(MAX(care_package_items_id), 0) INTO v_max_items_id 
    FROM cs_care_package_items;

    IF v_max_details_id > 0 THEN
        PERFORM setval(v_details_seq_name, v_max_details_id);
    END IF;

    IF v_max_items_id > 0 THEN
        PERFORM setval(v_items_seq_name, v_max_items_id);
    END IF;

    -- Input validation
    IF p_package_name IS NULL OR p_package_name = '' THEN
        RAISE EXCEPTION 'Package name cannot be empty';
    END IF;

    IF p_price IS NULL OR p_price <= 0 THEN
        RAISE EXCEPTION 'Package price must be greater than 0';
    END IF;

    -- Validate outlet exists
    IF NOT EXISTS (SELECT 1 FROM cs_outlet WHERE outlet_id = p_outlet_id) THEN
        RAISE EXCEPTION 'Outlet ID % does not exist', p_outlet_id;
    END IF;

    -- Get active status ID
    v_active_status_id := get_or_create_status('Active');

    -- Update care package record
    UPDATE cs_care_package SET
        care_package_name = p_package_name,
        care_package_remarks = p_remarks,
        care_package_price = p_price,
        care_package_outlet = p_outlet_id,
        care_package_status = v_active_status_id,
        care_package_created_at = p_date,
        care_package_updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    WHERE care_package_id = p_care_package_id;

    -- Create care package items record for tracking changes
    INSERT INTO cs_care_package_items (
        care_package_items_id,
        care_package_id,
        care_package_items_created_at,
        care_package_items_updated_at
    ) VALUES (
        nextval(v_items_seq_name),
        p_care_package_id,
        CURRENT_TIMESTAMP AT TIME ZONE 'UTC',
        CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    );

    -- Delete existing care package item details
    DELETE FROM cs_care_package_item_details 
    WHERE care_package_id = p_care_package_id;

    -- Process each service in the array
    FOR v_service_record IN 
        SELECT * FROM jsonb_to_recordset(p_services) 
        AS x(
            "serviceId" BIGINT,
            "quantity" INTEGER,
            "discount" NUMERIC,
            "price" NUMERIC
        )
    LOOP
        -- Validate service exists
        IF NOT EXISTS (SELECT 1 FROM cs_service WHERE service_id = v_service_record."serviceId") THEN
            RAISE EXCEPTION 'Service ID % does not exist', v_service_record."serviceId";
        END IF;

        -- Insert new care package item details
        INSERT INTO cs_care_package_item_details (
            care_package_item_details_id,
            care_package_item_details_quantity,
            care_package_item_details_discount,
            care_package_item_details_price,
            service_id,
            care_package_id
        ) VALUES (
            nextval(v_details_seq_name),
            v_service_record."quantity",
            v_service_record."discount",
            v_service_record."price",
            v_service_record."serviceId",
            p_care_package_id
        );
    END LOOP;

EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Error occurred: % %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;