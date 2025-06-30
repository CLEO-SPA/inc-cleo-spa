CREATE OR REPLACE PROCEDURE update_member_care_package(
    p_creation_date TIMESTAMPTZ,
    p_member_care_package_id BIGINT,
    p_package_name VARCHAR(100),
    p_remarks VARCHAR(255),
    p_total_amount DECIMAL(10,2),
    p_status VARCHAR(50),
    p_services JSONB,
    p_employee_id BIGINT,
    p_mode VARCHAR(50)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_service_record RECORD;
    v_member_care_package_details_id BIGINT;
    v_max_details_id BIGINT;
    v_max_items_logs_id BIGINT;
    v_max_transaction_logs_id BIGINT;
    v_details_seq_name TEXT;
    v_items_logs_seq_name TEXT;
    v_transaction_logs_seq_name TEXT;
    v_status_id_active BIGINT;
    v_status_id_details BIGINT;
    v_status_id BIGINT;
    v_invoice_id BIGINT;
    v_member_id BIGINT;
    v_current_paid_amount DECIMAL(10,2);
    v_new_outstanding_amount DECIMAL(10,2);
    v_status_id_paid BIGINT;
    v_status_id_partially_paid BIGINT;
    v_status_id_unpaid BIGINT;
    v_new_status_id BIGINT;
BEGIN
    -- Get sequence names dynamically
    v_details_seq_name := pg_get_serial_sequence('cs_member_care_package_details', 'member_care_package_details_id');
    v_items_logs_seq_name := pg_get_serial_sequence('cs_member_care_package_items_logs', 'member_care_package_items_logs_id');
    v_transaction_logs_seq_name := pg_get_serial_sequence('cs_member_care_package_transaction_logs', 'member_care_package_transaction_log_id');

    -- Check and fix sequences if needed
    SELECT COALESCE(MAX(member_care_package_details_id), 0) INTO v_max_details_id 
    FROM cs_member_care_package_details;
    IF v_max_details_id > 0 THEN
        PERFORM setval(v_details_seq_name, v_max_details_id);
    END IF;

    SELECT COALESCE(MAX(member_care_package_items_logs_id), 0) INTO v_max_items_logs_id 
    FROM cs_member_care_package_items_logs;
    IF v_max_items_logs_id > 0 THEN
        PERFORM setval(v_items_logs_seq_name, v_max_items_logs_id);
    END IF;

    SELECT COALESCE(MAX(member_care_package_transaction_log_id), 0) INTO v_max_transaction_logs_id 
    FROM cs_member_care_package_transaction_logs;
    IF v_max_transaction_logs_id > 0 THEN
        PERFORM setval(v_transaction_logs_seq_name, v_max_transaction_logs_id);
    END IF;

    -- Get status IDs
    v_status_id := get_or_create_status(p_status);
    v_status_id_active := get_or_create_status('Active');
    v_status_id_paid := get_or_create_status('Invoice_Paid');
    v_status_id_partially_paid := get_or_create_status('Invoice_Partially_Paid');
    v_status_id_unpaid := get_or_create_status('Invoice_Unpaid');

    -- Get member_id and update package
    SELECT member_id INTO v_member_id
    FROM cs_member_care_package
    WHERE member_care_package_id = p_member_care_package_id;

    -- Update member care package
    UPDATE cs_member_care_package
    SET 
        care_package_name = p_package_name,
        care_package_remarks = p_remarks,
        member_care_package_status = v_status_id,
        member_care_package_total_amount = p_total_amount,
        member_care_package_updated_at = COALESCE(p_creation_date, CURRENT_TIMESTAMP)
    WHERE member_care_package_id = p_member_care_package_id;

    -- Delete existing details
    DELETE FROM cs_member_care_package_details
    WHERE member_care_package_id = p_member_care_package_id;

    -- If mode is update_current, update invoice
    IF p_mode = 'update_current' THEN
        -- Find the associated invoice
        SELECT invoice_id, total_paid_amount INTO v_invoice_id, v_current_paid_amount
        FROM cs_invoices
        WHERE member_id = v_member_id 
        AND EXISTS (
            SELECT 1 
            FROM cs_invoice_items 
            WHERE cs_invoice_items.invoice_id = cs_invoices.invoice_id 
            AND member_care_package_id = p_member_care_package_id
        )
        ORDER BY invoice_created_at DESC
        LIMIT 1;

        IF v_invoice_id IS NOT NULL THEN
            -- Calculate new outstanding amount
            v_new_outstanding_amount := GREATEST(p_total_amount - v_current_paid_amount, 0);

            -- Determine new invoice status
            IF v_new_outstanding_amount = p_total_amount THEN
                v_new_status_id := v_status_id_unpaid;
            ELSIF v_new_outstanding_amount > 0 THEN
                v_new_status_id := v_status_id_partially_paid;
            ELSE
                v_new_status_id := v_status_id_paid;
            END IF;

            -- Update the invoice
            UPDATE cs_invoices
            SET 
                total_invoice_amount = p_total_amount,
                outstanding_total_payment_amount = v_new_outstanding_amount,
                invoice_status = v_new_status_id,
                remarks = 'Updated package: ' || p_package_name,
                invoice_updated_at = COALESCE(p_creation_date, CURRENT_TIMESTAMP)
            WHERE invoice_id = v_invoice_id;

            -- Delete existing invoice items
            DELETE FROM cs_invoice_items
            WHERE invoice_id = v_invoice_id;
        END IF;
    END IF;

    -- Process each service
    FOR v_service_record IN 
        SELECT * FROM jsonb_to_recordset(p_services) AS x(
            "serviceId" TEXT,
            "serviceName" TEXT,
            "quantity" INTEGER,
            "discount" NUMERIC,
            "price" NUMERIC,
            "status" TEXT,
            "standardPrice" NUMERIC,
            "customPrice" NUMERIC
        )
    LOOP
        FOR i IN 1..v_service_record."quantity" LOOP
            -- Get next value for details sequence
            v_member_care_package_details_id := nextval(v_details_seq_name);
            v_status_id_details := get_or_create_status(v_service_record."status");

            -- Insert member care package detail
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
                v_service_record."price",
                p_member_care_package_id,
                v_service_record."serviceId"::BIGINT,
                v_status_id_details
            );

            -- If mode is update_current and invoice exists, create new invoice item
            IF p_mode = 'update_current' AND v_invoice_id IS NOT NULL THEN
                INSERT INTO cs_invoice_items (
                    invoice_id,
                    service_name,
                    original_unit_price,
                    custom_unit_price,
                    discount_percentage,
                    quantity,
                    amount,
                    item_type,
                    member_care_package_id
                ) VALUES (
                    v_invoice_id,
                    v_service_record."serviceName",
                    v_service_record."standardPrice",
                    v_service_record."customPrice",
                    v_service_record."discount",
                    1,
                    v_service_record."price",
                    'Member_Care_Package',
                    p_member_care_package_id
                );
            END IF;

            -- Insert items log for update
            INSERT INTO cs_member_care_package_items_logs (
                member_care_package_items_logs_type,
                member_care_package_item_logs_description,
                member_care_package_item_status,
                member_care_package_item_logs_created_at,
                member_care_package_details_id
            ) VALUES (
                'UPDATE',
                format('Updated service %s (ID: %s) in package %s. Standard price: $%s, Custom price: $%s, Discount: %s%%, Status: %s,Final price: $%s', 
                    v_service_record."serviceName", 
                    v_service_record."serviceId", 
                    p_package_name,
                    v_service_record."standardPrice",
                    v_service_record."customPrice",
                    v_service_record."discount",
                    v_service_record."status",
                    v_service_record."price"),
                v_status_id_active,
                COALESCE(p_creation_date, CURRENT_TIMESTAMP),
                v_member_care_package_details_id
            );

            -- Insert transaction log only once for each service
            IF i = 1 THEN
                INSERT INTO cs_member_care_package_transaction_logs (
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
                    'UPDATE',
                    format('Updated service %s (ID: %s) in package %s with quantity %s. Total value: $%s', 
                        v_service_record."serviceName", 
                        v_service_record."serviceId", 
                        p_package_name,
                        v_service_record."quantity",
                        v_service_record."price" * v_service_record."quantity"),
                    v_service_record."price" * v_service_record."quantity",
                    COALESCE(p_creation_date, CURRENT_TIMESTAMP),
                    COALESCE(p_creation_date, CURRENT_TIMESTAMP),
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