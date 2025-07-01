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
    LEFT JOIN sale_transaction_items sti ON st.id = sti.sale_transaction_id
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

const getSaleTransactionItemById = async (itemId: number) => {
  const query = `
    WITH original_item AS (
      SELECT 
        sti.*,
        st.id AS original_transaction_id,
        st.created_at AS transaction_created_at,
        m.name AS member_name,
        m.email AS member_email,
        m.contact AS member_contact,
        st.member_id
      FROM sale_transaction_items sti
      JOIN sale_transactions st ON st.id = sti.sale_transaction_id
      LEFT JOIN members m ON st.member_id = m.id
      WHERE sti.id = $1
    ),
    refunded_qty AS (
      SELECT 
        SUM(ABS(sti_ref.quantity)) AS total_refunded_quantity
      FROM original_item oi
      JOIN sale_transactions refund_st 
        ON refund_st.reference_sales_transaction_id = oi.original_transaction_id
      JOIN sale_transaction_items sti_ref 
        ON sti_ref.sale_transaction_id = refund_st.id
      WHERE 
        sti_ref.service_name = oi.service_name AND
        sti_ref.item_type = 'service' AND
        COALESCE(sti_ref.original_unit_price, 0) = COALESCE(oi.original_unit_price, 0) AND
        COALESCE(sti_ref.custom_unit_price, 0) = COALESCE(oi.custom_unit_price, 0) AND
        COALESCE(sti_ref.discount_percentage, 0) = COALESCE(oi.discount_percentage, 0)
    )
    SELECT 
      oi.*,
      COALESCE(rq.total_refunded_quantity, 0) AS total_refunded_quantity,
      (oi.quantity - COALESCE(rq.total_refunded_quantity, 0)) AS remaining_quantity
    FROM original_item oi
    LEFT JOIN refunded_qty rq ON true
    LIMIT 1;
  `;

  const result = await pool().query(query, [itemId]);
  return result.rows[0]; // Fixed typo here (Rows -> rows)
};


const getServiceTransactionsForRefund = async (
  member_id?: number,
  member_name?: string,
  receipt_no?: string,
  start_date_utc?: string,
  end_date_utc?: string,
  limit?: number,
  offset?: number
) => {
  let baseQuery = `
    FROM sale_transactions st
    LEFT JOIN members m ON st.member_id = m.id
    JOIN sale_transaction_items sti ON st.id = sti.sale_transaction_id

    -- Include pricing attributes in refund grouping to distinguish items
    LEFT JOIN (
      SELECT
        refund_st.reference_sales_transaction_id AS original_sale_transaction_id,
        refund_sti.service_name,
        refund_sti.original_unit_price,
        refund_sti.custom_unit_price,
        refund_sti.discount_percentage,
        SUM(ABS(refund_sti.quantity)) AS refunded_quantity
      FROM sale_transactions refund_st
      JOIN sale_transaction_items refund_sti ON refund_st.id = refund_sti.sale_transaction_id
      WHERE refund_st.sale_transaction_status = 'REFUND'
      GROUP BY 
        refund_st.reference_sales_transaction_id,
        refund_sti.service_name,
        refund_sti.original_unit_price,
        refund_sti.custom_unit_price,
        refund_sti.discount_percentage
    ) refunded_sum 
      ON refunded_sum.original_sale_transaction_id = st.id
      AND refunded_sum.service_name = sti.service_name
      AND COALESCE(refunded_sum.original_unit_price, 0) = COALESCE(sti.original_unit_price, 0)
      AND COALESCE(refunded_sum.custom_unit_price, 0) = COALESCE(sti.custom_unit_price, 0)
      AND COALESCE(refunded_sum.discount_percentage, 0) = COALESCE(sti.discount_percentage, 0)

    WHERE st.sale_transaction_status = 'FULL'
      AND sti.item_type = 'service'
      AND (sti.quantity - COALESCE(refunded_sum.refunded_quantity, 0)) > 0
  `;


  const values: any[] = [];
  let i = 1;

  if (member_id !== undefined) {
    baseQuery += ` AND st.member_id = $${i++}`;
    values.push(member_id);
  }

  if (member_name) {
    baseQuery += ` AND m.name ILIKE $${i++}`;
    values.push(`%${member_name}%`);
  }

  if (receipt_no) {
    baseQuery += ` AND st.receipt_no ILIKE $${i++}`;
    values.push(`%${receipt_no}%`);
  }

  if (start_date_utc && end_date_utc) {
    baseQuery += ` AND st.created_at BETWEEN $${i++} AND $${i++}`;
    values.push(start_date_utc, end_date_utc);
  }

  // Get total count (before pagination)
  const countResult = await pool().query(
    `SELECT COUNT(DISTINCT st.id) AS total ${baseQuery}`,
    values
  );
  const total = Number(countResult.rows[0].total);

  // Select with adjusted quantity and amount
  let dataQuery = `
    SELECT 
      st.id AS sale_transaction_id,
      st.receipt_no,
      st.member_id,
      m.name AS member_name,
      m.email AS member_email,
      m.contact AS member_contact,
      st.total_paid_amount,
      st.created_at,
      sti.id AS sale_transaction_item_id,
      sti.service_name,
      sti.original_unit_price,
      sti.custom_unit_price,
      sti.discount_percentage,
      sti.quantity - COALESCE(refunded_sum.refunded_quantity, 0) AS unrefunded_quantity,
      -- Calculate prorated unrefunded amount based on unit price and unrefunded quantity
      CASE
        WHEN sti.quantity > 0 THEN
          (sti.amount / sti.quantity) * (sti.quantity - COALESCE(refunded_sum.refunded_quantity, 0))
        ELSE 0
      END AS unrefunded_amount
    ${baseQuery}
    ORDER BY st.created_at DESC
  `;

  if (limit !== undefined) {
    dataQuery += ` LIMIT $${i++}`;
    values.push(limit);
  }
  if (offset !== undefined) {
    dataQuery += ` OFFSET $${i++}`;
    values.push(offset);
  }

  const result = await pool().query(dataQuery, values);

  type SaleTransactionItem = {
    sale_transaction_id: number;
    receipt_no: string;
    member_id: number;
    member_name: string | null;
    member_email: string | null;
    member_contact: string | null;
    total_paid_amount: number;
    created_at: string;
    sale_transaction_item_id: number;
    service_name: string;
    original_unit_price: number | null;
    custom_unit_price: number | null;
    discount_percentage: number | null;
    unrefunded_quantity: number;
    unrefunded_amount: number;
  };

  type GroupedTransaction = {
    sale_transaction_id: number;
    receipt_no: string;
    member_id: number;
    member_name: string | null;
    member_email: string | null;
    member_contact: string | null;
    total_paid_amount: number;
    created_at: string;
    items: {
      id: number;
      service_name: string;
      amount: number;
      quantity: number;
      original_unit_price: number | null;
      custom_unit_price: number | null;
      discount_percentage: number | null;
    }[];
  };

  const groupTransactions = (rows: SaleTransactionItem[]): GroupedTransaction[] => {
    const transactionMap = new Map<number, GroupedTransaction>();

    for (const row of rows) {
      if (!transactionMap.has(row.sale_transaction_id)) {
        transactionMap.set(row.sale_transaction_id, {
          sale_transaction_id: row.sale_transaction_id,
          receipt_no: row.receipt_no,
          member_id: row.member_id,
          member_name: row.member_name,
          member_email: row.member_email,
          member_contact: row.member_contact,
          total_paid_amount: row.total_paid_amount,
          created_at: row.created_at,
          items: []
        });
      }

      transactionMap.get(row.sale_transaction_id)!.items.push({
        id: row.sale_transaction_item_id,
        service_name: row.service_name,
        amount: row.unrefunded_amount,
        quantity: row.unrefunded_quantity,
        original_unit_price: row.original_unit_price,
        custom_unit_price: row.custom_unit_price,
        discount_percentage: row.discount_percentage,
      });
    }

    return Array.from(transactionMap.values());
  };

  const groupedTransactions = groupTransactions(result.rows);

  return {
    transactions: groupedTransactions,
    total,
  };
};


