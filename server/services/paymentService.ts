// services/paymentService.ts
import { pool, getProdPool as prodPool } from '../config/database.js';

export const getMemberOutstandingAmounts = async (): Promise<Record<number, number>> => {
  const query = `
    WITH RECURSIVE payment_chains AS (
      SELECT 
        id,
        member_id,
        outstanding_total_payment_amount,
        id as root_transaction_id,
        created_at
      FROM sale_transactions st1
      WHERE UPPER(customer_type) = 'MEMBER' 
        AND (reference_sales_transaction_id = 0 
             OR reference_sales_transaction_id IS NULL
             OR NOT EXISTS (
               SELECT 1 FROM sale_transactions st2 
               WHERE st2.id = st1.reference_sales_transaction_id
             ))

      UNION ALL

      SELECT 
        st.id,
        st.member_id,
        st.outstanding_total_payment_amount,
        pc.root_transaction_id,
        st.created_at
      FROM sale_transactions st
      INNER JOIN payment_chains pc ON st.reference_sales_transaction_id = pc.id
      WHERE UPPER(st.customer_type) = 'MEMBER'
    ),
    latest_chain_status AS (
      SELECT DISTINCT ON (root_transaction_id)
        member_id,
        outstanding_total_payment_amount,
        root_transaction_id
      FROM payment_chains
      ORDER BY root_transaction_id, created_at DESC
    )
    SELECT 
      member_id,
      SUM(outstanding_total_payment_amount) as total_outstanding
    FROM latest_chain_status
    GROUP BY member_id;
  `;

  const result = await pool().query(query);
  const map: Record<number, number> = {};

  for (const row of result.rows) {
    map[row.member_id] = parseFloat(row.total_outstanding);
  }

  return map;
};
