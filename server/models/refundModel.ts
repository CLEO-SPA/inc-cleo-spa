import { pool } from '../config/database.js';

const getAllRefundSaleTransactionRecords = async (start_date_utc?: string, end_date_utc?: string) => {
    let query = `
    SELECT 
    st.id AS sale_transaction_id,
    st.member_id,
    st.total_paid_amount,
    st.remarks AS transaction_remarks,
    st.created_at AS transaction_date,
    sti.service_name,
    sti.quantity,
    sti.amount AS item_amount,
    sti.remarks AS item_remarks,
    ptst.amount AS refund_amount,
    ptst.remarks AS payment_remarks,
    pm.payment_method_name AS payment_method
    FROM sale_transactions st
    LEFT JOIN sale_transaction_items sti ON st.id = sti.sale_transactions_id
    LEFT JOIN payment_to_sale_transactions ptst ON st.id = ptst.sale_transaction_id
    LEFT JOIN payment_methods pm ON ptst.payment_method_id = pm.id
    WHERE st.sale_transaction_status = '14'
    `;

    const values: any[] = [];

    if (start_date_utc && end_date_utc) {
        query += ` AND st.created_at BETWEEN $1 AND $2`;
        values.push(start_date_utc, end_date_utc);
    }

    query += ` ORDER BY st.created_at DESC`;

    const result = await pool().query(query, values);
    return result.rows;
};

export default {
    getAllRefundSaleTransactionRecords
};
