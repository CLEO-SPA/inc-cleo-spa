CREATE OR REPLACE FUNCTION get_sales_history_for_each_product(
    p_product_id BIGINT,
    p_year INT,
    p_month INT
)
RETURNS TABLE (
    result_type TEXT,          -- 'monthly_summary' or 'daily_breakdown'
    product_name TEXT,
    txn_date DATE,
    adhoc_transactions BIGINT,
    adhoc_amount NUMERIC
) AS $$
DECLARE
    v_product_name TEXT;
BEGIN
    -- Get product name
    SELECT p.product_name INTO v_product_name
    FROM products p
    WHERE p.id = p_product_id;

    IF v_product_name IS NULL THEN
        RAISE EXCEPTION 'Product not found for ID %', p_product_id;
    END IF;

    -- Monthly Summary
    RETURN QUERY
    SELECT
        'monthly_summary',
        si.product_name::TEXT,
        NULL::DATE,
        COUNT(DISTINCT CASE WHEN si.item_type = 'product' THEN st.id END),
        SUM(CASE WHEN si.item_type = 'product' THEN si.amount ELSE 0 END)
    FROM sale_transactions st
    JOIN sale_transaction_items si ON si.sale_transaction_id = st.id
    WHERE EXTRACT(YEAR FROM st.created_at) = p_year
      AND EXTRACT(MONTH FROM st.created_at) = p_month
      AND si.product_name = v_product_name
    GROUP BY si.product_name;

    -- Daily Breakdown
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            DATE_TRUNC('month', MAKE_DATE(p_year, p_month, 1)),
            (DATE_TRUNC('month', MAKE_DATE(p_year, p_month, 1)) + INTERVAL '1 month - 1 day')::DATE,
            INTERVAL '1 day'
        )::DATE AS txn_date
    ),
    aggregated_data AS (
        SELECT
            st.created_at::DATE AS txn_date,
            COUNT(DISTINCT CASE WHEN si.item_type = 'product' THEN st.id END) AS total_transactions,
            SUM(CASE WHEN si.item_type = 'product' THEN si.amount ELSE 0 END) AS total_amount
        FROM sale_transactions st
        JOIN sale_transaction_items si ON si.sale_transaction_id = st.id
        WHERE EXTRACT(YEAR FROM st.created_at) = p_year
          AND EXTRACT(MONTH FROM st.created_at) = p_month
          AND si.product_name = v_product_name
        GROUP BY txn_date
    )
    SELECT
        'daily_breakdown',
        v_product_name::TEXT,
        ds.txn_date,
        COALESCE(ad.total_transactions, 0),
        COALESCE(ad.total_amount, 0)
    FROM date_series ds
    LEFT JOIN aggregated_data ad ON ds.txn_date = ad.txn_date
    ORDER BY ds.txn_date;
END;
$$ LANGUAGE plpgsql;

-- SELECT * FROM get_sales_history_for_each_product(114, 2025, 2);
