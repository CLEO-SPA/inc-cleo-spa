CREATE OR REPLACE PROCEDURE create_member_care_package(
    p_creation_date TIMESTAMPTZ,
    p_member_id BIGINT,
    p_package_name VARCHAR(100),
    p_remarks VARCHAR(255),
    p_total_amount DECIMAL(10,2),
    p_services JSONB,
    p_employee_id BIGINT,
    p_outlet_id BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_member_care_package_id BIGINT;
    v_service_record RECORD;
    v_status_id_active BIGINT;
    v_status_id_unpaid BIGINT;
    v_status_id_InvoiceUnpaid BIGINT;
    v_member_care_package_details_id BIGINT;
    v_max_package_id BIGINT;
    v_max_details_id BIGINT;
    v_max_items_logs_id BIGINT;
    v_max_transaction_logs_id BIGINT;
    v_package_seq_name TEXT;
    v_details_seq_name TEXT;
    v_items_logs_seq_name TEXT;
    v_transaction_logs_seq_name TEXT;
BEGIN
    -- Log the raw JSONB input
    RAISE NOTICE 'Raw services JSONB: %', p_services;
    
    -- Get sequence names dynamically
    v_package_seq_name := pg_get_serial_sequence('cs_member_care_package', 'member_care_package_id');
    v_details_seq_name := pg_get_serial_sequence('cs_member_care_package_details', 'member_care_package_details_id');
    v_items_logs_seq_name := pg_get_serial_sequence('cs_member_care_package_items_logs', 'member_care_package_items_logs_id');
    v_transaction_logs_seq_name := pg_get_serial_sequence('cs_member_care_package_transaction_logs', 'member_care_package_transaction_log_id');

    -- Check and fix sequences if needed
    -- Member Care Package sequence
    SELECT COALESCE(MAX(member_care_package_id), 0) INTO v_max_package_id FROM cs_member_care_package;
    IF v_max_package_id > 0 THEN
        PERFORM setval(v_package_seq_name, v_max_package_id);
    END IF;

    -- Member Care Package Details sequence
    SELECT COALESCE(MAX(member_care_package_details_id), 0) INTO v_max_details_id FROM cs_member_care_package_details;
    IF v_max_details_id > 0 THEN
        PERFORM setval(v_details_seq_name, v_max_details_id);
    END IF;

    -- Items Logs sequence
    SELECT COALESCE(MAX(member_care_package_items_logs_id), 0) INTO v_max_items_logs_id FROM cs_member_care_package_items_logs;
    IF v_max_items_logs_id > 0 THEN
        PERFORM setval(v_items_logs_seq_name, v_max_items_logs_id);
    END IF;

    -- Transaction Logs sequence
    SELECT COALESCE(MAX(member_care_package_transaction_log_id), 0) INTO v_max_transaction_logs_id FROM cs_member_care_package_transaction_logs;
    IF v_max_transaction_logs_id > 0 THEN
        PERFORM setval(v_transaction_logs_seq_name, v_max_transaction_logs_id);
    END IF;

    -- Get status IDs
    v_status_id_unpaid := get_or_create_status('Unpaid');
    v_status_id_InvoiceUnpaid := get_or_create_status('Invoice_Unpaid');
    v_status_id_active := get_or_create_status('Active');

    RAISE NOTICE 'Status IDs: unpaid=% InvoiceUnpaid=% active=%', v_status_id_unpaid, v_status_id_InvoiceUnpaid, v_status_id_active;

    -- Get next value from sequence for member care package
    v_member_care_package_id := nextval(v_package_seq_name);
    
    -- Create member care package using the pre-fetched ID
    INSERT INTO cs_member_care_package (
        member_care_package_id,
        member_id,
        member_care_package_outlet,
        employee_id,
        care_package_name,
        care_package_remarks,
        member_care_package_status,
        member_care_package_total_amount,
        member_care_package_created_at,
        member_care_package_updated_at
    ) VALUES (
        v_member_care_package_id,
        p_member_id,
        p_outlet_id,
        p_employee_id,
        p_package_name,
        p_remarks,
        v_status_id_InvoiceUnpaid,
        p_total_amount,
        COALESCE(p_creation_date, CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
        COALESCE(p_creation_date, CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
    );

    -- Process each service
    FOR v_service_record IN 
        SELECT * FROM jsonb_to_recordset(p_services) AS x(
            "serviceId" TEXT,
            "serviceName" TEXT,
            "quantity" INTEGER,
            "discount" NUMERIC,
            "price" NUMERIC,
            "standardPrice" NUMERIC,
            "customPrice" NUMERIC
        )
    LOOP
        FOR i IN 1..v_service_record."quantity" LOOP
            -- Get next value for member care package details sequence
            v_member_care_package_details_id := nextval(v_details_seq_name);

            RAISE NOTICE 'Processing service: id=% iteration=%', 
                v_service_record."serviceId", i;

            -- Insert member care package detail FIRST
            INSERT INTO cs_member_care_package_details (
                member_care_package_details_id,
                member_care_package_details_discount,
                member_care_package_details_price,
                member_care_package_id,
                service_id,
                status_id
            ) VALUES (
                v_member_care_package_details_id,
                v_service_record."discount",
                v_service_record."price" / v_service_record."quantity",   -- Price per unit
                v_member_care_package_id,
                v_service_record."serviceId"::BIGINT,
                v_status_id_unpaid
            );

            -- Insert items log for creation
            INSERT INTO cs_member_care_package_items_logs (
                member_care_package_items_logs_id,
                member_care_package_items_logs_type,
                member_care_package_item_logs_description,
                member_care_package_item_status,
                member_care_package_item_logs_created_at,
                member_care_package_details_id
            ) VALUES (
                nextval(v_items_logs_seq_name),
                'CREATE',
                format('Created service %s (ID: %s) in package %s', 
                    v_service_record."serviceName", 
                    v_service_record."serviceId", 
                    p_package_name),
                v_status_id_active,
                COALESCE(p_creation_date, CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
                v_member_care_package_details_id
            );

            -- insert transaction log only once for each service
            IF i = 1 THEN
                INSERT INTO cs_member_care_package_transaction_logs (
                    member_care_package_transaction_log_id,
                    member_care_package_transaction_logs_transaction_type,
                    member_care_package_transaction_logs_description,
                    member_care_package_transaction_logs_amount,
                    member_care_package_transaction_logs_transaction_date,
                    member_care_package_transaction_logs_created_at,
                    member_care_package_details_id,
                    employee_id,
                    member_care_package_transaction_logs_quantity,
                    service_id
                ) VALUES (
                    nextval(v_transaction_logs_seq_name),
                    'CREATE',
                    format('Service %s (ID: %s) added to package %s with quantity %s', 
                        v_service_record."serviceName", 
                        v_service_record."serviceId", 
                        p_package_name,
                        v_service_record."quantity"),
                    v_service_record."price",
                    COALESCE(p_creation_date, CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
                    COALESCE(p_creation_date, CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
                    v_member_care_package_details_id,
                    p_employee_id,
                    v_service_record."quantity",
                    v_service_record."serviceId"::BIGINT
                );
            END IF;
        END LOOP;
    END LOOP;

EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$$;