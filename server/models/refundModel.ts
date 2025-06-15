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

    // Retrieve both member and non-member (member ID: 0) service transactions with FULL status.
    let query = `
    SELECT 
      st.id AS sale_transaction_id,
      st.receipt_no,
      st.member_id,
      m.full_name AS member_name,
      st.total_paid_amount,
      st.created_at,
      sti.id AS sale_transaction_item_id,
      sti.service_name,
      sti.amount AS service_amount,
      sti.quantity
    FROM sale_transactions st
    LEFT JOIN members m ON st.member_id = m.id
    JOIN sale_transaction_items sti ON st.id = sti.sale_transactions_id
    WHERE st.sale_transaction_status = 'FULL'
    AND sti.item_type = 'SERVICE'
    `;
    // No partial payment for adhoc services 

    const values: any[] = [];
    let i = 1;

    if (member_id !== undefined) {  // Allow 0 as a valid id (Walk-In Customer)
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
    const groupedTransactions = groupTransactions(result.rows);
    return groupedTransactions;
};

type SaleTransactionItem = {
    sale_transaction_id: number;
    receipt_no: string;
    member_id: number;
    member_name: string | null;
    total_paid_amount: number;
    created_at: string;
    sale_transaction_item_id: number;
    service_name: string;
    service_amount: number;
    quantity: number;
};

type GroupedTransaction = {
    sale_transaction_id: number;
    receipt_no: string;
    member_id: number;
    member_name: string | null;
    total_paid_amount: number;
    created_at: string;
    items: {
        id: number;
        service_name: string;
        amount: number;
        quantity: number;
    }[];
};

const groupTransactions = (rows: SaleTransactionItem[]): GroupedTransaction[] => {
    const transactionMap = new Map<number, GroupedTransaction>();

    for (const row of rows) {
        if (!transactionMap.has(row.sale_transaction_id)) {
            // Create a new transaction entry if it doesn't exist
            transactionMap.set(row.sale_transaction_id, {
                sale_transaction_id: row.sale_transaction_id,
                receipt_no: row.receipt_no,
                member_id: row.member_id,
                member_name: row.member_name,
                total_paid_amount: row.total_paid_amount,
                created_at: row.created_at,
                items: []
            });
        }

        // Push the current item into the correct transaction's items list
        transactionMap.get(row.sale_transaction_id)!.items.push({
            id: row.sale_transaction_item_id,
            service_name: row.service_name,
            amount: row.service_amount,
            quantity: row.quantity
        });
    }

    return Array.from(transactionMap.values());
};


const processRefundService = async (body: {
    saleTransactionId: number;
    refundRemarks?: string;
    refundedBy: number;
    refundItems: {
        service_transaction_item_id: number; // Required to map to employee
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

        // 1. Fetch original sale transaction
        const { rows: originalTx } = await client.query(
            `SELECT * FROM sale_transactions WHERE id = $1`,
            [body.saleTransactionId]
        );
        if (originalTx.length === 0) throw new Error('Original transaction not found');
        const original = originalTx[0];

        // 2. Insert refund sale_transaction
        const totalRefundAmount = body.refundItems.reduce((sum, item) => sum + item.amount, 0);

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
                -1 * totalRefundAmount,
                0,
                'REFUND',
                body.refundRemarks ?? `Refund for transaction #${original.id}`,
                body.saleTransactionId,
                body.refundedBy,
            ]
        );
        const refundTxId = refundTxRows[0].id;

        // 3. Insert refund items and map to employees
        for (const item of body.refundItems) {
            const { rows: refundItemRows } = await client.query(
                `INSERT INTO sale_transaction_items (
                    sale_transactions_id, service_name, original_unit_price,
                    quantity, remarks, amount, item_type
                )
                VALUES ($1, $2, $3, $4, $5, $6, 'SERVICE')
                RETURNING id`,
                [
                    refundTxId,
                    item.service_name,
                    item.original_unit_price,
                    -1 * item.quantity,
                    item.remarks ?? '',
                    -1 * item.amount,
                ]
            );

            const refundItemId = refundItemRows[0].id;

            // Insert a new entry in the serving_employee_to_sale_transaction_item table for the refund item
            // Get the original employee(s) linked to this item
            const { rows: employeeRows } = await client.query(
                `SELECT employee_id FROM serving_employee_to_sale_transaction_item WHERE sale_transaction_item_id = $1`,
                [item.service_transaction_item_id]
            );

            // Insert a new mapping for the refund item
            for (const emp of employeeRows) {
                await client.query(
                    `INSERT INTO serving_employee_to_sale_transaction_item (
                sale_transaction_item_id, employee_id, remarks
            ) VALUES ($1, $2, $3)`,
                    [refundItemId, emp.employee_id, 'Refunded Service']
                );
            }
        }

        // 4. Insert refund payment
        await client.query(
            `INSERT INTO payment_to_sale_transactions (
                payment_method_id, sale_transaction_id, amount,
                remarks, created_by, created_at, updated_by, updated_at
            ) VALUES ($1, $2, $3, $4, $5, now(), $5, now())`,
            [
                8, // Payment Method ID 8 = Refund
                refundTxId,
                -1 * totalRefundAmount,
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
