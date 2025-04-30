--Cifu
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
    customer_type TEXT;
    total_payable NUMERIC;
    total_paid NUMERIC;
    remaining_amount NUMERIC;
    v_status_name TEXT;
    status_id BIGINT;
    v_invoice_id BIGINT;
    v_current_month INT;
    v_current_year INT;
    pkg RECORD;
    pkg_detail RECORD;
BEGIN
    -- Get current month and year for reward period
    SELECT 
        EXTRACT(MONTH FROM CURRENT_DATE)::INT,
        EXTRACT(YEAR FROM CURRENT_DATE)::INT
    INTO v_current_month, v_current_year;

    -- Determine customer type
    IF selected_member_id = 1 THEN
        customer_type := 'Walk_In_Customer';
    ELSE
        customer_type := 'Member';
    END IF;

    -- Calculate totals from payment data with COALESCE to avoid NULL errors
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

    -- Fetch status_id safely
    SELECT cs_status.status_id INTO status_id
    FROM cs_status
    WHERE cs_status.status_name = v_status_name
    LIMIT 1;

    IF status_id IS NULL THEN
        RAISE EXCEPTION 'Status with name % not found.', v_status_name;
    END IF;

    -- Insert into cs_invoices
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
        customer_type::cs_customer_type,
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
    RETURNING cs_invoices.invoice_id INTO v_invoice_id;

    -- Insert services and their serving employees
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
            commission_percentage,
            custom_commission_percentage,
            final_calculated_commission_value,
            reward_status,
            rewarded_for_period_month,
            rewarded_for_period_year,
            system_generated_remarks,
            user_remarks,
            serving_employee_to_invoice_items_created_at,
            serving_employee_to_invoice_items_updated_at,
            invoice_item_id,
            reviewed_by_employee_id,
            sharing_ratio,
            employee_id,
            final_revenue_performance
        )
        SELECT
            (s.value->>'assignedEmployeeCmP')::DECIMAL,
            (s.value->>'assignedEmployeeCmP')::DECIMAL,
            COALESCE((s.value->>'lineTotal')::NUMERIC, 0) * 
                (s.value->>'assignedEmployeeCmP')::DECIMAL / 100,
            'Approve',
            v_current_month,
            v_current_year,
            NULL,
            (s.value->>'employeeRemark')::TEXT,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            i.invoice_item_id,
            invoice_handler_id,
            100,
            (s.value->>'assignedEmployeeId')::BIGINT,
            NULL
        FROM jsonb_array_elements(services) s(value)
        JOIN inserted_items i ON i.service_name = (s.value->>'name')::TEXT;
    END IF;

    -- Insert products and their serving employees
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
            commission_percentage,
            custom_commission_percentage,
            final_calculated_commission_value,
            reward_status,
            rewarded_for_period_month,
            rewarded_for_period_year,
            system_generated_remarks,
            user_remarks,
            serving_employee_to_invoice_items_created_at,
            serving_employee_to_invoice_items_updated_at,
            invoice_item_id,
            reviewed_by_employee_id,
            sharing_ratio,
            employee_id,
            final_revenue_performance
        )
        SELECT
            (p.value->>'assignedEmployeeCmP')::DECIMAL,
            (p.value->>'assignedEmployeeCmP')::DECIMAL,
            COALESCE((p.value->>'lineTotal')::NUMERIC, 0) * 
                (p.value->>'assignedEmployeeCmP')::DECIMAL / 100,
            'Approve',
            v_current_month,
            v_current_year,
            NULL,
            (p.value->>'employeeRemark')::TEXT,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            i.invoice_item_id,
            invoice_handler_id,
            100,
            (p.value->>'assignedEmployeeId')::BIGINT,
            NULL
        FROM jsonb_array_elements(products) p(value)
        JOIN inserted_items i ON i.product_name = (p.value->>'name')::TEXT;
    END IF;

    -- Insert packages and their serving employees
    IF line_packages IS NOT NULL AND line_packages != '[]'::jsonb THEN
        FOR pkg IN 
            SELECT value FROM jsonb_array_elements(line_packages) AS value
        LOOP
            FOR pkg_detail IN 
                SELECT value FROM jsonb_array_elements(pkg.value->'packageDetails') AS value
            LOOP
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
                    VALUES (
                        v_invoice_id,
                        (pkg_detail.value->>'service_name')::TEXT,
                        NULL,
                        (pkg.value->>'member_care_package_id')::BIGINT,
                        (pkg_detail.value->>'service_default_price')::NUMERIC,
                        (pkg_detail.value->>'member_care_package_details_unit_price')::NUMERIC,
                        0,
                        1,
                        (pkg_detail.value->>'member_care_package_details_unit_price')::NUMERIC,
                        (pkg.value->>'employeeRemark')::TEXT,
                        'Member_Care_Package'::cs_item_type
                    )
                    RETURNING invoice_item_id
                )
                INSERT INTO cs_serving_employee_to_invoice_items (
                    commission_percentage,
                    custom_commission_percentage,
                    final_calculated_commission_value,
                    reward_status,
                    rewarded_for_period_month,
                    rewarded_for_period_year,
                    system_generated_remarks,
                    user_remarks,
                    serving_employee_to_invoice_items_created_at,
                    serving_employee_to_invoice_items_updated_at,
                    invoice_item_id,
                    reviewed_by_employee_id,
                    sharing_ratio,
                    employee_id,
                    final_revenue_performance
                )
                SELECT
                    (pkg.value->>'assignedEmployeeCmP')::DECIMAL,
                    (pkg.value->>'assignedEmployeeCmP')::DECIMAL,
                    (pkg_detail.value->>'member_care_package_details_unit_price')::NUMERIC * 
                        (pkg.value->>'assignedEmployeeCmP')::DECIMAL / 100,
                    'Approve',
                    v_current_month,
                    v_current_year,
                    NULL,
                    (pkg.value->>'employeeRemark')::TEXT,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP,
                    i.invoice_item_id,
                    invoice_handler_id,
                    100,
                    (pkg.value->>'assignedEmployeeId')::BIGINT,
                    NULL
                FROM inserted_items i;
            END LOOP;
        END LOOP;
    END IF;

    -- Insert payment records
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
            COALESCE((value->>'id')::BIGINT, NULL),
            COALESCE((value->>'amount')::NUMERIC, 0),
            (value->>'remark')::TEXT,
            payment_handler_id,
            NOW(),
            payment_handler_id,
            NOW()
        FROM jsonb_array_elements(payment->'breakdown') AS value;
    END IF;

    RAISE NOTICE 'Invoice and serving employee records created successfully';
END;
$$;