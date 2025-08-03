CREATE OR REPLACE FUNCTION get_adhoc_service_invoice_details_by_month_year(in_month INT, in_year INT)
RETURNS TABLE (
	invoice_item_id BIGINT,
    item_type cs_item_type,
    amount DECIMAL,
    invoice_created_at TIMESTAMPTZ,
    payment_method_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
		i.invoice_item_id,             
        i.item_type,
        i.amount,
        ci.invoice_created_at,
        pm.payment_method_name
    FROM
        cs_invoice_items i
    JOIN
        cs_invoices ci ON ci.invoice_id = i.invoice_id
    JOIN
        cs_invoice_payment ip ON ip.invoice_id = i.invoice_id
    JOIN
        cs_payment_method pm ON pm.payment_method_id = ip.payment_method_id
    WHERE
        i.item_type = 'Service'
        AND EXTRACT(MONTH FROM ci.invoice_created_at) = in_month
        AND EXTRACT(YEAR FROM ci.invoice_created_at) = in_year
        AND ip.invoice_payment_id = (
            SELECT MIN(invoice_payment_id)
            FROM cs_invoice_payment
            WHERE invoice_id = i.invoice_id
        );
END;
$$ LANGUAGE plpgsql;
