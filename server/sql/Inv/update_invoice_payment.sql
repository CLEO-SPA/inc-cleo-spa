CREATE OR REPLACE PROCEDURE update_mcp_payment_status(
    IN p_payment_handler_id BIGINT,
    IN p_selected_services JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_paid_status_id BIGINT;
    v_consumed_status_id BIGINT;
    v_invoice_paid_status_id BIGINT;
    v_invoice_partial_status_id BIGINT;
    v_package_id BIGINT;
    v_service JSONB;
    v_total_details_count INT;
    v_paid_details_count INT;
    v_package_details_id BIGINT;
    v_prev_package_id BIGINT := NULL;
BEGIN
    -- Get status IDs
    SELECT status_id INTO v_paid_status_id 
    FROM cs_status WHERE status_name = 'Paid';
    
    SELECT status_id INTO v_invoice_paid_status_id 
    FROM cs_status WHERE status_name = 'Invoice_Paid';
    
    SELECT status_id INTO v_invoice_partial_status_id 
    FROM cs_status WHERE status_name = 'Invoice_Partially_Paid';

    v_consumed_status_id := get_or_create_status('Consumed');

    IF v_paid_status_id IS NULL OR v_invoice_paid_status_id IS NULL 
        OR v_invoice_partial_status_id IS NULL THEN
        RAISE EXCEPTION 'Required status types not found';
    END IF;

    -- Process each service in the selected services array
    FOR v_service IN SELECT * FROM jsonb_array_elements(p_selected_services)
    LOOP
        -- Get the package ID and details ID for this service
        v_package_id := (v_service->>'member_care_package_id')::BIGINT;
        v_package_details_id := (v_service->>'member_care_package_details_id')::BIGINT;

        -- Update the service status to Paid
        UPDATE cs_member_care_package_details
        SET status_id = v_paid_status_id
        WHERE member_care_package_details_id = v_package_details_id;

        -- If this is a new package ID, create transaction log
        IF v_package_id != v_prev_package_id OR v_prev_package_id IS NULL THEN
            -- Create grouped transaction log for this package
            INSERT INTO cs_member_care_package_transaction_logs (
                member_care_package_transaction_logs_transaction_type,
                member_care_package_transaction_logs_description,
                member_care_package_transaction_logs_amount,
                member_care_package_transaction_logs_transaction_date,
                member_care_package_details_id,
                employee_id,
                service_id,
                member_care_package_transaction_logs_quantity
            )
            SELECT 
                'PAYMENT',
                format('Payment received for %s sessions', COUNT(*)),
                SUM(member_care_package_details_price),
                CURRENT_TIMESTAMP,
                MIN(member_care_package_details_id),
                p_payment_handler_id,
                service_id,
                COUNT(*)
            FROM cs_member_care_package_details
            WHERE member_care_package_id = v_package_id
            AND member_care_package_details_id IN (
                SELECT (services->>'member_care_package_details_id')::BIGINT
                FROM jsonb_array_elements(p_selected_services) AS services
                WHERE (services->>'member_care_package_id')::BIGINT = v_package_id
            )
            GROUP BY service_id;

            v_prev_package_id := v_package_id;
        END IF;

        -- Count total and paid services for this package
        SELECT COUNT(*)
        INTO v_total_details_count
        FROM cs_member_care_package_details
        WHERE member_care_package_id = v_package_id;

        SELECT COUNT(*)
        INTO v_paid_details_count
        FROM cs_member_care_package_details
        WHERE member_care_package_id = v_package_id
        AND status_id = v_paid_status_id OR status_id = v_consumed_status_id;

        -- Update package status based on paid services count
        UPDATE cs_member_care_package
        SET member_care_package_status = 
            CASE 
                WHEN v_paid_details_count = v_total_details_count THEN v_invoice_paid_status_id
                ELSE v_invoice_partial_status_id
            END,
            member_care_package_updated_at = CURRENT_TIMESTAMP
        WHERE member_care_package_id = v_package_id;
    END LOOP;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating member care package payment status: %', SQLERRM;
END;
$$;