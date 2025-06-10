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
        WHERE st.sale_transaction_status = 'REFUND'
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

const getServiceTransactionsForRefund = async (
    member_id?: number,
    member_name?: string,
    receipt_no?: string,
    start_date_utc?: string,
    end_date_utc?: string) => {

    let query = `
    SELECT 
      st.id AS sale_transaction_id,
      st.receipt_no,
      st.member_id,
      m.full_name AS member_name,
      st.total_paid_amount,
      st.created_at,
      sti.service_name,
      sti.amount AS service_amount,
      sti.quantity
    FROM sale_transactions st
    LEFT JOIN members m ON st.member_id = m.id
    JOIN sale_transaction_items sti ON st.id = sti.sale_transactions_id
    WHERE st.sale_transaction_status = 'FULL'

      AND sti.item_type = 'SERVICE'
  `;

    const values: any[] = [];
    let i = 1;

    if (member_id) {
        query += ` AND st.member_id = $${i++}`;
        values.push(member_id);
    }

    if (member_name) {
        query += ` AND m.full_name ILIKE $${i++}`;
        values.push(`%${member_name}%`);
    }

    if (receipt_no) {
        query += ` AND st.receipt_no ILIKE $${i++}`;
        values.push(`%${receipt_no}%`);
    }

    if (start_date_utc && end_date_utc) {
        query += ` AND st.created_at BETWEEN $${i++} AND $${i++}`;
        values.push(start_date_utc, end_date_utc);
    }

    query += ` ORDER BY st.created_at DESC`;

    const result = await pool().query(query, values);
    return result.rows;
};

const processRefundService = async (body: {
    saleTransactionId: number;
    refundRemarks?: string;
    refundedBy: number;
    paymentMethodId: number;
    refundItems: {
        service_name: string;
        original_unit_price: number;
        quantity: number;
        amount: number;
        remarks?: string;
    }[];
}): Promise<{ refundTransactionId: number }> => {
    const client = await pool().connect();
    try {
        await client.query('BEGIN');

        // 1. Fetch original sale transaction (to copy relevant info)
        const { rows: originalTx } = await client.query(
            `SELECT * FROM sale_transactions WHERE id = $1`,
            [body.saleTransactionId]
        );
        if (originalTx.length === 0) throw new Error('Original transaction not found');
        const original = originalTx[0];

        // 2. Insert refund sale_transaction
        const { rows: refundTxRows } = await client.query(
            `INSERT INTO sale_transactions (
                customer_type, member_id, total_paid_amount, outstanding_total_payment_amount,
                sale_transaction_status, remarks, receipt_no, reference_sales_transaction_id,
                handled_by, created_by, created_at, updated_at
            )
            VALUES ($1,$2,$3,$4,$5,$6,null,$7,$8,$8,now(),now())
            RETURNING id`,
            [
                original.customer_type,
                original.member_id,
                -1 * body.refundItems.reduce((sum, item) => sum + item.amount, 0), // refund total as negative
                0,
                'REFUND',
                body.refundRemarks ?? `Refund for transaction #${original.id}`,
                body.saleTransactionId,
                body.refundedBy,
            ]
        );
        const refundTxId = refundTxRows[0].id;

        // 3. Insert refund items
        for (const item of body.refundItems) {
            await client.query(
                `INSERT INTO sale_transaction_items (
                sale_transactions_id, service_name, original_unit_price,
                quantity, remarks, amount, item_type
                )
                VALUES ($1, $2, $3, $4, $5, $6, 'SERVICE')`,
                [
                    refundTxId,
                    item.service_name,
                    item.original_unit_price,
                    -1 * item.quantity, // negative for refund
                    item.remarks ?? '',
                    -1 * item.amount,
                ]
            );
        }

        // 4. Insert refund payment
        await client.query(
            `INSERT INTO payment_to_sale_transactions (
            payment_method_id, sale_transaction_id, amount,
            remarks, created_by, created_at, updated_by, updated_at
            ) VALUES ($1, $2, $3, $4, $5, now(), $5, now())`,
            [
                body.paymentMethodId,
                refundTxId,
                -1 * body.refundItems.reduce((sum, item) => sum + item.amount, 0),
                'Refund',
                body.refundedBy,
            ]
        );

        await client.query('COMMIT');
        return { refundTransactionId: refundTxId };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};


export default {
    getAllRefundSaleTransactionRecords,
    getServiceTransactionsForRefund,
    processRefundService
};