const processRefundService = async (body: {
  saleTransactionId: number;
  refundRemarks?: string;
  refundedBy: number; // the person who submitted
  handledBy?: number; //the person who handled the refund
  creditNoteNo?: string;
  refundDate?: string;
  refundItems: {
    sale_transaction_item_id: number;
    service_name: string;
    original_unit_price: number;
    custom_unit_price?: number | null;
    discount_percentage?: number | null;
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

    const refundDate = body.refundDate ? new Date(body.refundDate) : new Date();

    const { rows: refundTxRows } = await client.query(
      `INSERT INTO sale_transactions (
    customer_type, member_id, total_paid_amount, outstanding_total_payment_amount,
    sale_transaction_status, remarks, receipt_no, reference_sales_transaction_id,
    handled_by, created_by, created_at, updated_at
  )
  VALUES ($1,$2,$3,$4,$5,$6,null,$7,$8,$9,$10,$10)
  RETURNING id`,
      [
        original.customer_type,
        original.member_id,
        -1 * totalRefundAmount,
        0,
        'REFUND',
        `Refund for transaction #${original.id}`,
        body.saleTransactionId,
        body.handledBy || body.refundedBy, // use handledBy if available, fallback to refundedBy
        body.refundedBy,
        refundDate, // created_at
      ]
    );
    const refundTxId = refundTxRows[0].id;

    /*
    const refundDateStr = refundDate.toISOString().slice(0, 10).replace(/-/g, '');
    const receiptNo = `R-SVC-${refundTxId}-${refundDateStr}`;
    */

    const receiptNo = body.creditNoteNo?.trim() || null;

    await client.query(
      `UPDATE sale_transactions SET receipt_no = $1 WHERE id = $2`,
      [receiptNo, refundTxId]
    );

    // 3. Insert refund items and map to employees
    for (const item of body.refundItems) {
      // Check if the item is refundable
      const { rows: refundCheckRows } = await client.query(
        `
      WITH original_item AS (
      SELECT sti.*, st.id AS original_tx_id
      FROM sale_transaction_items sti
      JOIN sale_transactions st ON st.id = sti.sale_transaction_id
      WHERE sti.id = $1
    ),
    refunded_qty AS (
      SELECT SUM(ABS(sti_ref.quantity)) AS total_refunded_quantity
      FROM original_item oi
      JOIN sale_transactions refund_tx 
        ON refund_tx.reference_sales_transaction_id = oi.original_tx_id
      JOIN sale_transaction_items sti_ref 
        ON sti_ref.sale_transaction_id = refund_tx.id
      WHERE sti_ref.service_name = oi.service_name
        AND sti_ref.item_type = 'service'
        AND COALESCE(sti_ref.original_unit_price, 0) = COALESCE(oi.original_unit_price, 0)
        AND COALESCE(sti_ref.custom_unit_price, 0) = COALESCE(oi.custom_unit_price, 0)
        AND COALESCE(sti_ref.discount_percentage, 0) = COALESCE(oi.discount_percentage, 0)
    )
    SELECT 
      oi.quantity,
      COALESCE(rq.total_refunded_quantity, 0) AS total_refunded_quantity,
      (oi.quantity - COALESCE(rq.total_refunded_quantity, 0)) AS remaining_quantity
    FROM original_item oi
    LEFT JOIN refunded_qty rq ON true
  `,
        [item.sale_transaction_item_id]
      );

      if (refundCheckRows.length === 0) {
        throw new Error(`Sale transaction item ${item.sale_transaction_item_id} not found`);
      }

      const { remaining_quantity } = refundCheckRows[0];
      if (item.quantity > remaining_quantity) {
        throw new Error(
          `Refund quantity exceeds remaining refundable quantity for item ID ${item.sale_transaction_item_id}. Remaining: ${remaining_quantity}, Requested: ${item.quantity}`
        );
      }

      // Insert refund item
      const { rows: refundItemRows } = await client.query(
        `INSERT INTO sale_transaction_items (
                    sale_transaction_id, 
                    service_name, 
                    original_unit_price,
                    custom_unit_price,
                    discount_percentage,
                    quantity, 
                    remarks, 
                    amount, 
                    item_type
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'service')
                RETURNING id`,
        [
          refundTxId,
          item.service_name,
          item.original_unit_price,
          item.custom_unit_price || null,
          item.discount_percentage || null,
          -1 * item.quantity,
          item.remarks ?? 'REFUNDED',
          -1 * item.amount,
        ]

      );

      const refundItemId = refundItemRows[0].id;

      /*
      // Insert a new entry in the serving_employee_to_sale_transaction_item table for the refund item
      // Get the original employee(s) linked to this item
      const { rows: employeeRows } = await client.query(
        `SELECT employee_id FROM serving_employee_to_sale_transaction_item WHERE sale_transaction_item_id = $1`,
        [item.sale_transaction_item_id]
      );

      // Insert a new mapping for the refund item
      for (const emp of employeeRows) {
        await client.query(
          `INSERT INTO serving_employee_to_sale_transaction_item (
          sale_transaction_item_id, employee_id, remarks, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $4)`,
          [refundItemId, emp.employee_id, 'Refunded Service', refundDate]
        );
      }
      */
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

/////////////////////

/* const getStatusId = async (statusName: string) => {
  const { rows } = await pool().query(
    `SELECT id FROM statuses WHERE status_name = $1`,
    [statusName]
  );
  return rows[0].id;
}; */

const getMCPById = async (mcpId: number) => {
  const { rows } = await pool().query(
    `SELECT id, member_id, status 
     FROM member_care_packages 
     WHERE id = $1`,
    [mcpId]
  );
  return rows[0] || null;
};

const getRemainingServices = async (mcpId: number) => {
  const { rows } = await pool().query(
    `SELECT 
       id, service_id, service_name,
       quantity, price, discount
     FROM member_care_package_details
     WHERE member_care_package_id = $1
     AND quantity > 0`,
    [mcpId]
  );
  return rows;
};

const processFullRefundTransaction = async (params: {
  mcpId: number;
  memberId: number;
  remainingServices: Array<{
    id: number;
    service_id: number;
    service_name: string;
    quantity: number;
    price: number;
    discount: number;
  }>;
  refundedBy: number;
  refundRemarks?: string;
  refundDate?: Date;
}) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    // Format the refund date (use current date if not provided)
    const refundDate = params.refundDate || new Date();
    const formattedRefundDate = refundDate.toISOString();

    // Calculate total refund
    const totalRefund = parseFloat(params.remainingServices.reduce((sum, service) => {
      return sum + (service.price * service.quantity);
    }, 0).toFixed(2));

    // Look up Refund payment method
    const { rows: paymentMethodRows } = await client.query(
      `SELECT id FROM payment_methods WHERE payment_method_name = 'Refund' LIMIT 1`
    );
    const refundPaymentMethodId = paymentMethodRows[0]?.id;

    if (!refundPaymentMethodId) {
      throw new Error('Refund payment method not found in database');
    }

    // Generate receipt number (R + MCP ID + timestamp)
    const receiptNo = `R-${String(params.mcpId).padStart(4, '0')}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;

    // Create refund transaction
    const { rows: saleTransactionIdRows } = await client.query(
      `SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM sale_transactions`
    );
    const saleTransactionNextId = saleTransactionIdRows[0].next_id;

    const { rows: txRows } = await client.query(
      `INSERT INTO sale_transactions (
        id, customer_type, member_id, total_paid_amount, 
        outstanding_total_payment_amount, sale_transaction_status,
        remarks, receipt_no, handled_by, created_by, created_at, updated_at
      ) VALUES (
        $1, 'MEMBER', $2, $3, 0, 'REFUND',
        $4, $5, $6, $7, $8, $8
      ) RETURNING id`,
      [
        saleTransactionNextId,
        params.memberId,
        (-totalRefund).toFixed(2),
        params.refundRemarks,
        receiptNo,
        params.refundedBy,
        params.refundedBy,
        formattedRefundDate
      ]
    );
    const refundTxId = txRows[0].id;

    // Process each service
    const refundedServices = [];
    for (const service of params.remainingServices) {
      const amount = parseFloat(((service.price) * service.quantity).toFixed(2));

      // Get original purchase details
      const { rows: originalPurchaseRows } = await client.query(
        `SELECT original_unit_price, discount_percentage, custom_unit_price
         FROM sale_transaction_items 
         WHERE member_care_package_id = $1 AND service_name = $2
         ORDER BY id DESC LIMIT 1`,
        [params.mcpId, service.service_name]
      );
      const originalPurchase = originalPurchaseRows[0] || {
        original_unit_price: service.price,
        discount_percentage: service.discount,
        custom_unit_price: service.price
      };

      // Insert transaction item
      const { rows: itemIdRows } = await client.query(
        `SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM sale_transaction_items`
      );
      const itemNextId = itemIdRows[0].next_id;

      await client.query(
        `INSERT INTO sale_transaction_items (
          id, sale_transaction_id, service_name, member_care_package_id,
          original_unit_price, custom_unit_price, discount_percentage, 
          quantity, amount, item_type, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'member care package', $10)`,
        [
          itemNextId,
          refundTxId,
          service.service_name,
          params.mcpId,
          originalPurchase.original_unit_price,
          originalPurchase.custom_unit_price,
          originalPurchase.discount_percentage,
          -service.quantity,
          -amount,
          `Refund - ${params.refundRemarks || 'No remarks provided'}`
        ]
      );

      // Insert transaction log
      const { rows: logIdRows } = await client.query(
        `SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM member_care_package_transaction_logs`
      );
      const logNextId = logIdRows[0].next_id;

      await client.query(
        `INSERT INTO member_care_package_transaction_logs (
          id, type, description, transaction_amount,
          amount_changed, member_care_package_details_id,
          employee_id, service_id, transaction_date, created_at
        ) VALUES (
          $1, 'REFUND', $2, $3, $4, $5, $6, $7, $8, $8
        )`,
        [
          logNextId,
          `Refunded ${service.quantity} session(s) of ${service.service_name}`,
          -amount,
          amount,
          service.id,
          params.refundedBy,
          service.service_id,
          formattedRefundDate
        ]
      );

      refundedServices.push({
        serviceName: service.service_name,
        quantity: service.quantity,
        amount
      });
    }

    // Create refund payment
    const { rows: paymentIdRows } = await client.query(
      `SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM payment_to_sale_transactions`
    );
    const paymentNextId = paymentIdRows[0].next_id;

    await client.query(
      `INSERT INTO payment_to_sale_transactions (
        id, payment_method_id, sale_transaction_id, amount,
        remarks, created_by, updated_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
      [
        paymentNextId,
        refundPaymentMethodId,
        refundTxId,
        -totalRefund,
        params.refundRemarks || 'Refund processed',
        params.refundedBy,
        params.refundedBy,
        formattedRefundDate
      ]
    );

    // Update MCP status - changed from status_id to status
    await client.query(
      `UPDATE member_care_packages
       SET status = 'Refunded'
       WHERE id = $1`,
      [params.mcpId]
    );

    await client.query('COMMIT');

    return {
      refundTransactionId: refundTxId,
      totalRefund,
      refundedServices,
      refundDate: refundDate.toISOString(),
      receiptNo
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Refund processing failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Update the model's fetchMCPStatusById to include price and discount
const fetchMCPStatusById = async (packageId: number) => {
  const query = `
    WITH purchase_totals AS (
      SELECT 
        mcpd.id AS detail_id,
        COALESCE(SUM(mcpctl.transaction_amount), 0) / NULLIF(mcpd.price, 0) AS purchased_quantity
      FROM member_care_package_details mcpd
      LEFT JOIN member_care_package_transaction_logs mcpctl 
        ON mcpd.id = mcpctl.member_care_package_details_id
        AND mcpctl.type = 'PURCHASE'
      WHERE mcpd.member_care_package_id = $1
      GROUP BY mcpd.id, mcpd.price
    ),
    consumption_totals AS (
      SELECT 
        mcpd.id AS detail_id,
        COUNT(CASE WHEN mcpctl.type = 'CONSUMPTION' THEN 1 END) AS consumed
      FROM member_care_package_details mcpd
      LEFT JOIN member_care_package_transaction_logs mcpctl 
        ON mcpd.id = mcpctl.member_care_package_details_id
        AND mcpctl.type = 'CONSUMPTION'
      WHERE mcpd.member_care_package_id = $1
      GROUP BY mcpd.id
    ),
    refund_totals AS (
      SELECT 
        mcpd.id AS detail_id,
        COUNT(CASE WHEN mcpctl.type = 'REFUND' THEN 1 END) AS refunded
      FROM member_care_package_details mcpd
      LEFT JOIN member_care_package_transaction_logs mcpctl 
        ON mcpd.id = mcpctl.member_care_package_details_id
        AND mcpctl.type = 'REFUND'
      WHERE mcpd.member_care_package_id = $1
      GROUP BY mcpd.id
    )
    SELECT 
      mcp.id AS package_id,
      mcp.package_name,
      mcpd.id,
      mcpd.service_id,
      mcpd.service_name,
      mcpd.price,
      mcpd.discount,
      mcpd.quantity AS original_quantity,
      FLOOR(COALESCE(pt.purchased_quantity, 0)) AS purchased,
      COALESCE(ct.consumed, 0) AS consumed,
      COALESCE(rt.refunded, 0) AS refunded,
      CASE 
        WHEN COALESCE(rt.refunded, 0) > 0 THEN 0
        ELSE (FLOOR(COALESCE(pt.purchased_quantity, 0)) - COALESCE(ct.consumed, 0))
      END AS remaining,
      GREATEST(mcpd.quantity - FLOOR(COALESCE(pt.purchased_quantity, 0)), 0) AS unpaid
    FROM member_care_packages mcp
    JOIN member_care_package_details mcpd 
      ON mcp.id = mcpd.member_care_package_id
    LEFT JOIN purchase_totals pt 
      ON mcpd.id = pt.detail_id
    LEFT JOIN consumption_totals ct 
      ON mcpd.id = ct.detail_id
    LEFT JOIN refund_totals rt 
      ON mcpd.id = rt.detail_id
    WHERE mcp.id = $1;
  `;

  const { rows } = await pool().query(query, [packageId]);
  return rows;
};

const searchMembers = async (searchQuery: string) => {
  const query = `
    SELECT 
      m.id,
      m.name, 
      m.email,
      m.contact AS phone,  
      m.membership_type_id AS membership_status
    FROM members m
    WHERE 
      m.membership_type_id IS NOT NULL AND 
      (
        m.name ILIKE $1 OR 
        m.email ILIKE $1 OR
        m.contact ILIKE $1 OR
        m.id::TEXT = $1
      )
    LIMIT 20
  `;
  const { rows } = await pool().query(query, [`%${searchQuery}%`]);
  return rows;
};

const getMemberCarePackages = async (memberId: number) => {
  const query = `
    WITH package_stats AS (
      SELECT 
        mcp.id AS package_id,
        mcpd.id AS detail_id,
        COUNT(CASE WHEN mcpctl.type = 'CONSUMPTION' THEN 1 END) AS consumed,
        COUNT(CASE WHEN mcpctl.type = 'REFUND' THEN 1 END) AS refunded
      FROM member_care_packages mcp
      JOIN member_care_package_details mcpd ON mcp.id = mcpd.member_care_package_id
      LEFT JOIN member_care_package_transaction_logs mcpctl 
        ON mcpd.id = mcpctl.member_care_package_details_id
      WHERE mcp.member_id = $1
      GROUP BY mcp.id, mcpd.id
    )
    SELECT 
      mcp.id,
      mcp.package_name,
      mcp.total_price,
      mcp.package_remarks,
      mcp.created_at,
      mcp.updated_at,
      mem.name AS member_name,
      emp.employee_name AS employee_name,
      mcp.status,  -- Changed from s.status_name to mcp.status
      mcpd.service_name,
      mcpd.discount,
      mcpd.price,
      mcpd.quantity,
      (mcpd.quantity - COALESCE(ps.consumed, 0)) AS remaining,
      CASE 
        WHEN ps.refunded > 0 THEN 'refunded'
        WHEN (mcpd.quantity - COALESCE(ps.consumed, 0)) > 0 THEN 'eligible'
        ELSE 'ineligible'
      END AS is_eligible_for_refund
    FROM member_care_packages mcp
    JOIN member_care_package_details mcpd ON mcp.id = mcpd.member_care_package_id
    JOIN members mem ON mem.id = mcp.member_id
    JOIN employees emp ON emp.id = mcp.employee_id
    LEFT JOIN package_stats ps ON mcp.id = ps.package_id AND mcpd.id = ps.detail_id
    WHERE mcp.member_id = $1
    ORDER BY mcp.created_at DESC
  `;

  const { rows } = await pool().query(query, [memberId]);
  return rows;
};

const searchMemberCarePackages = async (searchQuery: string, memberId: number | null) => {
  const query = `
    WITH package_stats AS (
      SELECT 
        mcp.id AS package_id,
        mcpd.id AS detail_id,
        COUNT(CASE WHEN mcpctl.type = 'CONSUMPTION' THEN 1 END) AS consumed,
        COUNT(CASE WHEN mcpctl.type = 'REFUND' THEN 1 END) AS refunded
      FROM member_care_packages mcp
      JOIN member_care_package_details mcpd ON mcp.id = mcpd.member_care_package_id
      LEFT JOIN member_care_package_transaction_logs mcpctl 
        ON mcpd.id = mcpctl.member_care_package_details_id
      ${memberId ? 'WHERE mcp.member_id = $2' : ''}
      GROUP BY mcp.id, mcpd.id
    )
    SELECT 
      mcp.id,
      mcp.package_name,
      mcp.total_price,
      mcp.package_remarks,
      mcp.created_at,
      mcp.updated_at,
      mem.name AS member_name,
      emp.employee_name,
      mcp.status,  -- Changed from s.status_name to mcp.status
      mcpd.service_name,
      mcpd.discount,
      mcpd.price,
      mcpd.quantity,
      (mcpd.quantity - COALESCE(ps.consumed, 0)) AS remaining,
      CASE 
        WHEN ps.refunded > 0 THEN 'refunded'
        WHEN (mcpd.quantity - COALESCE(ps.consumed, 0)) > 0 THEN 'eligible'
        ELSE 'ineligible'
      END AS is_eligible_for_refund
    FROM member_care_packages mcp
    JOIN member_care_package_details mcpd ON mcp.id = mcpd.member_care_package_id
    JOIN members mem ON mem.id = mcp.member_id
    JOIN employees emp ON emp.id = mcp.employee_id
    LEFT JOIN package_stats ps ON mcp.id = ps.package_id AND mcpd.id = ps.detail_id
    WHERE 
      (mcp.package_name ILIKE $1 OR mcpd.service_name ILIKE $1)
      ${memberId ? 'AND mcp.member_id = $2' : ''}
    ORDER BY mcp.created_at DESC
    LIMIT 20;
  `;

  const values = memberId ? [`%${searchQuery}%`, memberId] : [`%${searchQuery}%`];
  const { rows } = await pool().query(query, values);
  return rows;
};

const getRefundDateByMcpId = async (mcpId: string) => {
  const query = `
    SELECT 
      logs.transaction_date AS refund_date
    FROM 
      member_care_package_transaction_logs logs
    JOIN 
      member_care_package_details details 
      ON logs.member_care_package_details_id = details.id
    WHERE 
      details.member_care_package_id = $1
      AND logs.type = 'REFUND'
    ORDER BY 
      logs.transaction_date DESC
    LIMIT 1;
  `;

  const { rows } = await pool().query(query, [mcpId]);
  return rows[0]?.refund_date || null;
};


const processRefundMemberVoucher = async (body: {
  memberVoucherId: number;
  refundedBy: number; // handled by
  createdBy: number;  // logged-in user who created the refund
  refundDate: string;
  remarks?: string;
  creditNoteNumber?: string;
}): Promise<{ refundTransactionId: number }> => {
  const client = await pool().connect();

  try {
    await client.query('BEGIN');

    // 1. Lock and validate voucher
    const { rows: voucherRows } = await client.query(
      `SELECT * FROM member_vouchers WHERE id = $1 FOR UPDATE`,
      [body.memberVoucherId]
    );
    if (voucherRows.length === 0) throw new Error('Voucher not found');
    const voucher = voucherRows[0];
    if (voucher.status === 'disabled') throw new Error('Voucher already disabled');

    // fetch current balance from sale_transactions (total paid amount)

    // 2. Get latest transaction log for current balance
    const { rows: logRows } = await client.query(
      `SELECT current_balance FROM member_voucher_transaction_logs
       WHERE member_voucher_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [body.memberVoucherId]
    );
    const previousBalance = parseFloat(logRows[0]?.current_balance || '0');
    const freeOfCharge = parseFloat(voucher.free_of_charge || '0');

    // 3. Get total actual payment made (exclude FOC)
    const { rows: paymentRows } = await client.query(
      `SELECT SUM(pts.amount)::float AS total_paid,
              MIN(st.id) AS original_tx_id
       FROM payment_to_sale_transactions pts
       JOIN sale_transaction_items sti ON pts.sale_transaction_id = sti.sale_transaction_id
       JOIN sale_transactions st ON st.id = sti.sale_transaction_id
       WHERE sti.member_voucher_id = $1
         AND pts.payment_method_id IN (1, 2, 3, 4)`,
      [body.memberVoucherId]
    );

    const totalPaid = parseFloat(paymentRows[0]?.total_paid || '0');
    const originalTxId = paymentRows[0].original_tx_id || null;

    // 4. Get total consumed
    const { rows: consumedRows } = await client.query(
      `SELECT SUM(ABS(amount_change))::float AS total_consumed
       FROM member_voucher_transaction_logs
       WHERE member_voucher_id = $1 AND type = 'CONSUMPTION'`,
      [body.memberVoucherId]
    );
    const totalConsumed = parseFloat(consumedRows[0]?.total_consumed || '0');

    // 5. Compute refundable amount
    const paidUnconsumedAmount = totalPaid - totalConsumed;
    if (paidUnconsumedAmount <= 0) throw new Error('Nothing refundable');

    const willRemoveFOC = totalPaid >= parseFloat(voucher.default_total_price);
    const newBalanceAfterFOC = willRemoveFOC ? previousBalance - freeOfCharge : previousBalance;
    const refundAmount = Math.min(newBalanceAfterFOC, paidUnconsumedAmount);

    // 6. Update voucher
    await client.query(
      `UPDATE member_vouchers
       SET current_balance = 0, status = 'disabled', last_updated_by = $1, updated_at = $3
       WHERE id = $2`,
      [body.createdBy, body.memberVoucherId, body.refundDate]
    );

    // 7. Log REMOVE FOC (optional)
    if (willRemoveFOC && freeOfCharge > 0) {
      await client.query(
        `INSERT INTO member_voucher_transaction_logs (
          member_voucher_id, service_description, service_date,
          current_balance, amount_change, serviced_by, type,
          created_by, last_updated_by, created_at, updated_at
        ) VALUES ($1, 'Remove Free Of Charge', $2, $3, $4, $5, 'REMOVE FOC', $6, $6, $2, $2)`,
        [
          body.memberVoucherId,
          body.refundDate,
          newBalanceAfterFOC,
          -freeOfCharge,
          body.refundedBy,  // handled_by = refundedBy
          body.createdBy    // created_by = logged-in user
        ]
      );
    }
    // 8. Log REFUND
    await client.query(
      `INSERT INTO member_voucher_transaction_logs (
        member_voucher_id, service_description, service_date,
        current_balance, amount_change, serviced_by, type,
        created_by, last_updated_by, created_at, updated_at
      ) VALUES ($1, 'REFUND', $2, 0, $3, $4, 'REFUND', $5, $5, $2, $2)`,
      [
        body.memberVoucherId,
        body.refundDate,
        -refundAmount,
        body.refundedBy,  // handled_by
        body.createdBy    // created_by
      ]
    );

    const receiptNo = body.creditNoteNumber?.trim() ?? null;

    //const dateStr = body.refundDate.slice(0, 10).replace(/-/g, '');
    //const receiptNo = `R-MV-${body.memberVoucherId}-${dateStr}`;

    // 9. Sale transaction (refund)
    const { rows: txRows } = await client.query(
      `INSERT INTO sale_transactions (
        customer_type, member_id,
        total_paid_amount, outstanding_total_payment_amount,
        sale_transaction_status, remarks,
        receipt_no, reference_sales_transaction_id,
        handled_by, created_by, created_at, updated_at
      )
      VALUES ('member', $1, $2, 0, 'REFUND', $3, $4, $5, $6, $7, $8, $8)
      RETURNING id`,
      [
        voucher.member_id,
        -refundAmount,
        body.remarks || `Refund for Member Voucher #${body.memberVoucherId}`,
        receiptNo,
        originalTxId,
        body.refundedBy, // handled_by = selected employee
        body.createdBy,  // created_by = logged-in user
        body.refundDate
      ]
    );
    const refundTxId = txRows[0].id;

    // 10. Sale transaction item
    await client.query(
      `INSERT INTO sale_transaction_items (
        sale_transaction_id, member_voucher_id,
        quantity, remarks, amount, item_type
      )
      VALUES ($1, $2, 1, $3, $4, 'member voucher')`,
      [
        refundTxId,
        body.memberVoucherId,
        body.remarks || `Refund for Member Voucher #${body.memberVoucherId}`,
        -refundAmount
      ]
    );

    // 11. Refund payment
    await client.query(
      `INSERT INTO payment_to_sale_transactions (
        payment_method_id, sale_transaction_id, amount,
        remarks, created_by, created_at, updated_by, updated_at
      )
      VALUES (8, $1, $2, $3, $4, $5, $4, $5)`,
      [
        refundTxId,
        -refundAmount,
        body.remarks || `Refund for Member Voucher #${body.memberVoucherId}`,
        body.createdBy,
        body.refundDate
      ]
    );

    await client.query('COMMIT');
    return { refundTransactionId: refundTxId };

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};



const getEligibleMemberVoucherForRefund = async (memberId: number) => {
  const client = await pool().connect();

  try {
    const memberResult = await client.query(
      `SELECT id, name, email, contact FROM members WHERE id = $1`,
      [memberId]
    );
    const member = memberResult.rows[0];

    // Fetch all enabled vouchers with remaining balance
    const { rows: vouchers } = await client.query(
      `SELECT * FROM member_vouchers
            WHERE member_id = $1
                AND status = 'is_enabled'
                AND current_balance > 0
            ORDER BY updated_at DESC`,
      [memberId]
    );

    const eligibleVouchers = await Promise.all(
      vouchers.map(async (voucher) => {
        // Get total_paid_amount from latest transaction involving this voucher
        const paidQuery = `
          SELECT st.total_paid_amount
          FROM sale_transactions st
          JOIN sale_transaction_items sti ON st.id = sti.sale_transaction_id
          WHERE sti.member_voucher_id = $1
          ORDER BY sti.sale_transaction_id DESC
          LIMIT 1;
        `;

        const { rows: paidRows } = await client.query(paidQuery, [voucher.id]);

        if (paidRows.length === 0) return null; // No payment info

        const totalPaid = parseFloat(paidRows[0].total_paid_amount || '0');

        // Get consumption logs
        const logsQuery = `
          SELECT type, amount_change
          FROM member_voucher_transaction_logs
          WHERE member_voucher_id = $1
        `;
        const { rows: logs } = await client.query(logsQuery, [voucher.id]);

        let totalConsumed = 0;
        for (const log of logs) {
          const amount = parseFloat(log.amount_change);
          if (log.type === 'CONSUMPTION') {
            totalConsumed += Math.abs(amount);
          }
        }

        // Skip if consumed >= paid
        if (totalConsumed >= totalPaid) return null;

        return {
          ...voucher,
          refundable_amount: Math.min(totalPaid - totalConsumed, parseFloat(voucher.current_balance)),
        };
      })
    );

    return {
      member,
      vouchers: eligibleVouchers.filter(Boolean) // Remove nulls
    };
  } finally {
    client.release();
  }
};

const getMemberVoucherById = async (voucherId: number) => {
  const client = await pool().connect();

  try {
    const { rows: voucherRows } = await client.query(
      `SELECT * FROM member_vouchers WHERE id = $1`,
      [voucherId]
    );

    if (voucherRows.length === 0) return null;
    const voucher = voucherRows[0];

    // Get the member info
    const { rows: memberRows } = await client.query(
      `SELECT id, name, email, contact FROM members WHERE id = $1`,
      [voucher.member_id]
    );

    const member = memberRows[0] || null;

    // Step 1: Get latest sale transaction outstanding amount for this voucher
    const paidQuery = `
      SELECT st.total_paid_amount
      FROM sale_transactions st
      JOIN sale_transaction_items sti ON st.id = sti.sale_transaction_id
      WHERE sti.member_voucher_id = $1
      ORDER BY sti.sale_transaction_id DESC
      LIMIT 1;
    `;

    const { rows: paidRows } = await client.query(paidQuery, [voucher.id]);

    if (paidRows.length === 0) {
      return {
        voucher: {
          ...voucher,
          refundable_amount: 0,
        },
        member,
      };
    }

    const paidAmount = parseFloat(paidRows[0].total_paid_amount || '0');

    // Step 2: Get consumption logs
    const logsQuery = `
      SELECT type, amount_change
      FROM member_voucher_transaction_logs
      WHERE member_voucher_id = $1
    `;
    const { rows: logs } = await client.query(logsQuery, [voucher.id]);

    let totalConsumed = 0;
    for (const log of logs) {
      const amount = parseFloat(log.amount_change);
      if (log.type === 'CONSUMPTION') {
        totalConsumed += Math.abs(amount);
      }
    }

    // Step 3: Calculate refundable_amount
    const refundable_amount = Math.min(
      paidAmount - totalConsumed,
      parseFloat(voucher.current_balance)
    );

    return {
      voucher: {
        ...voucher,
        refundable_amount,
      },
      member,
    };
  } finally {
    client.release();
  }
};

interface RefundRecordsParams {
  page?: number;
  limit?: number;
  memberName?: string;
  refundType?: 'mcp' | 'mv' | 'service';
  startDate?: string;
  endDate?: string;
}

const getAllRefundRecords = async ({
  page = 1,
  limit = 20,
  memberName,
  refundType,
  startDate,
  endDate,
}: RefundRecordsParams) => {
  const client = await pool().connect();
  try {
    const offset = (page - 1) * limit;
    const params: any[] = [];
    let idx = 1;

    let baseQuery = `
      FROM sale_transactions st
      LEFT JOIN members m ON m.id = st.member_id
      JOIN sale_transaction_items sti ON sti.sale_transaction_id = st.id
      LEFT JOIN member_care_packages mcp ON mcp.id = sti.member_care_package_id
      LEFT JOIN member_vouchers mv ON mv.id = sti.member_voucher_id
      WHERE st.sale_transaction_status = 'REFUND'
    `;

    // Member name filter
    if (memberName) {
      baseQuery += ` AND LOWER(m.name) LIKE $${idx++}`;
      params.push(`%${memberName.toLowerCase()}%`);
    }

    // Date range filters
    if (startDate) {
      baseQuery += ` AND DATE(st.created_at) >= $${idx++}`;
      params.push(startDate);
    }

    if (endDate) {
      baseQuery += ` AND DATE(st.created_at) <= $${idx++}`;
      params.push(endDate);
    }

    // Refund type filter
    if (refundType) {
      if (refundType === 'mcp') {
        baseQuery += ` AND sti.member_care_package_id IS NOT NULL`;
      } else if (refundType === 'mv') {
        baseQuery += ` AND (sti.member_voucher_id IS NOT NULL OR sti.item_type = 'member voucher')`;
      } else if (refundType === 'service') {
        // Service: when both mcp and mv IDs are null, OR item_type is 'service'
        baseQuery += ` AND (
          (sti.member_care_package_id IS NULL AND sti.member_voucher_id IS NULL)
          OR sti.item_type = 'service'
        )`;
      }
    }

    const countParams = [...params];

    const dataQuery = `
      SELECT
        st.id,
        st.created_at,
        st.member_id,
        m.name AS member_name,
        st.total_paid_amount,
        st.remarks,
        st.sale_transaction_status,
        CASE 
          WHEN sti.member_care_package_id IS NOT NULL THEN 'mcp'
          WHEN sti.member_voucher_id IS NOT NULL OR sti.item_type = 'member voucher' THEN 'mv'
          WHEN (sti.member_care_package_id IS NULL AND sti.member_voucher_id IS NULL) 
               OR sti.item_type = 'service' THEN 'service'
          ELSE 'unknown'
        END AS refund_type,
        -- Add item names based on type
        CASE 
          WHEN sti.member_care_package_id IS NOT NULL THEN mcp.package_name
          WHEN sti.member_voucher_id IS NOT NULL OR sti.item_type = 'member voucher' THEN mv.member_voucher_name
          WHEN (sti.member_care_package_id IS NULL AND sti.member_voucher_id IS NULL) 
               OR sti.item_type = 'service' THEN sti.service_name
          ELSE sti.service_name
        END AS item_name,
        sti.item_type
      ${baseQuery}
      GROUP BY st.id, m.name, refund_type, item_name, sti.item_type
      ORDER BY st.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    params.push(limit, offset);

    const { rows } = await client.query(dataQuery, params);

    const countQuery = `SELECT COUNT(DISTINCT st.id) AS total ${baseQuery}`;
    const countResult = await client.query(countQuery, countParams);

    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    return {
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } finally {
    client.release();
  }
};



const getRefundRecordDetails = async (refundId: number) => {
  const client = await pool().connect();
  try {
    // Get main refund record + member info + handled_by name
    const refundQuery = `
    SELECT
      st.id,
      st.created_at,
      st.member_id,
      m.name AS member_name,
      m.email AS member_email,
      m.contact AS member_contact,
      e_handled.employee_name AS handled_by_name,
      e_created.employee_name AS created_by_name,
      st.total_paid_amount,
      st.outstanding_total_payment_amount,
      st.sale_transaction_status,
      st.remarks,
      st.receipt_no
    FROM sale_transactions st
    LEFT JOIN members m ON m.id = st.member_id
    LEFT JOIN employees e_handled ON e_handled.id = st.handled_by
    LEFT JOIN employees e_created ON e_created.id = st.created_by
    WHERE st.id = $1 AND st.sale_transaction_status = 'REFUND'
    `;

    const { rows } = await client.query(refundQuery, [refundId]);
    if (rows.length === 0) return null;
    const refund = rows[0];

    // Fetch refund items for this refund transaction
    const itemsQuery = `
      SELECT
        sti.id,
        sti.service_name,
        sti.product_name,
        sti.member_care_package_id,
        sti.member_voucher_id,
        mv.member_voucher_name,
        sti.original_unit_price,
        sti.custom_unit_price,
        sti.discount_percentage,
        sti.quantity,
        sti.remarks,
        sti.amount,
        sti.item_type
      FROM sale_transaction_items sti
      LEFT JOIN member_vouchers mv ON mv.id = sti.member_voucher_id
      WHERE sti.sale_transaction_id = $1
    `;
    const { rows: items } = await client.query(itemsQuery, [refundId]);

    // If any of the items are member vouchers, fetch voucher logs
    const hasVoucher = items.some(item => item.member_voucher_id);
    let voucherLogs = [];

    if (hasVoucher) {
      const voucherIds = items
        .map(i => i.member_voucher_id)
        .filter(Boolean);

      const voucherLogQuery = `
        SELECT
          l.id,
          l.member_voucher_id,
          l.service_description,
          l.service_date,
          l.current_balance,
          l.amount_change,
          l.serviced_by,
          l.type,
          l.created_at,
          l.updated_at
        FROM member_voucher_transaction_logs l
        WHERE l.member_voucher_id = ANY($1::int[])
        ORDER BY id ASC
      `;

      const { rows: logs } = await client.query(voucherLogQuery, [voucherIds]);
      voucherLogs = logs;

      // 🔍 Fetch total paid amount across all related transactions
      const voucherPaymentQuery = `
      SELECT 
        sti.member_voucher_id,
        SUM(st.total_paid_amount) AS total_paid_amount
      FROM sale_transaction_items sti
      JOIN sale_transactions st ON st.id = sti.sale_transaction_id
      WHERE sti.member_voucher_id = ANY($1::int[])
        AND st.sale_transaction_status IN ('FULL', 'PARTIAL') -- include all valid payment statuses
      GROUP BY sti.member_voucher_id
      `;
      
      const { rows: voucherPayments } = await client.query(voucherPaymentQuery, [voucherIds]);

      // Map: { voucher_id: total_paid_amount }
      const paidAmountMap = Object.fromEntries(
        voucherPayments.map(row => [row.member_voucher_id, parseFloat(row.total_paid_amount)])
      );

      // Attach to items
      for (const item of items) {
        if (item.member_voucher_id) {
          item.total_paid_amount = paidAmountMap[item.member_voucher_id] || 0;
        }
      }
    }

    // get MCP details & logs if any mcp refund exists
    const hasCarePackage = items.some(item => item.member_care_package_id);
    let memberCarePackageDetails = [];
    let memberCarePackageLogs = [];

    if (hasCarePackage) {
      const mcpDetailIds = items.map(i => i.member_care_package_id).filter(Boolean);

      // a. MCP Details with Package Name
      const mcpDetailsQuery = `
        SELECT 
          d.id AS detail_id,
          d.member_care_package_id,
          mcp.package_name,
          d.service_id,
          d.service_name,
          d.price,
          d.status,
          d.discount,
          d.quantity
        FROM member_care_package_details d
        JOIN member_care_packages mcp ON mcp.id = d.member_care_package_id
        WHERE d.id = ANY($1::int[])
      `;
      const { rows: details } = await client.query(mcpDetailsQuery, [mcpDetailIds]);
      memberCarePackageDetails = details;

      // b. MCP Logs
      const mcpLogsQuery = `
        SELECT
          l.id,
          l.type,
          l.description,
          l.transaction_date,
          l.transaction_amount,
          l.amount_changed,
          l.member_care_package_details_id,
          l.employee_id,
          l.service_id,
          l.created_at
        FROM member_care_package_transaction_logs l
        WHERE l.member_care_package_details_id = ANY($1::int[])
        ORDER BY transaction_date ASC
      `;
      const { rows: logs } = await client.query(mcpLogsQuery, [mcpDetailIds]);
      memberCarePackageLogs = logs;
    }

    return {
      ...refund,
      items,
      voucherLogs,
      memberCarePackageDetails,
      memberCarePackageLogs,
    };
  } catch (err) {
    console.error('Error fetching refund detail:', err);
    throw err;
  } finally {
    client.release();
  }
};

export default {
  getAllRefundSaleTransactionRecords,
  getServiceTransactionsForRefund,
  processRefundService,
  getSaleTransactionItemById,
  processRefundMemberVoucher,
  getEligibleMemberVoucherForRefund,
  getMCPById,
  getRemainingServices,
  //getStatusId,
  processFullRefundTransaction,
  fetchMCPStatusById,
  searchMembers,
  getMemberCarePackages,
  searchMemberCarePackages,
  getRefundDateByMcpId,
  getMemberVoucherById,
  getAllRefundRecords,
  getRefundRecordDetails,
};
