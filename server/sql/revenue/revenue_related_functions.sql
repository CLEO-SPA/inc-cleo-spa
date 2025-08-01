-- Functions for Monthly Revenue
-- drop
DROP FUNCTION IF EXISTS get_mv_net_sales_by_month(INT, INT);
DROP FUNCTION IF EXISTS get_mv_refund_by_month(INT, INT);
DROP FUNCTION IF EXISTS get_mv_income_by_month(INT, INT);
DROP FUNCTION IF EXISTS get_mcp_refund_by_month(INT, INT);
DROP FUNCTION IF EXISTS get_mcp_income_by_month(INT, INT);
DROP FUNCTION IF EXISTS get_mcp_net_sales_by_month(INT, INT);
DROP FUNCTION IF EXISTS get_adhoc_service_refund_by_month(INT, INT);
DROP FUNCTION IF EXISTS get_adhoc_income_by_month(INT, INT);
DROP FUNCTION IF EXISTS get_total_paid_of_member_voucher_before(BIGINT, TIMESTAMPTZ);
--------------------------------------------------------------------------------
-- function to get total paid amount of MV before certain date
CREATE OR REPLACE FUNCTION get_total_paid_of_member_voucher_before(
    p_member_voucher_id BIGINT,
    p_timestamp TIMESTAMPTZ
)
RETURNS NUMERIC(10,2) AS $$
BEGIN
    RETURN (
        SELECT 
            COALESCE(SUM(ptst.amount), 0)::numeric(10,2)
        FROM 
            sale_transaction_items sti
        INNER JOIN 
            payment_to_sale_transactions ptst
            ON sti.sale_transaction_id = ptst.sale_transaction_id
        INNER JOIN 
            payment_methods pm
            ON ptst.payment_method_id = pm.id
        WHERE 
            sti.item_type = 'member voucher'
            AND sti.member_voucher_id = p_member_voucher_id
            AND ptst.payment_method_id IN (1, 2, 3, 4, 9)
            AND ptst.created_at <= p_timestamp
    );
