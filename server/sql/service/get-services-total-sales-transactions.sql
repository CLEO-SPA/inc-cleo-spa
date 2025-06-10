CREATE OR REPLACE FUNCTION get_total_sale_transactions(p_service_name TEXT)
RETURNS INT AS $$
DECLARE
    total_sale_transactions INT;
BEGIN
    SELECT COUNT(*) INTO total_sale_transactions
    FROM (
        SELECT * FROM sale_transaction_items WHERE item_type = 'service'
    ) AS st
    INNER JOIN services AS s ON st.service_name = s.service_name
    WHERE st.service_name ILIKE p_service_name;

    RETURN total_sale_transactions;
END;
$$ LANGUAGE plpgsql;
