-- DROP FUNCTION IF EXISTS get_sales_history_for_each_service(BIGINT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_sales_history_for_each_service(
    p_service_id BIGINT,
    p_year INT,
    p_month INT
)
RETURNS TABLE (
    result_type TEXT,          -- 'monthly_summary' or 'daily_breakdown'
    service_name TEXT,
    txn_date DATE,
    total_transactions BIGINT,
    adhoc_transactions BIGINT,
    mcp_transactions BIGINT,
    total_amount NUMERIC,
    adhoc_amount NUMERIC,
    mcp_amount NUMERIC,
    mcp_consumption BIGINT,
    mcp_consumption_amount NUMERIC
) AS $$
DECLARE
    v_service_name TEXT;
    v_mcp_consumption BIGINT;
    v_mcp_consumption_amount NUMERIC;
BEGIN
    -- Get the service name using the service_id
    SELECT s.service_name INTO v_service_name
    FROM services s
    WHERE s.id = p_service_id;

    IF v_service_name IS NULL THEN
        RAISE EXCEPTION 'Service not found for ID %', p_service_id;
    END IF;

    -- Get MCP consumption (monthly)
    SELECT COUNT(*)
    INTO v_mcp_consumption
    FROM member_care_package_transaction_logs
    WHERE service_id = p_service_id
      AND type = 'CONSUMPTION'
      AND EXTRACT(YEAR FROM created_at) = p_year
      AND EXTRACT(MONTH FROM created_at) = p_month;

    SELECT COALESCE(SUM(amount_changed), 0)
    INTO v_mcp_consumption_amount
    FROM member_care_package_transaction_logs
    WHERE service_id = p_service_id
      AND type = 'CONSUMPTION'
      AND EXTRACT(YEAR FROM created_at) = p_year
      AND EXTRACT(MONTH FROM created_at) = p_month;

    -- Monthly Summary
    RETURN QUERY
    SELECT
        'monthly_summary',
        si.service_name::TEXT,
        NULL::DATE,
        COUNT(DISTINCT st.id),
        COUNT(DISTINCT CASE WHEN si.item_type = 'service' THEN st.id END),
        COUNT(DISTINCT CASE WHEN si.item_type = 'member care package' THEN st.id END),
        SUM(si.amount),
        SUM(CASE WHEN si.item_type = 'service' THEN si.amount ELSE 0 END),
        SUM(CASE WHEN si.item_type = 'member care package' THEN si.amount ELSE 0 END),
        v_mcp_consumption,
        v_mcp_consumption_amount
    FROM sale_transactions st
    JOIN sale_transaction_items si ON si.sale_transaction_id = st.id
    WHERE EXTRACT(YEAR FROM st.created_at) = p_year
      AND EXTRACT(MONTH FROM st.created_at) = p_month
      AND si.service_name = v_service_name
    GROUP BY si.service_name;

    -- Daily Breakdown
    RETURN QUERY
	WITH date_series AS (
	    SELECT generate_series(
	        DATE_TRUNC('month', MAKE_DATE(p_year, p_month, 1)),
	        (DATE_TRUNC('month', MAKE_DATE(p_year, p_month, 1)) + INTERVAL '1 month - 1 day')::DATE,
	        INTERVAL '1 day'
	    )::DATE AS st_date
	),
	aggregated_data AS (
	    SELECT
	        st.created_at::DATE AS st_date,
	        COUNT(DISTINCT st.id) AS total_transactions,
	        COUNT(DISTINCT CASE WHEN si.item_type = 'service' THEN st.id END) AS adhoc_transactions,
	        COUNT(DISTINCT CASE WHEN si.item_type = 'member care package' THEN st.id END) AS mcp_transactions,
	        SUM(si.amount) AS total_amount,
	        SUM(CASE WHEN si.item_type = 'service' THEN si.amount ELSE 0 END) AS adhoc_amount,
	        SUM(CASE WHEN si.item_type = 'member care package' THEN si.amount ELSE 0 END) AS mcp_amount
	    FROM sale_transactions st
	    JOIN sale_transaction_items si ON si.sale_transaction_id = st.id
	    WHERE EXTRACT(YEAR FROM st.created_at) = p_year
	      AND EXTRACT(MONTH FROM st.created_at) = p_month
	      AND si.service_name = v_service_name
	    GROUP BY st_date
	)
	SELECT
	    'daily_breakdown',
	    v_service_name::TEXT,
	    ds.st_date,
	    COALESCE(ad.total_transactions, 0),
	    COALESCE(ad.adhoc_transactions, 0),
	    COALESCE(ad.mcp_transactions, 0),
	    COALESCE(ad.total_amount, 0),
	    COALESCE(ad.adhoc_amount, 0),
	    COALESCE(ad.mcp_amount, 0),
	    (
	        SELECT COUNT(*)
	        FROM member_care_package_transaction_logs mlog
	        WHERE mlog.service_id = p_service_id
	          AND mlog.type = 'CONSUMPTION'
	          AND DATE(mlog.created_at) = ds.st_date
	    ),
	    (
	        SELECT COALESCE(SUM(amount_changed), 0)
	        FROM member_care_package_transaction_logs mlog
	        WHERE mlog.service_id = p_service_id
	          AND mlog.type = 'CONSUMPTION'
	          AND DATE(mlog.created_at) = ds.st_date
	    )
	FROM date_series ds
	LEFT JOIN aggregated_data ad ON ds.st_date = ad.st_date
	ORDER BY ds.st_date;
END;
$$ LANGUAGE plpgsql;


-- SELECT * FROM get_sales_history_for_each_service(108, 2025, 2);


