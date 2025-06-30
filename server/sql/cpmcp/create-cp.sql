CREATE OR REPLACE PROCEDURE create_care_package(
    p_date timestamptz,
    p_package_name VARCHAR,
    p_customize BOOLEAN,
    p_remarks TEXT,
    p_price NUMERIC,
    p_outlet_id BIGINT,
    p_services JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_active_status_id BIGINT;
    v_service_record RECORD;
    v_care_package_id BIGINT;
    v_care_package_item_details_id BIGINT;
    v_care_package_items_id BIGINT;
    v_max_package_id BIGINT;
    v_max_details_id BIGINT;
    v_max_items_id BIGINT;
    v_package_seq_name TEXT;
    v_details_seq_name TEXT;
    v_items_seq_name TEXT;
BEGIN
    -- Get sequence names dynamically
    v_package_seq_name := pg_get_serial_sequence('cs_care_package', 'care_package_id');
    v_details_seq_name := pg_get_serial_sequence('cs_care_package_item_details', 'care_package_item_details_id');
    v_items_seq_name := pg_get_serial_sequence('cs_care_package_items', 'care_package_items_id');

    -- Check and fix sequences if needed
    SELECT COALESCE(MAX(care_package_id), 0) INTO v_max_package_id FROM cs_care_package;
    SELECT COALESCE(MAX(care_package_item_details_id), 0) INTO v_max_details_id FROM cs_care_package_item_details;
    SELECT COALESCE(MAX(care_package_items_id), 0) INTO v_max_items_id FROM cs_care_package_items;

    IF v_max_package_id > 0 THEN
        PERFORM setval(v_package_seq_name, v_max_package_id);
    END IF;
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

    -- Get next value from sequence for care package
    v_care_package_id := nextval(v_package_seq_name);

    -- Insert care package record
    INSERT INTO cs_care_package (
        care_package_id,
        care_package_name,
        care_package_remarks,
        care_package_customizable,
        care_package_price,
        care_package_outlet,
        care_package_status,
        care_package_created_at,
        care_package_updated_at
    ) VALUES (
        v_care_package_id,
        p_package_name,
        p_remarks,
        p_customize,
        p_price,
        p_outlet_id,
        v_active_status_id,
        p_date,
        CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    );

    -- Create care package items record
    INSERT INTO cs_care_package_items (
        care_package_items_id,
        care_package_id,
        care_package_items_created_at,
        care_package_items_updated_at
    ) VALUES (
        nextval(v_items_seq_name),
        v_care_package_id,
        p_date,
        CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    );

    -- Process each service in the array
    FOR v_service_record IN 
        SELECT * FROM jsonb_to_recordset(p_services) 
        AS x(
            "serviceId" BIGINT,
            "serviceName" TEXT,
            "quantity" INTEGER,
            "discount" NUMERIC,
            "price" NUMERIC
        )
    LOOP
        -- Validate service exists
        IF NOT EXISTS (SELECT 1 FROM cs_service WHERE service_id = v_service_record."serviceId") THEN
            RAISE EXCEPTION 'Service ID % does not exist', v_service_record."serviceId";
        END IF;

        -- Insert care package item details
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
            v_care_package_id
        );
    END LOOP;

EXCEPTION 
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Active status not found in cs_status table';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error occurred: % %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;