import { pool } from '../config/database.js';

const getMVMonthlyReport = async (year: number, month: number) => {
  const client = await pool().connect();
  try {
    const result1 = await client.query(
      `
      SELECT * FROM get_mv_income_by_month($1, $2);
      `,
      [year, month]
    );

    const result2 = await client.query(
      `
      SELECT * FROM get_mv_refund_by_month($1, $2);
      `,
      [year, month]
    );

    const result3 = await client.query(
      `
      SELECT * FROM get_mv_net_sales_by_month($1, $2);
      `,
      [year, month]
    );

    return {
      income: result1.rows,
      refund: result2.rows,
      netsales: result3.rows,
    };
  } finally {
    client.release();
  }
};

const getMCPMonthlyReport = async (year: number, month: number) => {
  const client = await pool().connect();
  try {
    const result1 = await client.query(
      `
      SELECT * FROM get_mcp_income_by_month($1, $2);
      `,
      [year, month]
    );

    const result2 = await client.query(
      `
      SELECT * FROM get_mcp_refund_by_month($1, $2);
      `,
      [year, month]
    );

    const result3 = await client.query(
      `
      SELECT * FROM get_mcp_net_sales_by_month($1, $2);
      `,
      [year, month]
    );

    return {
      income: result1.rows,
      refund: result2.rows,
      netsales: result3.rows,
    };
  } finally {
    client.release();
  }
};

const getAdHocMonthlyReport = async (year: number, month: number) => {
  const client = await pool().connect();
  try {
    const result1 = await client.query(
      `
      SELECT * FROM get_adhoc_income_by_month($1, $2);
      `,
      [year, month]
    );

    const result2 = await client.query(
      `
      SELECT * FROM get_adhoc_service_refund_by_month($1, $2);
      `,
      [year, month]
    );

    return {
      income: result1.rows,
      refund: result2.rows,
    };
  } finally {
    client.release();
  }
};

const getTransactionDateRange = async () => {
  const client = await pool().connect();
  try {
    const result = await client.query(`
      SELECT 
        TO_CHAR(MIN(created_at AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM-DD') AS earliest_created_at_sgt,
        TO_CHAR(MAX(created_at AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM-DD') AS latest_created_at_sgt
      FROM sale_transactions;
      `);

    return {
      range: result.rows[0],
    };
  } finally {
    client.release();
  }
};

const getMVDeferredRevenue = async () => {
  const client = await pool().connect();
  try {
    const result = await client.query(`
WITH net_sales AS (
    SELECT 
        TO_CHAR((mvtl.service_date AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM') AS transaction_month,
        SUM(
            CASE 
                WHEN (mv.starting_balance - mvtl.current_balance) = pd.amount_paid THEN ROUND(ABS(mvtl.amount_change), 2)
                WHEN ((mv.starting_balance - mvtl.current_balance) - pd.amount_paid) < 0 THEN ROUND(ABS(mvtl.amount_change), 2)
                WHEN ((mv.starting_balance - mvtl.current_balance) - pd.amount_paid) > 0 THEN 
                    CASE 
                        WHEN ABS(mvtl.amount_change) > ((mv.starting_balance - mvtl.current_balance) - pd.amount_paid)
                        THEN ROUND(ABS(mvtl.amount_change) - ((mv.starting_balance - mvtl.current_balance) - pd.amount_paid), 2)
                        ELSE 0.00
                    END
                ELSE 0.00
            END
        )::NUMERIC(10,2) AS net_sale
    FROM 
        member_voucher_transaction_logs mvtl
    JOIN 
        member_vouchers mv ON mvtl.member_voucher_id = mv.id
    JOIN LATERAL (
        SELECT get_total_paid_of_member_voucher_before(mvtl.member_voucher_id, mvtl.service_date) AS amount_paid
    ) pd ON TRUE
    WHERE 
        mvtl.type = 'CONSUMPTION'
    GROUP BY 
        TO_CHAR((mvtl.service_date AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM')
),
income_data AS (
    SELECT 
        TO_CHAR((ptst.created_at AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM') AS transaction_month,
        SUM(ptst.amount)::NUMERIC(10,2) AS income
    FROM 
        payment_to_sale_transactions ptst
    JOIN 
        payment_methods pm ON pm.id = ptst.payment_method_id
    JOIN 
        sale_transaction_items sti ON sti.sale_transaction_id = ptst.sale_transaction_id
    WHERE 
        pm.is_enabled = true 
        AND pm.is_income = true
        AND sti.item_type = 'member voucher'
    GROUP BY 
        TO_CHAR((ptst.created_at AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM')
),
refund_data AS (
    SELECT 
        TO_CHAR((ptst.created_at AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM') AS transaction_month,
        ABS(SUM(ptst.amount))::NUMERIC(10,2) AS refund
    FROM 
        payment_to_sale_transactions ptst
    JOIN 
        sale_transaction_items sti ON sti.sale_transaction_id = ptst.sale_transaction_id
    WHERE 
        ptst.payment_method_id = (
            SELECT id
            FROM payment_methods
            WHERE payment_method_name = 'Refund'
        )
        AND sti.item_type = 'member voucher'
    GROUP BY 
        TO_CHAR((ptst.created_at AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM')
)

SELECT 
    COALESCE(i.transaction_month, n.transaction_month, r.transaction_month) AS transaction_month,
    COALESCE(i.income, 0.00)::NUMERIC(10,2) AS income,
    COALESCE(n.net_sale, 0.00)::NUMERIC(10,2) AS net_sale,
    COALESCE(r.refund, 0.00)::NUMERIC(10,2) AS refund,
    (COALESCE(i.income, 0.00) - COALESCE(n.net_sale, 0.00) - COALESCE(r.refund, 0.00))::NUMERIC(10,2) AS deferred_amount
FROM 
    income_data i
FULL OUTER JOIN net_sales n 
    ON i.transaction_month = n.transaction_month
FULL OUTER JOIN refund_data r 
    ON COALESCE(i.transaction_month, n.transaction_month) = r.transaction_month
ORDER BY 
    transaction_month;
      `);

    return {
      result,
    };
  } finally {
    client.release();
  }
};

