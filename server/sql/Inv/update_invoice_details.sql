--Cifu
CREATE OR REPLACE PROCEDURE create_invoice_payment(
    p_invoice_id BIGINT,
    p_payment_method_id BIGINT,
    p_payment_handler_id BIGINT,
    p_payment_amount DECIMAL,
    p_payment_remark TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_outstanding DECIMAL;
    v_new_status BIGINT;
    v_total_paid DECIMAL;
    v_paid_status BIGINT;
    v_unpaid_status BIGINT;
BEGIN
    -- Get status IDs
    SELECT status_id INTO v_paid_status FROM cs_status WHERE status_name = 'Invoice_Paid';
    SELECT status_id INTO v_unpaid_status FROM cs_status WHERE status_name = 'Invoice_Partially_Paid';
    SELECT invoice_status INTO v_new_status FROM cs_invoices WHERE invoice_id = p_invoice_id;
    -- Get current invoice details
    SELECT 
        outstanding_total_payment_amount,
        total_paid_amount
    INTO 
        v_current_outstanding,
        v_total_paid
    FROM cs_invoices 
    WHERE invoice_id = p_invoice_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;

    -- Create payment record
    INSERT INTO cs_invoice_payment (
        payment_method_id,
        invoice_id,
        invoice_payment_amount,
        remarks,
        invoice_payment_created_by,
        invoice_payment_updated_by,
        invoice_payment_created_at,
        invoice_payment_updated_at
    ) VALUES (
        p_payment_method_id,
        p_invoice_id,
        p_payment_amount,
        p_payment_remark,
        p_payment_handler_id,
        p_payment_handler_id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

    -- Calculate new outstanding amount and total paid
    v_current_outstanding := v_current_outstanding - p_payment_amount;
    v_total_paid := v_total_paid + p_payment_amount;

    -- Set status based on payment
    IF v_current_outstanding = 0 THEN
        v_new_status := v_paid_status;
    ELSE
        v_new_status := v_unpaid_status;
    END IF;

    -- Update invoice
    UPDATE cs_invoices SET
        outstanding_total_payment_amount = v_current_outstanding,
        total_paid_amount = v_total_paid,
        invoice_status = v_new_status,
        invoice_updated_at = CURRENT_TIMESTAMP
    WHERE invoice_id = p_invoice_id;

EXCEPTION 
    WHEN OTHERS THEN
        RAISE;
END;
$$;