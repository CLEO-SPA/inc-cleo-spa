CREATE OR REPLACE PROCEDURE create_consumption_mcp(
    p_package_id BIGINT,
    p_package_detail_ids BIGINT[],
    p_service_dates JSONB,
    p_employee_id BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_detail_id BIGINT;
    v_seq_items_logs TEXT;
    v_seq_transaction_logs TEXT;
    v_max_items_logs_id BIGINT;
    v_max_transaction_logs_id BIGINT;
    v_service_id BIGINT;
    v_detail_record cs_member_care_package_details%ROWTYPE;
    v_consumed_status_id BIGINT;
    v_completed_status_id BIGINT;
    v_service_date TIMESTAMPTZ;
    v_service_name TEXT;
    v_transaction_exists BOOLEAN;
    v_transaction_date DATE;
    v_all_consumed BOOLEAN;
BEGIN
    -- Get sequence names dynamically
    v_seq_items_logs := pg_get_serial_sequence('cs_member_care_package_items_logs', 'member_care_package_items_logs_id');
    v_seq_transaction_logs := pg_get_serial_sequence('cs_member_care_package_transaction_logs', 'member_care_package_transaction_log_id');

    -- Check and fix sequences if needed
    SELECT COALESCE(MAX(member_care_package_items_logs_id), 0) INTO v_max_items_logs_id 
    FROM cs_member_care_package_items_logs;
    
    SELECT COALESCE(MAX(member_care_package_transaction_log_id), 0) INTO v_max_transaction_logs_id 
    FROM cs_member_care_package_transaction_logs;

    IF v_max_items_logs_id > 0 THEN
        PERFORM setval(v_seq_items_logs, v_max_items_logs_id);
    END IF;

    IF v_max_transaction_logs_id > 0 THEN
        PERFORM setval(v_seq_transaction_logs, v_max_transaction_logs_id);
    END IF;

    -- Get consumed and completed status IDs
    v_consumed_status_id := get_or_create_status('Consumed');
    v_completed_status_id := get_or_create_status('Completed');

    -- Validate package exists
    IF NOT EXISTS (
        SELECT 1 
        FROM cs_member_care_package 
        WHERE member_care_package_id = p_package_id
    ) THEN
        RAISE EXCEPTION 'Member care package ID % does not exist', p_package_id;
    END IF;

    -- Validate employee exists
    IF NOT EXISTS (
        SELECT 1 
        FROM cs_employees 
        WHERE employee_id = p_employee_id
    ) THEN
        RAISE EXCEPTION 'Employee ID % does not exist', p_employee_id;
    END IF;

    -- Store transaction date
    v_transaction_date := CURRENT_DATE;

    -- Process each package detail ID
    FOREACH v_detail_id IN ARRAY p_package_detail_ids
    LOOP
        -- Get detail record and validate it belongs to the package
        SELECT * INTO v_detail_record
        FROM cs_member_care_package_details 
        WHERE member_care_package_details_id = v_detail_id 
        AND member_care_package_id = p_package_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Package detail ID % does not exist or does not belong to package %', 
                v_detail_id, p_package_id;
        END IF;

        -- Get service date from JSONB
        v_service_date := (p_service_dates ->> v_detail_id::text)::timestamptz;

        -- Get service name
        SELECT s.service_name INTO v_service_name
        FROM cs_service s
        WHERE s.service_id = v_detail_record.service_id;

        -- Create items log entry with service date
        INSERT INTO cs_member_care_package_items_logs (
            member_care_package_items_logs_id,
            member_care_package_items_logs_type,
            member_care_package_item_logs_description,
            member_care_package_item_status,
            member_care_package_item_logs_created_at,
            member_care_package_details_id
        ) VALUES (
            nextval(v_seq_items_logs),
            'CONSUMED',
            format('Service %s consumed from package', v_service_name),
            v_consumed_status_id,
            v_service_date,
            v_detail_id
        );

        -- Check if transaction exists for same service and price today
        SELECT EXISTS (
            SELECT 1
            FROM cs_member_care_package_transaction_logs t
            WHERE DATE(t.member_care_package_transaction_logs_transaction_date) = v_transaction_date
            AND t.service_id = v_detail_record.service_id
            AND ABS(t.member_care_package_transaction_logs_amount) = v_detail_record.member_care_package_details_price
            AND t.member_care_package_transaction_logs_transaction_type = 'CONSUMPTION'
        ) INTO v_transaction_exists;

        IF v_transaction_exists THEN
            -- Update existing transaction
            UPDATE cs_member_care_package_transaction_logs
            SET member_care_package_transaction_logs_quantity = member_care_package_transaction_logs_quantity + 1,
                member_care_package_transaction_logs_amount = member_care_package_transaction_logs_amount - v_detail_record.member_care_package_details_price,
                member_care_package_transaction_logs_description = format('Service %s consumed from package (%s sessions)', 
                    v_service_name,
                    member_care_package_transaction_logs_quantity + 1)
            WHERE DATE(member_care_package_transaction_logs_transaction_date) = v_transaction_date
            AND service_id = v_detail_record.service_id
            AND ABS(member_care_package_transaction_logs_amount/member_care_package_transaction_logs_quantity) = v_detail_record.member_care_package_details_price
            AND member_care_package_transaction_logs_transaction_type = 'CONSUMPTION';
        ELSE
            -- Create new transaction log entry
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
                nextval(v_seq_transaction_logs),
                'CONSUMPTION',
                format('Service %s consumed from package (1 session)', v_service_name),
                -v_detail_record.member_care_package_details_price,
                v_service_date,
                CURRENT_TIMESTAMP AT TIME ZONE 'UTC',
                v_detail_id,
                p_employee_id,
                1,
                v_detail_record.service_id
            );
        END IF;

        -- Update the detail record status to consumed
        UPDATE cs_member_care_package_details
        SET status_id = v_consumed_status_id
        WHERE member_care_package_details_id = v_detail_id;
    END LOOP;

    -- Check if all details are consumed
    SELECT NOT EXISTS (
        SELECT 1
        FROM cs_member_care_package_details
        WHERE member_care_package_id = p_package_id
        AND (status_id IS NULL OR status_id != v_consumed_status_id)
    ) INTO v_all_consumed;

    -- If all details are consumed, update the package status to completed
    IF v_all_consumed THEN
        UPDATE cs_member_care_package
        SET member_care_package_status = v_completed_status_id,
            member_care_package_updated_at = CURRENT_TIMESTAMP
        WHERE member_care_package_id = p_package_id;
    END IF;

EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Error occurred: % %', SQLERRM, SQLSTATE;
        RAISE;
END;
$$;