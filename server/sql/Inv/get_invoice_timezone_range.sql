CREATE OR REPLACE FUNCTION get_invoice_timezone_range()
RETURNS TABLE (
    earliest_invoice_created_at TIMESTAMPTZ,
    latest_invoice_created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        MIN(invoice_created_at) AS earliest_invoice_created_at,
        MAX(invoice_created_at) AS latest_invoice_created_at
    FROM cs_invoices;
END;
$$ LANGUAGE plpgsql;