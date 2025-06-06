import { pool, getProdPool as prodPool } from '../config/database.js';


export const getLastVisitedDatesForMembers = async (): Promise<Record<number, string>> => {
const query = `
  WITH voucher_dates AS (
    SELECT 
      mv.member_id, 
      MAX(mvtl.service_date) AS last_voucher_date
    FROM member_voucher_transaction_logs mvtl
    JOIN member_vouchers mv ON mv.id = mvtl.member_voucher_id
    GROUP BY mv.member_id
  ),
  care_package_dates AS (
    SELECT 
      mcp.member_id,
      MAX(mcptl.transaction_date) AS last_care_package_date
    FROM member_care_packages mcp
    JOIN member_care_package_details mcpd 
      ON mcp.id = mcpd.member_care_package_id
    JOIN member_care_package_transaction_logs mcptl 
      ON mcptl.member_care_package_details_id = mcpd.id
    GROUP BY mcp.member_id
  ),
  sale_dates AS (
    SELECT 
      member_id,
      MAX(created_at) AS last_sale_date
    FROM sale_transactions
    WHERE customer_type = 'member'
    GROUP BY member_id
  ),
  unified_dates AS (
    SELECT 
      COALESCE(v.member_id, c.member_id, s.member_id) AS member_id,
      GREATEST(
        COALESCE(v.last_voucher_date, '0001-01-01'),
        COALESCE(c.last_care_package_date, '0001-01-01'),
        COALESCE(s.last_sale_date, '0001-01-01')
      ) AS last_visited
    FROM voucher_dates v
    FULL OUTER JOIN care_package_dates c ON v.member_id = c.member_id
    FULL OUTER JOIN sale_dates s ON COALESCE(v.member_id, c.member_id) = s.member_id
  )
  SELECT member_id, last_visited
  FROM unified_dates;
`;


  const result = await pool().query(query);
  const map: Record<number, string> = {};

  for (const row of result.rows) {
    map[row.member_id] = row.last_visited;
  }

  return map;
};