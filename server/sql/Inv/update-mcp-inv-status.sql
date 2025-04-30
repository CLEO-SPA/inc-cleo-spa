--Cifu
CREATE OR REPLACE PROCEDURE update_mcp_invoice_status(
    IN employee_id BIGINT,
    IN p_paid_care_package_ids BIGINT[],
    IN p_paid_package_details JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_active_status_id BIGINT;
    v_status_id BIGINT;
    v_paid_status_id BIGINT;
    v_partial_status_id BIGINT;
    v_total_package_details RECORD;
    v_package_id BIGINT;
    v_total_details_count INT;
    v_paid_details_count INT;
    v_selected_services JSONB;
    v_service JSONB;
    v_member_care_package_details_id BIGINT;
    v_detail_price DECIMAL;
BEGIN
    -- Get status IDs
    v_active_status_id := get_or_create_status('Active');
    v_status_id := get_or_create_status('Paid');
    v_paid_status_id := get_or_create_status('Invoice_Paid');
    v_partial_status_id := get_or_create_status('Invoice_Partially_Paid');

    v_selected_services := p_paid_package_details->'selectedPackageServices';

    FOREACH v_package_id IN ARRAY p_paid_care_package_ids
    LOOP
        -- Get total count of package details
        SELECT COUNT(*)
        INTO v_total_details_count
        FROM cs_member_care_package_details
        WHERE member_care_package_id = v_package_id;

        -- Get count of paid package details for this package
        SELECT COUNT(*)
        INTO v_paid_details_count
        FROM jsonb_array_elements(v_selected_services) AS services
        WHERE (services->>'member_care_package_id')::BIGINT = v_package_id;

        IF v_paid_details_count = v_total_details_count THEN
            -- All details are paid - update main package and all details
            UPDATE cs_member_care_package
            SET member_care_package_status = v_paid_status_id,
                member_care_package_updated_at = CURRENT_TIMESTAMP
            WHERE member_care_package_id = v_package_id;

            -- Get all package details and create logs
            FOR v_member_care_package_details_id IN 
                SELECT member_care_package_details_id 
                FROM cs_member_care_package_details 
                WHERE member_care_package_id = v_package_id
            LOOP
                -- Status update log
                INSERT INTO cs_member_care_package_items_logs (
                    member_care_package_items_logs_type,
                    member_care_package_item_logs_description,
                    member_care_package_item_status,
                    member_care_package_details_id
                ) VALUES (
                    'STATUS_UPDATE',
                    'Service session marked as paid - Full package payment',
                    v_active_status_id,
                    v_member_care_package_details_id
                );
            END LOOP;

            -- Transaction log with grouped quantities for same services
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
                format('Full package payment received for %s sessions', COUNT(*)),
                SUM(member_care_package_details_price),
                CURRENT_TIMESTAMP,
                MIN(member_care_package_details_id),
                employee_id,
                service_id,
                COUNT(*)
            FROM cs_member_care_package_details 
            WHERE member_care_package_id = v_package_id
            GROUP BY service_id, employee_id;

            -- Update package details status
            UPDATE cs_member_care_package_details
            SET status_id = v_status_id
            WHERE member_care_package_id = v_package_id;
        ELSE
            -- Partial payment - update main package and specified details
            UPDATE cs_member_care_package
            SET member_care_package_status = v_partial_status_id,
                member_care_package_updated_at = CURRENT_TIMESTAMP
            WHERE member_care_package_id = v_package_id;

            -- Process each selected service for status logs
            FOR v_service IN 
                SELECT * FROM jsonb_array_elements(v_selected_services) AS services
                WHERE (services->>'member_care_package_id')::BIGINT = v_package_id
            LOOP
                -- Status update log
                INSERT INTO cs_member_care_package_items_logs (
                    member_care_package_items_logs_type,
                    member_care_package_item_logs_description,
                    member_care_package_item_status,
                    member_care_package_details_id
                ) VALUES (
                    'STATUS_UPDATE',
                    'Service session marked as paid - Partial package payment',
                    v_active_status_id,
                    (v_service->>'member_care_package_details_id')::BIGINT
                );
            END LOOP;

            -- Transaction log with grouped quantities for same services
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
                format('Partial package payment received for %s sessions', COUNT(*)),
                SUM(member_care_package_details_price),
                CURRENT_TIMESTAMP,
                MIN(cpd.member_care_package_details_id),
                employee_id,
                cpd.service_id,
                COUNT(*)
            FROM cs_member_care_package_details cpd
            WHERE member_care_package_details_id IN (
                SELECT (services->>'member_care_package_details_id')::BIGINT
                FROM jsonb_array_elements(v_selected_services) AS services
                WHERE (services->>'member_care_package_id')::BIGINT = v_package_id
            )
            GROUP BY cpd.service_id, employee_id;

            -- Update specified package details status
            UPDATE cs_member_care_package_details
            SET status_id = v_status_id
            WHERE member_care_package_details_id IN (
                SELECT (services->>'member_care_package_details_id')::BIGINT
                FROM jsonb_array_elements(v_selected_services) AS services
                WHERE (services->>'member_care_package_id')::BIGINT = v_package_id
            );
        END IF;
    END LOOP;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating member care package status: %', SQLERRM;
END;
$$;