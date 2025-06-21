import { pool } from '../config/database.js';

const getMVMonthlyReport = async (year: number, month: number) => {
  const client = await pool().connect();
  try {
    const result1 = await client.query(`
      SELECT * FROM get_mv_income_by_month($1, $2);
      `,[year, month]
    );

    const result2 = await client.query(`
      SELECT * FROM get_mv_refund_by_month($1, $2);
      `,[year, month]
    );

    const result3 = await client.query(`
      SELECT * FROM get_mv_net_sales_by_month($1, $2);
      `,[year, month]
    );

    console.log("selected year: "+ year);
    console.log("selected month: "+ month);

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
    const result1 = await client.query(`
      SELECT * FROM get_mcp_income_by_month($1, $2);
      `,[year, month]
    );

    const result2 = await client.query(`
      SELECT * FROM get_mcp_refund_by_month($1, $2);
      `,[year, month]
    );

    const result3 = await client.query(`
      SELECT * FROM get_mcp_net_sales_by_month($1, $2);
      `,[year, month]
    );

    console.log("selected year: "+ year);
    console.log("selected month: "+ month);

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
    const result1 = await client.query(`
      SELECT * FROM get_adhoc_income_by_month($1, $2);
      `,[year, month]
    );

    const result2 = await client.query(`
      SELECT * FROM get_adhoc_service_refund_by_month($1, $2);
      `,[year, month]
    );

    console.log("selected year: "+ year);
    console.log("selected month: "+ month);

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
      `
    );

    return {
      range: result.rows[0],
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
}