const getMCPDeferredRevenue = async () => {
  const client = await pool().connect();
  try {
    const result = await client.query(`
WITH mcp_net_sales AS (
    SELECT 
        TO_CHAR((mcptl.transaction_date AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM') AS transaction_month,
        SUM(ABS(mcptl.amount_changed))::NUMERIC(10,2) AS net_sale
    FROM 
        member_care_package_transaction_logs mcptl
    WHERE 
        mcptl.type = 'CONSUMPTION'
    GROUP BY 
        TO_CHAR((mcptl.transaction_date AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM')
),
mcp_income AS (
    SELECT 
        TO_CHAR((ptst.created_at AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM') AS transaction_month,
        SUM(ptst.amount)::NUMERIC(10,2) AS income
    FROM 
        payment_to_sale_transactions ptst
    JOIN 
        payment_methods pm ON pm.id = ptst.payment_method_id
    JOIN 
        sale_transaction_items sti ON sti.sale_transaction_id = ptst.sale_transaction_id
    WHERE 
        pm.is_enabled = true 
        AND pm.is_income = true
        AND sti.item_type = 'member care package'
    GROUP BY 
        TO_CHAR((ptst.created_at AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM')
),
mcp_refund AS (
    SELECT 
        TO_CHAR(DATE_TRUNC('month', sub.created_at AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM') AS transaction_month,
        SUM(ABS(sub.amount))::NUMERIC(10,2) AS refund
    FROM (
        SELECT ptst.id, ptst.created_at, ptst.amount
        FROM payment_to_sale_transactions ptst
        JOIN sale_transaction_items sti ON sti.sale_transaction_id = ptst.sale_transaction_id
        WHERE 
            ptst.payment_method_id = (
                SELECT id
                FROM payment_methods
                WHERE payment_method_name = 'Refund'
            )
            AND sti.item_type = 'member care package'
        GROUP BY ptst.id, ptst.created_at, ptst.amount
    ) sub
    GROUP BY TO_CHAR(DATE_TRUNC('month', sub.created_at AT TIME ZONE 'Asia/Singapore'), 'YYYY-MM')
)

SELECT 
    COALESCE(n.transaction_month, i.transaction_month, f.transaction_month) AS transaction_month,
    COALESCE(i.income, 0.00)::NUMERIC(10,2) AS income,
    COALESCE(n.net_sale, 0.00)::NUMERIC(10,2) AS net_sale,
    COALESCE(f.refund, 0.00)::NUMERIC(10,2) AS refund,
    (COALESCE(i.income, 0.00) - COALESCE(n.net_sale, 0.00) - COALESCE(f.refund, 0.00))::NUMERIC(10,2) AS deferred_amount
FROM 
    mcp_net_sales n
FULL OUTER JOIN mcp_income i ON n.transaction_month = i.transaction_month
FULL OUTER JOIN mcp_refund f ON COALESCE(n.transaction_month, i.transaction_month) = f.transaction_month
ORDER BY 
    transaction_month;
      `);

    return {
      result,
    };
  } finally {
    client.release();
  }
};

export default {
  getMVMonthlyReport,
  getMCPMonthlyReport,
  getAdHocMonthlyReport,
  getTransactionDateRange,
  getMVDeferredRevenue,
  getMCPDeferredRevenue,
};
