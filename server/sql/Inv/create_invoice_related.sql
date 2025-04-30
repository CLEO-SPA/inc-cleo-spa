CREATE OR REPLACE PROCEDURE create_service_related_invoice(
    IN selected_member_id BIGINT,
    IN invoice_number TEXT,
    IN invoice_remark TEXT,
    IN invoice_handler_id BIGINT,
    IN payment_handler_id BIGINT,
    IN outlet_id BIGINT,
    IN services JSONB,
    IN products JSONB,
    IN line_packages JSONB,
    IN packages JSONB,
    IN payment JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    customer_type cs_customer_type;
    total_payable NUMERIC;
    total_paid NUMERIC;
    remaining_amount NUMERIC;
    v_status_name TEXT;
    status_id BIGINT;
    v_invoice_id BIGINT;
BEGIN
    -- Determine customer type
    IF selected_member_id = 1 THEN
        customer_type := 'Walk_In_Customer';
    ELSE
        customer_type := 'Member';
    END IF;

    -- Calculate totals from payment data
    total_payable := COALESCE((payment->>'totalPayable')::NUMERIC, 0);
    remaining_amount := COALESCE((payment->>'remainingAmount')::NUMERIC, 0);
    total_paid := total_payable - remaining_amount;

    -- Determine invoice status
    IF remaining_amount = total_payable THEN
        v_status_name := 'Invoice_Unpaid';
    ELSIF remaining_amount > 0 AND remaining_amount < total_payable THEN
        v_status_name := 'Invoice_Partially_Paid';
    ELSE
        v_status_name := 'Invoice_Paid';
    END IF;

    -- Get status_id
    SELECT status_id INTO status_id
    FROM cs_status
    WHERE status_name = v_status_name;

    IF status_id IS NULL THEN
        RAISE EXCEPTION 'Invalid status name: %', v_status_name;
    END IF;

    -- Create invoice record
    INSERT INTO cs_invoices (
        manual_invoice_no,
        customer_type,
        member_id,
        outlet_id,
        total_invoice_amount,
        total_paid_amount,
        outstanding_total_payment_amount,
        invoice_status,
        invoice_handler_employee_id,
        remarks,
        invoice_created_at,
        invoice_updated_at
    )
    VALUES (
        invoice_number,
        customer_type,
        selected_member_id,
        outlet_id,
        total_payable,
        total_paid,
        remaining_amount,
        status_id,
        invoice_handler_id,
        invoice_remark,
        NOW(),
        NOW()
    )
    RETURNING invoice_id INTO v_invoice_id;

    -- Insert services
    IF services IS NOT NULL AND services != '[]'::jsonb THEN
        WITH inserted_items AS (
            INSERT INTO cs_invoice_items (
                invoice_id,
                service_name,
                product_name,
                member_care_package_id,
                original_unit_price,
                custom_unit_price,
                discount_percentage,
                quantity,
                amount,
                remarks,
                item_type
            )
            SELECT
                v_invoice_id,
                (value->>'name')::TEXT,
                NULL,
                NULL,
                COALESCE((value->>'originalPrice')::NUMERIC, 0),
                COALESCE((value->>'customPrice')::NUMERIC, 0),
                COALESCE((value->>'discount')::NUMERIC, 0),
                COALESCE((value->>'quantity')::INT, 1),
                COALESCE((value->>'lineTotal')::NUMERIC, 0),
                (value->>'itemRemark')::TEXT,
                'Service'::cs_item_type
            FROM jsonb_array_elements(services) AS value
            RETURNING invoice_item_id, service_name
        )
        INSERT INTO cs_serving_employee_to_invoice_items (
            invoice_item_id,
            employee_id,
            commission_percentage,
            custom_commission_percentage,
            final_calculated_commission_value,
            reward_status,
            user_remarks,
            serving_employee_to_invoice_items_created_at
        )
        SELECT 
            i.invoice_item_id,
            (value->>'assignedEmployeeId')::BIGINT,
            (value->>'assignedEmployeeCmP')::NUMERIC,
            (value->>'assignedEmployeeCmP')::NUMERIC,
            COALESCE((value->>'lineTotal')::NUMERIC, 0) * COALESCE((value->>'assignedEmployeeCmP')::NUMERIC, 0) / 100,
            'PENDING',
            (value->>'employeeRemark')::TEXT,
            NOW()
        FROM inserted_items i
        JOIN jsonb_array_elements(services) value ON (value->>'name')::TEXT = i.service_name;
    END IF;

    -- Insert products
    IF products IS NOT NULL AND products != '[]'::jsonb THEN
        WITH inserted_items AS (
            INSERT INTO cs_invoice_items (
                invoice_id,
                service_name,
                product_name,
                member_care_package_id,
                original_unit_price,
                custom_unit_price,
                discount_percentage,
                quantity,
                amount,
                remarks,
                item_type
            )
            SELECT
                v_invoice_id,
                NULL,
                (value->>'name')::TEXT,
                NULL,
                COALESCE((value->>'originalPrice')::NUMERIC, 0),
                COALESCE((value->>'customPrice')::NUMERIC, 0),
                COALESCE((value->>'discount')::NUMERIC, 0),
                COALESCE((value->>'quantity')::INT, 1),
                COALESCE((value->>'lineTotal')::NUMERIC, 0),
                (value->>'itemRemark')::TEXT,
                'Product'::cs_item_type
            FROM jsonb_array_elements(products) AS value
            RETURNING invoice_item_id, product_name
        )
        INSERT INTO cs_serving_employee_to_invoice_items (
            invoice_item_id,
            employee_id,
            commission_percentage,
            custom_commission_percentage,
            final_calculated_commission_value,
            reward_status,
            user_remarks,
            serving_employee_to_invoice_items_created_at
        )
        SELECT 
            i.invoice_item_id,
            (value->>'assignedEmployeeId')::BIGINT,
            (value->>'assignedEmployeeCmP')::NUMERIC,
            (value->>'assignedEmployeeCmP')::NUMERIC,
            COALESCE((value->>'lineTotal')::NUMERIC, 0) * COALESCE((value->>'assignedEmployeeCmP')::NUMERIC, 0) / 100,
            'PENDING',
            (value->>'employeeRemark')::TEXT,
            NOW()
        FROM inserted_items i
        JOIN jsonb_array_elements(products) value ON (value->>'name')::TEXT = i.product_name;
    END IF;

    -- Insert packages
    IF line_packages IS NOT NULL AND line_packages != '[]'::jsonb THEN
        WITH inserted_items AS (
            INSERT INTO cs_invoice_items (
                invoice_id,
                service_name,
                product_name,
                member_care_package_id,
                original_unit_price,
                custom_unit_price,
                discount_percentage,
                quantity,
                amount,
                remarks,
                item_type
            )
            SELECT
                v_invoice_id,
                (SELECT (p->>'service_name')::TEXT 
                 FROM jsonb_array_elements(packages) p 
                 WHERE (p->>'member_care_package_id')::BIGINT = (value->>'id')::BIGINT 
                 LIMIT 1),
                NULL,
                (value->>'id')::BIGINT,
                COALESCE((value->>'originalPrice')::NUMERIC, 0),
                COALESCE((value->>'customPrice')::NUMERIC, 0),
                COALESCE((value->>'discount')::NUMERIC, 0),
                COALESCE((value->>'quantity')::INT, 1),
                COALESCE((value->>'lineTotal')::NUMERIC, 0),
                (value->>'itemRemark')::TEXT,
                'Member_Care_Package'::cs_item_type
            FROM jsonb_array_elements(line_packages) AS value
            RETURNING invoice_item_id, member_care_package_id
        )
        INSERT INTO cs_serving_employee_to_invoice_items (
            invoice_item_id,
            employee_id,
            commission_percentage,
            custom_commission_percentage,
            final_calculated_commission_value,
            reward_status,
            user_remarks,
            serving_employee_to_invoice_items_created_at
        )
        SELECT 
            i.invoice_item_id,
            (value->>'assignedEmployeeId')::BIGINT,
            (value->>'assignedEmployeeCmP')::NUMERIC,
            (value->>'assignedEmployeeCmP')::NUMERIC,
            COALESCE((value->>'lineTotal')::NUMERIC, 0) * COALESCE((value->>'assignedEmployeeCmP')::NUMERIC, 0) / 100,
            'PENDING',
            (value->>'employeeRemark')::TEXT,
            NOW()
        FROM inserted_items i
        JOIN jsonb_array_elements(line_packages) value ON i.member_care_package_id = (value->>'id')::BIGINT;
    END IF;

    -- Insert payments
    IF payment IS NOT NULL AND payment->'breakdown' IS NOT NULL THEN
        INSERT INTO cs_invoice_payment (
            invoice_id,
            payment_method_id,
            invoice_payment_amount,
            remarks,
            invoice_payment_created_by,
            invoice_payment_created_at,
            invoice_payment_updated_by,
            invoice_payment_updated_at
        )
        SELECT
            v_invoice_id,
            (value->>'id')::BIGINT,
            COALESCE((value->>'amount')::NUMERIC, 0),
            (value->>'remark')::TEXT,
            payment_handler_id,
            NOW(),
            payment_handler_id,
            NOW()
        FROM jsonb_array_elements(payment->'breakdown') AS value
        WHERE COALESCE((value->>'amount')::NUMERIC, 0) > 0;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in create_service_related_invoice: %', SQLERRM;
END;
$$;