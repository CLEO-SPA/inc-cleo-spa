CREATE OR REPLACE FUNCTION get_membership_account_invoices_by_month_year(
    p_month INT,
    p_year INT
)
RETURNS TABLE (
    invoice_id BIGINT,
    invoice_created_at TIMESTAMPTZ,
    payment_method_id BIGINT,
    payment_method_name VARCHAR(50),
    invoice_payment_amount NUMERIC(10,2)
) AS
$$
BEGIN
    RETURN QUERY
    SELECT 
        ci.invoice_id, 
        ci.invoice_created_at, 
        cpm.payment_method_id, 
        cpm.payment_method_name, 
        cip.invoice_payment_amount
    FROM 
        cs_invoices ci
    INNER JOIN 
        cs_invoice_items cii ON ci.invoice_id = cii.invoice_id
    INNER JOIN 
        cs_invoice_payment cip ON ci.invoice_id = cip.invoice_id
    INNER JOIN 
        cs_payment_method cpm ON cip.payment_method_id = cpm.payment_method_id
    WHERE 
        ci.customer_type = 'Member'
        AND ci.invoice_status = (SELECT status_id FROM cs_status WHERE status_name = 'Invoice_Paid')
        AND cii.item_type = 'Membership_Account'
        AND EXTRACT(YEAR FROM ci.invoice_created_at) = p_year
        AND EXTRACT(MONTH FROM ci.invoice_created_at) = p_month;
END;
$$
LANGUAGE plpgsql;