END;
$$ LANGUAGE plpgsql;
--------------------------------------------------------------------------------
-- create 
-- db function to filter out MV net sales (updated to return date as string)
CREATE OR REPLACE FUNCTION get_mv_net_sales_by_month(
    target_year INT,
    target_month INT
)
RETURNS TABLE (
    service_date_gmt8 TEXT,
    total_amount_change NUMERIC(10,2),
    total_revenue_earned NUMERIC(10,2)
)
LANGUAGE SQL
AS $$
WITH paid_data AS (
  SELECT 
    mvtl.id,
    get_total_paid_of_member_voucher_before(mvtl.member_voucher_id, mvtl.service_date) AS amount_paid
  FROM member_voucher_transaction_logs mvtl
),
computed_data AS (
  SELECT 
      TO_CHAR(DATE_TRUNC('day', mvtl.service_date AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM-DD') AS service_date_gmt8,
      mvtl.amount_change,
      mv.starting_balance,
      (mv.starting_balance - mvtl.current_balance) AS amount_spent,
      pd.amount_paid,

      -- revenue_earned
      CASE 
          WHEN (mv.starting_balance - mvtl.current_balance) = pd.amount_paid
          THEN ROUND(ABS(mvtl.amount_change), 2)

          WHEN ((mv.starting_balance - mvtl.current_balance) - pd.amount_paid) < 0
          THEN ROUND(ABS(mvtl.amount_change), 2)

          WHEN ((mv.starting_balance - mvtl.current_balance) - pd.amount_paid) > 0 
          THEN 
              CASE 
                  WHEN ABS(mvtl.amount_change) > ((mv.starting_balance - mvtl.current_balance) - pd.amount_paid)
                  THEN ROUND(ABS(mvtl.amount_change) - ((mv.starting_balance - mvtl.current_balance) - pd.amount_paid), 2)
                  ELSE 0.00
              END

          ELSE 0.00
      END::NUMERIC(10,2) AS revenue_earned
  FROM 
      member_voucher_transaction_logs mvtl
  INNER JOIN 
      member_vouchers mv ON mvtl.member_voucher_id = mv.id
  INNER JOIN 
      paid_data pd ON pd.id = mvtl.id
  WHERE 
      mvtl.type = 'CONSUMPTION'
      AND EXTRACT(YEAR FROM mvtl.service_date AT TIME ZONE 'Asia/Singapore') = target_year
      AND EXTRACT(MONTH FROM mvtl.service_date AT TIME ZONE 'Asia/Singapore') = target_month
)

SELECT
  service_date_gmt8,
  SUM(ABS(amount_change))::NUMERIC(10,2),
  SUM(revenue_earned)::NUMERIC(10,2)
FROM
  computed_data
GROUP BY
  service_date_gmt8
ORDER BY
  service_date_gmt8;
$$;

-- mv refund (updated to return date as string)
CREATE OR REPLACE FUNCTION get_mv_refund_by_month(target_year INT, target_month INT)
RETURNS TABLE (
    refund_date_gmt8 TEXT,
    total_refund_amount NUMERIC(10,2)
)
LANGUAGE SQL
AS $$
SELECT 
    TO_CHAR(DATE_TRUNC('day', ptst.created_at AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM-DD') AS refund_date_gmt8,
    SUM(ABS(ptst.amount))::NUMERIC(10,2) AS total_refund_amount
FROM payment_to_sale_transactions ptst
JOIN sale_transaction_items sti
  ON sti.sale_transaction_id = ptst.sale_transaction_id
WHERE ptst.payment_method_id = (
    SELECT id
    FROM payment_methods
    WHERE payment_method_name = 'Refund'
)
AND sti.item_type = 'member voucher'
AND EXTRACT(YEAR FROM ptst.created_at AT TIME ZONE 'Asia/Singapore') = target_year
AND EXTRACT(MONTH FROM ptst.created_at AT TIME ZONE 'Asia/Singapore') = target_month
GROUP BY refund_date_gmt8
ORDER BY refund_date_gmt8;
$$;

-- mv income (updated to return date as string)
CREATE OR REPLACE FUNCTION get_mv_income_by_month(target_year INT, target_month INT)
RETURNS TABLE (
    payment_date_gmt8 TEXT,
    cash NUMERIC(10,2),
    nets NUMERIC(10,2),
    paynow NUMERIC(10,2),
    visa_mastercard NUMERIC(10,2)
)
LANGUAGE SQL
AS $$
SELECT 
    TO_CHAR(DATE_TRUNC('day', ptst.created_at AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM-DD') AS payment_date_gmt8,

    SUM(CASE WHEN ptst.payment_method_id = 1 THEN ABS(ptst.amount) ELSE 0 END)::NUMERIC(10,2) AS total_payment_1,
    SUM(CASE WHEN ptst.payment_method_id = 2 THEN ABS(ptst.amount) ELSE 0 END)::NUMERIC(10,2) AS total_payment_2,
    SUM(CASE WHEN ptst.payment_method_id = 3 THEN ABS(ptst.amount) ELSE 0 END)::NUMERIC(10,2) AS total_payment_3,
    SUM(CASE WHEN ptst.payment_method_id = 4 THEN ABS(ptst.amount) ELSE 0 END)::NUMERIC(10,2) AS total_payment_4

FROM payment_to_sale_transactions ptst
JOIN sale_transaction_items sti
  ON sti.sale_transaction_id = ptst.sale_transaction_id
WHERE ptst.payment_method_id IN (1,2,3,4)
  AND sti.item_type = 'member voucher'
  AND EXTRACT(YEAR FROM ptst.created_at AT TIME ZONE 'Asia/Singapore') = target_year
  AND EXTRACT(MONTH FROM ptst.created_at AT TIME ZONE 'Asia/Singapore') = target_month

GROUP BY payment_date_gmt8
ORDER BY payment_date_gmt8;
$$;

-- mcp refund (updated to return date as string)
CREATE OR REPLACE FUNCTION get_mcp_refund_by_month(target_year INT, target_month INT)
RETURNS TABLE (
    refund_date_gmt8 TEXT,
    total_refund_amount NUMERIC(10,2)
)
LANGUAGE SQL
AS $$
SELECT 
    TO_CHAR(DATE_TRUNC('day', sub.created_at AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM-DD') AS refund_date_gmt8,
    SUM(ABS(sub.amount))::NUMERIC(10,2) AS total_refund_amount
FROM (
    SELECT ptst.id, ptst.created_at, ptst.amount
    FROM payment_to_sale_transactions ptst
    JOIN sale_transaction_items sti
      ON sti.sale_transaction_id = ptst.sale_transaction_id
    WHERE ptst.payment_method_id = (
        SELECT id
        FROM payment_methods
        WHERE payment_method_name = 'Refund'
    )
    AND sti.item_type = 'member care package'
    AND EXTRACT(YEAR FROM ptst.created_at AT TIME ZONE 'Asia/Singapore') = target_year
    AND EXTRACT(MONTH FROM ptst.created_at AT TIME ZONE 'Asia/Singapore') = target_month
    GROUP BY ptst.id, ptst.created_at, ptst.amount
) sub
GROUP BY refund_date_gmt8
ORDER BY refund_date_gmt8;
$$;

-- mcp income (updated to return date as string)
CREATE OR REPLACE FUNCTION get_mcp_income_by_month(target_year INT, target_month INT)
RETURNS TABLE (
    payment_date_gmt8 TEXT,
    cash NUMERIC(10,2),
    nets NUMERIC(10,2),
    paynow NUMERIC(10,2),
    visa_mastercard NUMERIC(10,2)
)
LANGUAGE SQL
AS $$
SELECT 
    TO_CHAR(DATE_TRUNC('day', ptst.created_at AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM-DD') AS payment_date_gmt8,

    SUM(CASE WHEN ptst.payment_method_id = 1 THEN ABS(ptst.amount) ELSE 0 END)::NUMERIC(10,2) AS total_payment_1,
    SUM(CASE WHEN ptst.payment_method_id = 2 THEN ABS(ptst.amount) ELSE 0 END)::NUMERIC(10,2) AS total_payment_2,
    SUM(CASE WHEN ptst.payment_method_id = 3 THEN ABS(ptst.amount) ELSE 0 END)::NUMERIC(10,2) AS total_payment_3,
    SUM(CASE WHEN ptst.payment_method_id = 4 THEN ABS(ptst.amount) ELSE 0 END)::NUMERIC(10,2) AS total_payment_4

FROM payment_to_sale_transactions ptst
JOIN sale_transaction_items sti
  ON sti.sale_transaction_id = ptst.sale_transaction_id
WHERE ptst.payment_method_id IN (1,2,3,4)
  AND sti.item_type = 'member care package'
  AND EXTRACT(YEAR FROM ptst.created_at AT TIME ZONE 'Asia/Singapore') = target_year
  AND EXTRACT(MONTH FROM ptst.created_at AT TIME ZONE 'Asia/Singapore') = target_month

GROUP BY payment_date_gmt8
ORDER BY payment_date_gmt8;
$$;

-- mcp net sales (updated to return date as string)
CREATE OR REPLACE FUNCTION get_mcp_net_sales_by_month(target_year INT, target_month INT)
RETURNS TABLE (
    consumption_date_gmt8 TEXT,
    total_consumed_amount NUMERIC(10,2)
)
LANGUAGE SQL
AS $$
SELECT 
    TO_CHAR(DATE_TRUNC('day', mcptl.transaction_date AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM-DD') AS consumption_date_gmt8,
    SUM(ABS(mcptl.amount_changed))::NUMERIC(10,2) AS total_consumed_amount
FROM member_care_package_transaction_logs mcptl
WHERE mcptl.type = 'CONSUMPTION'
  AND EXTRACT(YEAR FROM mcptl.transaction_date AT TIME ZONE 'Asia/Singapore') = target_year
  AND EXTRACT(MONTH FROM mcptl.transaction_date AT TIME ZONE 'Asia/Singapore') = target_month
GROUP BY consumption_date_gmt8
ORDER BY consumption_date_gmt8;
$$;

-- adhoc service refund (updated to return date as string)
CREATE OR REPLACE FUNCTION get_adhoc_service_refund_by_month(target_year INT, target_month INT)
RETURNS TABLE (
    refund_date_gmt8 TEXT,
    total_refund_amount NUMERIC(10,2)
)
LANGUAGE SQL
AS $$
SELECT 
    TO_CHAR(DATE_TRUNC('day', ptst.created_at AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM-DD') AS refund_date_gmt8,
    SUM(ABS(ptst.amount))::NUMERIC(10,2) AS total_refund_amount
FROM payment_to_sale_transactions ptst
JOIN sale_transaction_items sti
  ON sti.sale_transaction_id = ptst.sale_transaction_id
WHERE ptst.payment_method_id = (
    SELECT id
    FROM payment_methods
    WHERE payment_method_name = 'Refund'
)
AND sti.item_type = 'service'
AND EXTRACT(YEAR FROM ptst.created_at AT TIME ZONE 'Asia/Singapore') = target_year
AND EXTRACT(MONTH FROM ptst.created_at AT TIME ZONE 'Asia/Singapore') = target_month
GROUP BY refund_date_gmt8
ORDER BY refund_date_gmt8;
$$;

-- adhoc income (updated to return date as string)
CREATE OR REPLACE FUNCTION get_adhoc_income_by_month(target_year INT, target_month INT)
RETURNS TABLE (
    payment_date_gmt8 TEXT,
    cash NUMERIC(10,2),
    nets NUMERIC(10,2),
    paynow NUMERIC(10,2),
    visa_mastercard NUMERIC(10,2)
)
LANGUAGE SQL
AS $$
SELECT 
    TO_CHAR(DATE_TRUNC('day', payment_date), 'YYYY-MM-DD') AS payment_date_gmt8,
    SUM(cash) AS cash,
    SUM(nets) AS nets,
    SUM(paynow) AS paynow,
    SUM(visa_mastercard) AS visa_mastercard
FROM (
    SELECT 
        ptst.created_at AT TIME ZONE 'Asia/Singapore' AS payment_date,
        CASE WHEN ptst.payment_method_id = 1 THEN ABS(ptst.amount) ELSE 0 END::NUMERIC(10,2) AS cash,
        CASE WHEN ptst.payment_method_id = 2 THEN ABS(ptst.amount) ELSE 0 END::NUMERIC(10,2) AS nets,
        CASE WHEN ptst.payment_method_id = 3 THEN ABS(ptst.amount) ELSE 0 END::NUMERIC(10,2) AS paynow,
        CASE WHEN ptst.payment_method_id = 4 THEN ABS(ptst.amount) ELSE 0 END::NUMERIC(10,2) AS visa_mastercard
    FROM payment_to_sale_transactions ptst
    JOIN sale_transaction_items sti
      ON sti.sale_transaction_id = ptst.sale_transaction_id
    WHERE ptst.payment_method_id IN (1,2,3,4)
      AND sti.item_type IN ('service', 'product')
      AND EXTRACT(YEAR FROM ptst.created_at AT TIME ZONE 'Asia/Singapore') = target_year
      AND EXTRACT(MONTH FROM ptst.created_at AT TIME ZONE 'Asia/Singapore') = target_month
    GROUP BY ptst.id, ptst.created_at, ptst.payment_method_id, ptst.amount
) AS daily_payments
GROUP BY payment_date_gmt8
ORDER BY payment_date_gmt8;
$$;