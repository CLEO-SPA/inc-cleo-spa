import { pool } from '../config/database.js';
import {
  Member,
  Payment,
  Employee,
  PaymentDetail,
  TransactionItem,
  SalesTransaction,
  SalesTransactionDetail,
  PaginatedResult,
  Service,
  Product,
   TransactionRequestData, 
  TransactionCreationResult,
  TransactionRequestItem,
  PaymentMethodRequest,
  SingleItemTransactionCreationResult,
  SingleItemTransactionRequestData,
  SingleTransactionRequestItem,
  ItemPricing 
} from '../types/SaleTransactionTypes.js';



const getSalesTransactionList = async (
  filter?: string,
  searchQuery?: string,
  memberSearchQuery?: string,
  sortField: string = 'transaction_id',
  sortDirection: string = 'desc',
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResult<SalesTransaction>> => {
  try {
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Handle sales transaction type filter
    if (filter) {
      switch (filter.toLowerCase()) {
        case 'full':
          whereConditions.push(`st.sale_transaction_status = $${paramIndex}`);
          queryParams.push('FULL');
          paramIndex++;
          break;
        case 'partial':
          whereConditions.push(`st.sale_transaction_status = $${paramIndex}`);
          queryParams.push('PARTIAL');
          paramIndex++;
          break;
        case 'package':
          whereConditions.push(`EXISTS (
            SELECT 1 FROM sale_transaction_items sti 
            WHERE sti.sale_transaction_id = st.id 
            AND sti.member_care_package_id IS NOT NULL
          )`);
          break;
        case 'service':
          whereConditions.push(`EXISTS (
            SELECT 1 FROM sale_transaction_items sti 
            WHERE sti.sale_transaction_id = st.id 
            AND sti.member_care_package_id IS NULL 
            AND sti.member_voucher_id IS NULL
            AND sti.service_name IS NOT NULL
          )`);
          break;
        case 'product':
          whereConditions.push(`EXISTS (
            SELECT 1 FROM sale_transaction_items sti 
            WHERE sti.sale_transaction_id = st.id 
            AND sti.member_care_package_id IS NULL 
            AND sti.member_voucher_id IS NULL
            AND sti.product_name IS NOT NULL
          )`);
          break;
        case 'voucher':
          whereConditions.push(`EXISTS (
            SELECT 1 FROM sale_transaction_items sti 
            WHERE sti.sale_transaction_id = st.id 
            AND sti.member_voucher_id IS NOT NULL
          )`);
          break;
      }
    }

    // Handle search queries
    if (searchQuery) {
  whereConditions.push(`st.receipt_no ILIKE $${paramIndex}`);
  queryParams.push(`%${searchQuery}%`);
  paramIndex++;
    }

    if (memberSearchQuery) {
      whereConditions.push(`m.name ILIKE $${paramIndex}`);
      queryParams.push(`%${memberSearchQuery}%`);
      paramIndex++;
    }

    // Handle sorting
    let orderBy = 'st.id DESC';
    switch (sortField) {
      case 'transaction_id':
        orderBy = `st.id ${sortDirection.toUpperCase()}`;
        break;
      case 'receipt_no':
        orderBy = `st.receipt_no ${sortDirection.toUpperCase()}`;
        break;
      case 'member_name':
        orderBy = `m.name ${sortDirection.toUpperCase()}`;
        break;
      case 'total_amount':
        orderBy = `(st.total_paid_amount + st.outstanding_total_payment_amount) ${sortDirection.toUpperCase()}`;
        break;
      case 'date':
        orderBy = `st.created_at ${sortDirection.toUpperCase()}`;
        break;
      case 'outstanding':
        orderBy = `st.outstanding_total_payment_amount ${sortDirection.toUpperCase()}`;
        break;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Debug logging
    console.log('Filter:', filter);
    console.log('Where conditions:', whereConditions);
    console.log('Query params:', queryParams);
    console.log('Param index:', paramIndex);

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT st.id) as total
      FROM sale_transactions st
      LEFT JOIN members m ON st.member_id = m.id
      ${whereClause}
    `;
    
    console.log('Count query:', countQuery);
    
    const countResult = await pool().query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(totalItems / limit);

    // Main query for sales transactions
    const mainQuery = `
      SELECT 
        st.id,
        st.customer_type,
        st.member_id,
        st.total_paid_amount,
        st.outstanding_total_payment_amount,
        st.sale_transaction_status,
        st.receipt_no,
        st.created_at,
        st.remarks,
        st.process_payment,
        m.id as member_table_id,
        m.name as member_name,
        m.email as member_email,
        m.contact as member_contact,
        -- Check for different item types
        (SELECT COUNT(*) > 0 FROM sale_transaction_items sti 
         WHERE sti.sale_transaction_id = st.id 
         AND sti.service_name IS NOT NULL 
         AND sti.member_care_package_id IS NULL) as has_services,
        (SELECT COUNT(*) > 0 FROM sale_transaction_items sti 
         WHERE sti.sale_transaction_id = st.id 
         AND sti.product_name IS NOT NULL 
         AND sti.member_care_package_id IS NULL) as has_products,
        (SELECT COUNT(*) > 0 FROM sale_transaction_items sti 
         WHERE sti.sale_transaction_id = st.id 
         AND sti.member_care_package_id IS NOT NULL) as has_care_packages
      FROM sale_transactions st
      LEFT JOIN members m ON st.member_id = m.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const mainQueryParams = [...queryParams, limit, offset];
    const salesTransactions = await pool().query(mainQuery, mainQueryParams);

    const transactionIds = salesTransactions.rows.map((row: any) => row.id);
    let paymentData: any[] = [];

    if (transactionIds.length > 0) {
      const paymentQuery = `
        SELECT 
          ptst.sale_transaction_id,
          ptst.amount,
          pm.payment_method_name
        FROM payment_to_sale_transactions ptst
        JOIN payment_methods pm ON ptst.payment_method_id = pm.id
        WHERE ptst.sale_transaction_id = ANY($1)
      `;
      
      const paymentResult = await pool().query(paymentQuery, [transactionIds]);
      paymentData = paymentResult.rows;
    }

    // Transform the data
    const transformedTransactions: SalesTransaction[] = salesTransactions.rows.map((transaction: any) => {
      const payments = paymentData
        .filter((payment: any) => payment.sale_transaction_id === transaction.id)
        .map((payment: any) => ({
          amount: parseFloat(payment.amount || 0),
          payment_method: payment.payment_method_name
        }));

      const totalAmount = parseFloat(transaction.total_paid_amount || 0) + 
                         parseFloat(transaction.outstanding_total_payment_amount || 0);

      return {
        transaction_id: transaction.id.toString(),
        receipt_no: transaction.receipt_no,
        customer_type: transaction.customer_type,
        total_transaction_amount: totalAmount,
        total_paid_amount: parseFloat(transaction.total_paid_amount || 0),
        outstanding_total_payment_amount: parseFloat(transaction.outstanding_total_payment_amount || 0),
        transaction_status: transaction.sale_transaction_status,
        transaction_created_at: transaction.created_at,
        has_services: transaction.has_services,
        has_products: transaction.has_products,
        has_care_packages: transaction.has_care_packages,
        process_payment: transaction.process_payment,
        member: transaction.member_table_id ? {
          id: transaction.member_table_id.toString(),
          name: transaction.member_name,
          email: transaction.member_email,
          contact: transaction.member_contact
        } : null,
        payments
      };
    });

    return {
      items: transformedTransactions,
      total: totalItems,
      totalPages,
      currentPage: page
    };

  } catch (error) {
    console.error('Error in getSalesTransactionList:', error);
    throw new Error('Failed to fetch sales transaction list');
  }
};

const getSalesTransactionById = async (id: string): Promise<SalesTransactionDetail | null> => {
  try {
    // Main transaction query
    const transactionQuery = `
      SELECT 
        st.id,
        st.customer_type,
        st.member_id,
        st.total_paid_amount,
        st.outstanding_total_payment_amount,
        st.sale_transaction_status,
        st.receipt_no,
        st.created_at,
        st.updated_at,
        st.remarks,
        st.process_payment,
        st.handled_by,
        st.created_by,
        -- Member information
        m.id as member_table_id,
        m.name as member_name,
        m.email as member_email,
        m.contact as member_contact,
        -- Handler information
        he.employee_code as handler_code,
        he.employee_name as handler_name,
        -- Creator information
        ce.employee_code as creator_code,
        ce.employee_name as creator_name
      FROM sale_transactions st
      LEFT JOIN members m ON st.member_id = m.id
      LEFT JOIN employees he ON st.handled_by = he.id
      LEFT JOIN employees ce ON st.created_by = ce.id
      WHERE st.id = $1
    `;

    const transactionResult = await pool().query(transactionQuery, [id]);
    
    if (transactionResult.rows.length === 0) {
      return null;
    }

    const transaction = transactionResult.rows[0];

    // Get transaction items
    const itemsQuery = `
      SELECT 
        id,
        service_name,
        product_name,
        member_care_package_id,
        member_voucher_id,
        original_unit_price,
        custom_unit_price,
        discount_percentage,
        quantity,
        remarks,
        amount,
        item_type
      FROM sale_transaction_items
      WHERE sale_transaction_id = $1
      ORDER BY id
    `;

    const itemsResult = await pool().query(itemsQuery, [id]);

    // Get payment information
    const paymentsQuery = `
      SELECT 
        ptst.id as payment_id,
        ptst.amount,
        ptst.created_at as payment_created_at,
        ptst.updated_at as payment_updated_at,
        ptst.remarks as payment_remarks,
        pm.payment_method_name,
        -- Payment creator info
        pce.employee_code as payment_creator_code,
        pce.employee_name as payment_creator_name,
        -- Payment updater info
        pue.employee_code as payment_updater_code,
        pue.employee_name as payment_updater_name
      FROM payment_to_sale_transactions ptst
      JOIN payment_methods pm ON ptst.payment_method_id = pm.id
      LEFT JOIN employees pce ON ptst.created_by = pce.id
      LEFT JOIN employees pue ON ptst.updated_by = pue.id
      WHERE ptst.sale_transaction_id = $1
      ORDER BY ptst.created_at
    `;

    const paymentsResult = await pool().query(paymentsQuery, [id]);

    // Transform the transaction data
    const totalAmount = parseFloat(transaction.total_paid_amount || 0) + 
                       parseFloat(transaction.outstanding_total_payment_amount || 0);

    const transformedTransaction: SalesTransactionDetail = {
      transaction_id: transaction.id.toString(),
      receipt_no: transaction.receipt_no,
      customer_type: transaction.customer_type,
      total_transaction_amount: totalAmount,
      total_paid_amount: parseFloat(transaction.total_paid_amount || 0),
      outstanding_total_payment_amount: parseFloat(transaction.outstanding_total_payment_amount || 0),
      transaction_status: transaction.sale_transaction_status,
      transaction_created_at: transaction.created_at,
      transaction_updated_at: transaction.updated_at,
      transaction_remark: transaction.remarks,
      has_services: false, // These would need to be calculated if needed
      has_products: false,
      has_care_packages: false,
      process_payment: transaction.process_payment,

      // Member information
      member: transaction.member_table_id ? {
        id: transaction.member_table_id.toString(),
        name: transaction.member_name,
        email: transaction.member_email,
        contact: transaction.member_contact
      } : null,

      // Handler information
      handler: transaction.handled_by ? {
        code: transaction.handler_code,
        name: transaction.handler_name
      } : null,

      // Creator information
      creator: transaction.created_by ? {
        code: transaction.creator_code,
        name: transaction.creator_name
      } : null,

      // Payment information
      payments: paymentsResult.rows.map((payment: any) => ({
        id: payment.payment_id.toString(),
        amount: parseFloat(payment.amount || 0),
        payment_method: payment.payment_method_name,
        created_at: payment.payment_created_at,
        updated_at: payment.payment_updated_at,
        remarks: payment.payment_remarks,
        created_by: {
          code: payment.payment_creator_code,
          name: payment.payment_creator_name
        },
        updated_by: {
          code: payment.payment_updater_code,
          name: payment.payment_updater_name
        }
      })),

      // Items information
      items: itemsResult.rows.map((item: any) => ({
        id: item.id.toString(),
        service_name: item.service_name,
        product_name: item.product_name,
        member_care_package_id: item.member_care_package_id?.toString(),
        member_voucher_id: item.member_voucher_id?.toString(),
        original_unit_price: parseFloat(item.original_unit_price || 0),
        custom_unit_price: parseFloat(item.custom_unit_price || 0),
        discount_percentage: parseFloat(item.discount_percentage || 0),
        quantity: item.quantity,
        remarks: item.remarks,
        amount: parseFloat(item.amount || 0),
        item_type: item.item_type
      }))
    };

    return transformedTransaction;
  } catch (error) {
    console.error('Error in getSalesTransactionById:', error);
    throw new Error('Failed to fetch sales transaction');
  }
};


const searchServices = async (
  searchQuery: string
): Promise<Service[]> => {
  try {
    let query = `
      SELECT 
        s.id,
        s.service_name,
        s.service_description,
        s.service_remarks,
        s.service_duration,
        s.service_price,
        s.service_is_enabled,
        s.created_at,
        s.updated_at,
        s.service_category_id,
        s.service_sequence_no,
        s.created_by,
        s.updated_by,
        sc.service_category_name,
        sc.service_category_sequence_no
      FROM 
        services s
      LEFT JOIN 
        service_categories sc ON s.service_category_id = sc.id
      WHERE 
        s.service_is_enabled = true
    `;

    let params: any[] = [];

    if (searchQuery && searchQuery.trim() !== '') {
      query += ` AND (
        s.service_name ILIKE $1 
        OR sc.service_category_name ILIKE $1
      )`;
      params.push(`%${searchQuery.trim()}%`);
    }


    query += `
      ORDER BY 
        sc.service_category_sequence_no ASC,
        s.service_sequence_no ASC
    `;

    query += ` LIMIT 10`;

    const result = await pool().query(query, params);

    return result.rows.map((service: any) => ({
      id: `S${service.id}`,
      service_id: service.id.toString(),
      name: service.service_name || 'Unnamed Service',
      service_name: service.service_name || 'Unnamed Service',
      description: service.service_description || '',
      remarks: service.service_remarks || '',
      duration: service.service_duration || 0,
      category: service.service_category_name || 'Uncategorized',
      service_category_name: service.service_category_name || 'Uncategorized',
      service_category_id: service.service_category_id ? service.service_category_id.toString() : null,
      price: parseFloat(service.service_price || 0),
      service_default_price: parseFloat(service.service_price || 0),
      is_enabled: service.service_is_enabled || false,
      sequence_no: service.service_sequence_no || 0
    }));
  } catch (error: any) {
    console.error('Detailed error in searchServices:', error);
    throw new Error(`Error searching services: ${error.message}`);
  }
};

const searchProducts = async (
  searchQuery: string
): Promise<Product[]> => {
  try {
    let query = `
      SELECT 
        p.id,
        p.product_name,
        p.product_description,
        p.product_remarks,
        p.product_unit_sale_price,     
        p.product_unit_cost_price,     
        p.product_is_enabled,
        p.created_at,
        p.updated_at,
        p.product_category_id,
        p.product_sequence_no,
        pc.product_category_name,
        pc.product_category_sequence_no
      FROM 
        products p
      LEFT JOIN 
        product_categories pc ON p.product_category_id = pc.id
      WHERE 
        p.product_is_enabled = true
    `;

    let params: any[] = [];
    if (searchQuery && searchQuery.trim() !== '') {
      query += ` AND (
        p.product_name ILIKE $1 
        OR pc.product_category_name ILIKE $1
      )`;
      params.push(`%${searchQuery.trim()}%`);
    }
    query += `
      ORDER BY 
        pc.product_category_sequence_no ASC,
        p.product_sequence_no ASC
    `;

    query += ` LIMIT 10`;

    const result = await pool().query(query, params);

    return result.rows.map((product: any) => ({
      id: `P${product.id}`,
      product_id: product.id.toString(),
      name: product.product_name || 'Unnamed Product',
      product_name: product.product_name || 'Unnamed Product',
      description: product.product_description || '',
      remarks: product.product_remarks || '',
      category: product.product_category_name || 'Uncategorized',
      product_category_name: product.product_category_name || 'Uncategorized',
      product_category_id: product.product_category_id ? product.product_category_id.toString() : null,
      price: parseFloat(product.product_unit_sale_price || 0),       /* Updated column name */
      cost_price: parseFloat(product.product_unit_cost_price || 0),  /* Updated column name */
      is_enabled: product.product_is_enabled || false,
      sequence_no: product.product_sequence_no || 0
    }));
  } catch (error: any) {
    console.error('Detailed error in searchProducts:', error);
    throw new Error(`Error searching products: ${error.message}`);
  }
};

const createServicesProductsTransaction = async (
  transactionData: TransactionRequestData
): Promise<TransactionCreationResult> => {
  const client  = await pool().connect();
  
  try {
    await client.query('BEGIN');

    // Extract data from request
    const {
      customer_type,
      member_id,
      receipt_number,
      remarks,
      created_by,
      handled_by,
      items,
      payments
    } = transactionData;

    // Validate required fields
    if (!created_by) {
      throw new Error('created_by is required');
    }

    if (!handled_by) {
      throw new Error('handled_by is required');
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('items array is required and cannot be empty');
    }

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      throw new Error('payments array is required and cannot be empty');
    }

    // Calculate totals from items
    const totalTransactionAmount: number = items.reduce((total: number, item: TransactionRequestItem) => {
      return total + (item.pricing?.totalLinePrice || 0);
    }, 0);

    // Calculate total paid amount from payments
    const totalPaidAmount: number = payments.reduce((total: number, payment: PaymentMethodRequest) => {
      return total + (payment.amount || 0);
    }, 0);

    const outstandingAmount: number = totalTransactionAmount - totalPaidAmount;

    // Determine transaction status
    const transactionStatus: 'FULL' | 'PARTIAL' = outstandingAmount <= 0 ? 'FULL' : 'PARTIAL';

    // Generate receipt number if not provided
    let finalReceiptNo: string = receipt_number || '';
    if (!finalReceiptNo) {
      const receiptResult = await client.query(
        'SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_no FROM 3) AS INTEGER)), 0) + 1 as next_number FROM sale_transactions WHERE receipt_no LIKE $1',
        [`ST%`]
      );
      finalReceiptNo = `ST${receiptResult.rows[0].next_number.toString().padStart(6, '0')}`;
    }

    // Insert main sales transaction
    const transactionQuery: string = `
      INSERT INTO sale_transactions (
        customer_type,
        member_id,
        total_paid_amount,
        outstanding_total_payment_amount,
        sale_transaction_status,
        receipt_no,
        remarks,
        process_payment,
        handled_by,
        created_by,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id
    `;

    const transactionParams: (string | number | boolean | null)[] = [
      customer_type?.toUpperCase() || 'MEMBER',
      member_id || null,
      totalPaidAmount,
      outstandingAmount,
      transactionStatus,
      finalReceiptNo,
      remarks || '',
      true, // process_payment
      handled_by,
      created_by
    ];

    console.log('Transaction Query:', transactionQuery);
    console.log('Transaction Params:', transactionParams);

    const transactionResult = await client.query(transactionQuery, transactionParams);
    const saleTransactionId: number = transactionResult.rows[0].id;

    console.log('Created sale transaction with ID:', saleTransactionId);

    // Insert sale transaction items (WITHOUT employee assignments)
    for (const item of items) {
      const itemQuery: string = `
        INSERT INTO sale_transaction_items (
          sale_transaction_id,
          service_name,
          product_name,
          member_care_package_id,
          member_voucher_id,
          original_unit_price,
          custom_unit_price,
          discount_percentage,
          quantity,
          amount,
          item_type,
          remarks,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING id
      `;

      const pricing: ItemPricing = item.pricing || {
        originalPrice: 0,
        customPrice: 0,
        discount: 0,
        quantity: 1,
        totalLinePrice: 0
      };

      let itemType: string;
      let serviceName: string | null;
      let productName: string | null;
      
      // Simplified logic for services and products only
      if (item.type === 'service') {
        itemType = 'service';
        serviceName = item.data?.name || null;
        productName = null;
      } else if (item.type === 'product') {
        itemType = 'product';
        serviceName = null;
        productName = item.data?.name || null;
      } else {
        throw new Error(`Invalid item type '${item.type}' for services/products transaction. Only 'service' and 'product' are allowed.`);
      }

      const itemParams: (string | number | null)[] = [
        saleTransactionId,
        serviceName,
        productName,
        null, // member_care_package_id - always null for services/products
        null, // member_voucher_id - always null for services/products
        pricing.originalPrice || 0,
        pricing.customPrice || 0,
        pricing.discount || 0,
        pricing.quantity || 1,
        pricing.totalLinePrice || 0,
        itemType,
        item.remarks || '',
      ];

      console.log('Item Query:', itemQuery);
      console.log('Item Params:', itemParams);

      const itemResult = await client.query(itemQuery, itemParams);
      const saleTransactionItemId: number = itemResult.rows[0].id;
      
      console.log('Created sale transaction item with ID:', saleTransactionItemId);

      // REMOVED: Employee assignment section completely removed
    }

    // Insert payments
    for (const payment of payments) {
      if (payment.amount > 0) {
        const paymentQuery: string = `
          INSERT INTO payment_to_sale_transactions (
            sale_transaction_id,
            payment_method_id,
            amount,
            remarks,
            created_by,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING id
        `;

        const paymentParams: (number | string)[] = [
          saleTransactionId,
          payment.methodId,
          payment.amount,
          payment.remark || '',
          created_by
        ];

        console.log('Payment Query:', paymentQuery);
        console.log('Payment Params:', paymentParams);

        const paymentResult = await client.query(paymentQuery, paymentParams);
        console.log('Greated payment with ID:', paymentResult.rows[0].id);
      }
    }

    await client.query('COMMIT');
    console.log('Transaction committed successfully');

    // Return the created transaction data
    return {
      id: saleTransactionId,
      receipt_no: finalReceiptNo,
      customer_type: customer_type?.toUpperCase() || 'MEMBER',
      member_id: member_id ? member_id.toString() : null,
      total_transaction_amount: totalTransactionAmount,
      total_paid_amount: totalPaidAmount,
      outstanding_total_payment_amount: outstandingAmount,
      transaction_status: transactionStatus,
      remarks: remarks || '',
      created_by,
      handled_by,
      items_count: items.length,
      payments_count: payments.filter((p: PaymentMethodRequest) => p.amount > 0).length
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating sale transaction:', error);
    throw error;
  } finally {
    client.release();
  }
};

const createMcpTransaction = async (
  transactionData: SingleItemTransactionRequestData
): Promise<SingleItemTransactionCreationResult> => {
  const client = await pool().connect();
  
  try {
    await client.query('BEGIN');

    // Extract data from request
    const {
      customer_type,
      member_id,
      receipt_number,
      remarks,
      created_by,
      handled_by,
      item,
      payments
    } = transactionData;

    // Validate required fields
    if (!created_by) {
      throw new Error('created_by is required');
    }

    if (!handled_by) {
      throw new Error('handled_by is required');
    }

    if (!item || item.type !== 'package') {
      throw new Error('item is required and must be of type "package"');
    }

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      throw new Error('payments array is required and cannot be empty');
    }

    // Calculate totals from single package item
    const totalTransactionAmount: number = item.pricing?.totalLinePrice || 0;

    const PENDING_PAYMENT_METHOD_ID = 7;
    
    const pendingPayments = payments.filter((payment: PaymentMethodRequest) => 
      payment.methodId === PENDING_PAYMENT_METHOD_ID
    );
    
    const nonPendingPayments = payments.filter((payment: PaymentMethodRequest) => 
      payment.methodId !== PENDING_PAYMENT_METHOD_ID
    );
    const totalPaidAmount: number = nonPendingPayments.reduce((total: number, payment: PaymentMethodRequest) => {
      return total + (payment.amount || 0);
    }, 0);

    const outstandingAmount: number = pendingPayments.reduce((total: number, payment: PaymentMethodRequest) => {
      return total + (payment.amount || 0);
    }, 0);

    const transactionStatus: 'FULL' | 'PARTIAL' = outstandingAmount <= 0 ? 'FULL' : 'PARTIAL';
    const processPayment: boolean = outstandingAmount > 0; 

    // Verification: total should match
    const calculatedTotal = totalPaidAmount + outstandingAmount;
    if (Math.abs(calculatedTotal - totalTransactionAmount) > 0.01) {
      console.warn('Payment total mismatch:', {
        totalTransactionAmount,
        totalPaidAmount,
        outstandingAmount,
        calculatedTotal
      });
    }


    // Use receipt number from frontend
    let finalReceiptNo: string = receipt_number || '';
    if (!finalReceiptNo) {
      const receiptResult = await client.query(
        'SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_no FROM 3) AS INTEGER)), 0) + 1 as next_number FROM sale_transactions WHERE receipt_no LIKE $1',
        [`ST%`]
      );
      finalReceiptNo = `ST${receiptResult.rows[0].next_number.toString().padStart(6, '0')}`;
    }

    // Insert main sales transaction
    const transactionQuery: string = `
      INSERT INTO sale_transactions (
        customer_type,
        member_id,
        total_paid_amount,
        outstanding_total_payment_amount,
        sale_transaction_status,
        receipt_no,
        remarks,
        process_payment,
        handled_by,
        created_by,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id
    `;

    const transactionParams: (string | number | boolean | null)[] = [
      customer_type?.toUpperCase() || 'MEMBER',
      member_id || null,
      totalPaidAmount,
      outstandingAmount,
      transactionStatus,
      finalReceiptNo,
      remarks || '',
      true, // process_payment
      handled_by,
      created_by
    ];

    console.log('MCP Transaction Query:', transactionQuery);
    console.log('MCP Transaction Params:', transactionParams);

    const transactionResult = await client.query(transactionQuery, transactionParams);
    const saleTransactionId: number = transactionResult.rows[0].id;
    
    console.log('Created MCP sale transaction with ID:', saleTransactionId);

    // Insert package item
    const itemQuery: string = `
      INSERT INTO sale_transaction_items (
        sale_transaction_id,
        service_name,
        product_name,
        member_care_package_id,
        member_voucher_id,
        original_unit_price,
        custom_unit_price,
        discount_percentage,
        quantity,
        amount,
        item_type,
        remarks,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING id
    `;

    const itemParams: (string | number | null)[] = [
      saleTransactionId,
      null, // service_name
      null, // product_name
      100, // member_care_package_id (hardcoded for testing)
      null, // member_voucher_id
      item.pricing?.originalPrice || 0,
      item.pricing?.customPrice || 0,
      item.pricing?.discount || 0,
      item.pricing?.quantity || 1,
      item.pricing?.totalLinePrice || 0,
      'package',
      item.remarks || ''
    ];

    console.log('MCP Item Query:', itemQuery);
    console.log('MCP Item Params:', itemParams);

    const itemResult = await client.query(itemQuery, itemParams);
    const saleTransactionItemId: number = itemResult.rows[0].id;
    
    console.log('Created MCP sale transaction item with ID:', saleTransactionItemId);

    // Insert ALL payment records (both pending and non-pending)
    for (const payment of payments) {
      if (payment.amount > 0) {
        const paymentQuery: string = `
          INSERT INTO payment_to_sale_transactions (
            sale_transaction_id,
            payment_method_id,
            amount,
            remarks,
            created_by,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING id
        `;

        const paymentParams: (number | string)[] = [
          saleTransactionId,
          payment.methodId,
          payment.amount,
          payment.remark || '',
          created_by
        ];

        console.log('Payment Query:', paymentQuery);
        console.log('Payment Params:', paymentParams);

        const paymentResult = await client.query(paymentQuery, paymentParams);
        console.log('Greated payment with ID:', paymentResult.rows[0].id);
      }
    }

    await client.query('COMMIT');
    console.log('MCP Transaction committed successfully');

    // Return the created transaction data
    return {
      id: saleTransactionId,
      receipt_no: finalReceiptNo,
      customer_type: customer_type?.toUpperCase() || 'MEMBER',
      member_id: member_id ? member_id.toString() : null,
      total_transaction_amount: totalTransactionAmount,
      total_paid_amount: totalPaidAmount,
      outstanding_total_payment_amount: outstandingAmount, 
      transaction_status: transactionStatus,
      remarks: remarks || '',
      created_by,
      handled_by,
      package_id: 100, // hardcoded for testing
      package_name: item.data?.package_name || item.data?.name || null,
      items_count: 1,
      payments_count: payments.filter((p: PaymentMethodRequest) => p.amount > 0).length
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating MCP sale transaction:', error);
    throw error;
  } finally {
    client.release();
  }
};



const createMvTransaction = async (
  transactionData: SingleItemTransactionRequestData
): Promise<SingleItemTransactionCreationResult> => {
  const client = await pool().connect();
  
  try {
    await client.query('BEGIN');

    // Extract data from request
    const {
      customer_type,
      member_id,
      receipt_number,
      remarks,
      created_by,
      handled_by,
      item,
      payments
    } = transactionData;

    // Validate required fields
    if (!created_by) {
      throw new Error('created_by is required');
    }

    if (!handled_by) {
      throw new Error('handled_by is required');
    }

    if (!item || item.type !== 'member-voucher') {
      throw new Error('item is required and must be of type "member-voucher"');
    }

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      throw new Error('payments array is required and cannot be empty');
    }

    const totalTransactionAmount: number = item.pricing?.totalLinePrice || 0;

    const PENDING_PAYMENT_METHOD_ID = 7;
    
    const pendingPayments = payments.filter((payment: PaymentMethodRequest) => 
      payment.methodId === PENDING_PAYMENT_METHOD_ID
    );
    
    const nonPendingPayments = payments.filter((payment: PaymentMethodRequest) => 
      payment.methodId !== PENDING_PAYMENT_METHOD_ID
    );

    const totalPaidAmount: number = nonPendingPayments.reduce((total: number, payment: PaymentMethodRequest) => {
      return total + (payment.amount || 0);
    }, 0);

    const outstandingAmount: number = pendingPayments.reduce((total: number, payment: PaymentMethodRequest) => {
      return total + (payment.amount || 0);
    }, 0);

    const transactionStatus: 'FULL' | 'PARTIAL' = outstandingAmount <= 0 ? 'FULL' : 'PARTIAL';
    const processPayment: boolean = outstandingAmount > 0; 


    let finalReceiptNo: string = receipt_number || '';
    if (!finalReceiptNo) {
      const receiptResult = await client.query(
        'SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_no FROM 3) AS INTEGER)), 0) + 1 as next_number FROM sale_transactions WHERE receipt_no LIKE $1',
        [`ST%`]
      );
      finalReceiptNo = `ST${receiptResult.rows[0].next_number.toString().padStart(6, '0')}`;
    }

    const transactionQuery: string = `
      INSERT INTO sale_transactions (
        customer_type,
        member_id,
        total_paid_amount,
        outstanding_total_payment_amount,
        sale_transaction_status,
        receipt_no,
        remarks,
        process_payment,
        handled_by,
        created_by,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id
    `;

    const transactionParams: (string | number | boolean | null)[] = [
      customer_type?.toUpperCase() || 'MEMBER',
      member_id || null,
      totalPaidAmount,        
      outstandingAmount,     
      transactionStatus,
      finalReceiptNo,
      remarks || '',
      processPayment,      
      handled_by,
      created_by
    ];

    console.log('MV Transaction Query:', transactionQuery);
    console.log('MV Transaction Params:', transactionParams);

    const transactionResult = await client.query(transactionQuery, transactionParams);
    const saleTransactionId: number = transactionResult.rows[0].id;
    
    console.log('Created MV sale transaction with ID:', saleTransactionId);

    // Insert voucher item (similar logic to MCP)
    const itemQuery: string = `
      INSERT INTO sale_transaction_items (
        sale_transaction_id,
        service_name,
        product_name,
        member_care_package_id,
        member_voucher_id,
        original_unit_price,
        custom_unit_price,
        discount_percentage,
        quantity,
        amount,
        item_type,
        remarks,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING id
    `;

    const itemParams: (string | number | null)[] = [
      saleTransactionId,
      null, // service_name
      null, // product_name
      null, // member_care_package_id
      200, // member_voucher_id (hardcoded for testing)
      item.pricing?.originalPrice || 0,
      item.pricing?.customPrice || 0,
      item.pricing?.discount || 0,
      item.pricing?.quantity || 1,
      item.pricing?.totalLinePrice || 0,
      'member-voucher',
      item.remarks || ''
    ];

    console.log('MV Item Query:', itemQuery);
    console.log('MV Item Params:', itemParams);

    const itemResult = await client.query(itemQuery, itemParams);
    const saleTransactionItemId: number = itemResult.rows[0].id;
    
    console.log('Created MV sale transaction item with ID:', saleTransactionItemId);

    // Insert ALL payment records (both pending and non-pending)
    for (const payment of payments) {
      if (payment.amount > 0) {
        const paymentQuery: string = `
          INSERT INTO payment_to_sale_transactions (
            sale_transaction_id,
            payment_method_id,
            amount,
            remarks,
            created_by,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING id
        `;

        const paymentParams: (number | string)[] = [
          saleTransactionId,
          payment.methodId,
          payment.amount,
          payment.remark || '',
          created_by
        ];

        console.log('MV Payment Query:', paymentQuery);
        console.log('MV Payment Params:', paymentParams);

        const paymentResult = await client.query(paymentQuery, paymentParams);
        console.log('Created MV payment with ID:', paymentResult.rows[0].id);
      }
    }

    await client.query('COMMIT');
    console.log('MV Transaction committed successfully');

    // Return the created transaction data
    return {
      id: saleTransactionId,
      receipt_no: finalReceiptNo,
      customer_type: customer_type?.toUpperCase() || 'MEMBER',
      member_id: member_id ? member_id.toString() : null,
      total_transaction_amount: totalTransactionAmount,
      total_paid_amount: totalPaidAmount,       
      outstanding_total_payment_amount: outstandingAmount,
      transaction_status: transactionStatus,
      remarks: remarks || '',
      created_by,
      handled_by,
      voucher_id: 200, // hardcoded for testing
      voucher_name: item.data?.member_voucher_name || item.data?.name || null,
      items_count: 1,
      payments_count: payments.filter((p: PaymentMethodRequest) => p.amount > 0).length
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating MV sale transaction:', error);
    throw error;
  } finally {
    client.release();
  }
};



const createMcpTransferTransaction = async (
  transactionData: SingleItemTransactionRequestData
): Promise<SingleItemTransactionCreationResult> => {
  const client = await pool().connect();
  
  try {
    await client.query('BEGIN');

    // Extract data from request
    const {
      customer_type,
      member_id,
      receipt_number,
      remarks,
      created_by,
      handled_by,
      item,
      payments
    } = transactionData;

    // Validate required fields
    if (!created_by) {
      throw new Error('created_by is required');
    }

    if (!handled_by) {
      throw new Error('handled_by is required');
    }

    if (!item || (item.type !== 'transfer' && item.type !== 'transferMCP')) {
      throw new Error('item is required and must be of type "transfer" or "transferMCP"');
    }

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      throw new Error('payments array is required and cannot be empty');
    }

    // Calculate totals from single transfer item
    const totalTransactionAmount: number = item.pricing?.totalLinePrice || 0;

    // For transfers, we expect full payment (no pending logic needed)
    const totalPaidAmount: number = payments.reduce((total: number, payment: PaymentMethodRequest) => {
      return total + (payment.amount || 0);
    }, 0);

    const outstandingAmount: number = 0;
    const transactionStatus: 'TRANSFER' | 'FULL' = 'TRANSFER'; // Transfers are always fully paid
    const processPayment: boolean = false; 

    // Verification: total should match (simplified for transfers)
    if (Math.abs(totalPaidAmount - totalTransactionAmount) > 0.01) {
      console.warn('MCP Transfer payment total mismatch:', {
        totalTransactionAmount,
        totalPaidAmount,
        expected: 'Amounts should be equal for transfers'
      });
    }

    // Use receipt number from frontend
    let finalReceiptNo: string = receipt_number || '';
    if (!finalReceiptNo) {
      const receiptResult = await client.query(
        'SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_no FROM 3) AS INTEGER)), 0) + 1 as next_number FROM sale_transactions WHERE receipt_no LIKE $1',
        [`ST%`]
      );
      finalReceiptNo = `ST${receiptResult.rows[0].next_number.toString().padStart(6, '0')}`;
    }

    // Insert main sales transaction
    const transactionQuery: string = `
      INSERT INTO sale_transactions (
        customer_type,
        member_id,
        total_paid_amount,
        outstanding_total_payment_amount,
        sale_transaction_status,
        receipt_no,
        remarks,
        process_payment,
        handled_by,
        created_by,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id
    `;

    const transactionParams: (string | number | boolean | null)[] = [
      customer_type?.toUpperCase() || 'MEMBER',
      member_id || null,
      totalPaidAmount,        
      outstandingAmount,  
      transactionStatus,
      finalReceiptNo,
      remarks || '',
      processPayment,         
      handled_by,
      created_by
    ];

    console.log('MCP Transfer Transaction Query:', transactionQuery);
    console.log('MCP Transfer Transaction Params:', transactionParams);

    const transactionResult = await client.query(transactionQuery, transactionParams);
    const saleTransactionId: number = transactionResult.rows[0].id;
    
    console.log('Created MCP Transfer sale transaction with ID:', saleTransactionId);

    // Insert transfer item
    const itemQuery: string = `
      INSERT INTO sale_transaction_items (
        sale_transaction_id,
        service_name,
        product_name,
        member_care_package_id,
        member_voucher_id,
        original_unit_price,
        custom_unit_price,
        discount_percentage,
        quantity,
        amount,
        item_type,
        remarks,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING id
    `;

    const itemParams: (string | number | null)[] = [
      saleTransactionId,
      null, // service_name
      null, // product_name
      item.data?.queueItem?.mcp_id2 || null, //ths shud be the mcp being transferred to
      null, // member_voucher_id
      item.pricing?.originalPrice || 0,
      item.pricing?.customPrice || 0,
      item.pricing?.discount || 0,
      item.pricing?.quantity || 1,
      item.pricing?.totalLinePrice || 0,
      'mcp_transfer',
      item.remarks || item.data?.description || ''
    ];

    console.log('MCP Transfer Item Query:', itemQuery);
    console.log('MCP Transfer Item Params:', itemParams);

    const itemResult = await client.query(itemQuery, itemParams);
    const saleTransactionItemId: number = itemResult.rows[0].id;
    
    console.log('Created MCP Transfer sale transaction item with ID:', saleTransactionItemId);

    // Insert ALL payment records (both pending and non-pending)
    for (const payment of payments) {
      if (payment.amount > 0) {
        const paymentQuery: string = `
          INSERT INTO payment_to_sale_transactions (
            sale_transaction_id,
            payment_method_id,
            amount,
            remarks,
            created_by,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING id
        `;

        // Handle special "transfer" payment method
        let paymentMethodId: number;
        if (payment.methodId === 'transfer') {
          paymentMethodId = 9; // Assuming 9 is the ID for "Transfer" payment method
        } else {
          paymentMethodId = typeof payment.methodId === 'string' ? parseInt(payment.methodId) : payment.methodId;
        }

        const paymentParams: (number | string)[] = [
          saleTransactionId,
          paymentMethodId,
          payment.amount,
          payment.remark || '',
          created_by
        ];

        console.log('MCP Transfer Payment Query:', paymentQuery);
        console.log('MCP Transfer Payment Params:', paymentParams);

        const paymentResult = await client.query(paymentQuery, paymentParams);
        console.log('Created MCP Transfer payment with ID:', paymentResult.rows[0].id);
      }
    }

    await client.query('COMMIT');
    console.log('MCP Transfer Transaction committed successfully');

    // Return the created transaction data
    return {
      id: saleTransactionId,
      receipt_no: finalReceiptNo,
      customer_type: customer_type?.toUpperCase() || 'MEMBER',
      member_id: member_id ? member_id.toString() : null,
      total_transaction_amount: totalTransactionAmount,
      total_paid_amount: totalPaidAmount,
      outstanding_total_payment_amount: outstandingAmount, 
      transaction_status: transactionStatus,
      remarks: remarks || '',
      created_by,
      handled_by,
      mcp_id1: item.data?.queueItem?.mcp_id1 || null,
      mcp_id2: item.data?.queueItem?.mcp_id2 || null,
      transfer_amount: item.data?.amount || totalTransactionAmount,
      transfer_description: item.data?.description || '',
      items_count: 1,
      payments_count: payments.filter((p: PaymentMethodRequest) => p.amount > 0).length
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating MCP Transfer sale transaction:', error);
    throw error;
  } finally {
    client.release();
  }
};



const createMvTransferTransaction = async (
  transactionData: SingleItemTransactionRequestData
): Promise<SingleItemTransactionCreationResult> => {
  const client = await pool().connect();
  
  try {
    await client.query('BEGIN');

    // Extract data from request
    const {
      customer_type,
      member_id,
      receipt_number,
      remarks,
      created_by,
      handled_by,
      item,
      payments
    } = transactionData;

    // Validate required fields
    if (!created_by) {
      throw new Error('created_by is required');
    }

    if (!handled_by) {
      throw new Error('handled_by is required');
    }

    if (!item || item.type !== 'transferMV') {
      throw new Error('item is required and must be of type "transferMV"');
    }

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      throw new Error('payments array is required and cannot be empty');
    }

    // Calculate totals from single transfer item
    const totalTransactionAmount: number = item.pricing?.totalLinePrice || 0;

    // For transfers, we expect full payment (no pending logic needed)
    const totalPaidAmount: number = payments.reduce((total: number, payment: PaymentMethodRequest) => {
      return total + (payment.amount || 0);
    }, 0);

    const outstandingAmount: number = 0; // Transfers should always be fully paid
    const transactionStatus: 'FULL' | 'PARTIAL' = 'FULL'; // Always full for transfers
    const processPayment: boolean = false; // No further payment processing needed

    // Verification: total should match (simplified for transfers)
    if (Math.abs(totalPaidAmount - totalTransactionAmount) > 0.01) {
      console.warn('MV Transfer payment total mismatch:', {
        totalTransactionAmount,
        totalPaidAmount,
        expected: 'Amounts should be equal for transfers'
      });
    }

    // Use receipt number from frontend
    let finalReceiptNo: string = receipt_number || '';
    if (!finalReceiptNo) {
      const receiptResult = await client.query(
        'SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_no FROM 3) AS INTEGER)), 0) + 1 as next_number FROM sale_transactions WHERE receipt_no LIKE $1',
        [`ST%`]
      );
      finalReceiptNo = `ST${receiptResult.rows[0].next_number.toString().padStart(6, '0')}`;
    }

    // Insert main sales transaction
    const transactionQuery: string = `
      INSERT INTO sale_transactions (
        customer_type,
        member_id,
        total_paid_amount,
        outstanding_total_payment_amount,
        sale_transaction_status,
        receipt_no,
        remarks,
        process_payment,
        handled_by,
        created_by,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id
    `;

    const transactionParams: (string | number | boolean | null)[] = [
      customer_type?.toUpperCase() || 'MEMBER',
      member_id || null,
      totalPaidAmount,        
      outstandingAmount,  
      transactionStatus,
      finalReceiptNo,
      remarks || '',
      processPayment,         
      handled_by,
      created_by
    ];

    console.log('MV Transfer Transaction Query:', transactionQuery);
    console.log('MV Transfer Transaction Params:', transactionParams);

    const transactionResult = await client.query(transactionQuery, transactionParams);
    const saleTransactionId: number = transactionResult.rows[0].id;
    
    console.log('Created MV Transfer sale transaction with ID:', saleTransactionId);

    // Insert transfer item
    const itemQuery: string = `
      INSERT INTO sale_transaction_items (
        sale_transaction_id,
        service_name,
        product_name,
        member_care_package_id,
        member_voucher_id,
        original_unit_price,
        custom_unit_price,
        discount_percentage,
        quantity,
        amount,
        item_type,
        remarks,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING id
    `;

    const itemParams: (string | number | null)[] = [
      saleTransactionId,
      null, // service_name
      null, // product_name
      null, // member_care_package_id
      item.data?.queueItem?.mv_id1 || null, // member_voucher_id (from transfer source)
      item.pricing?.originalPrice || 0,
      item.pricing?.customPrice || 0,
      item.pricing?.discount || 0,
      item.pricing?.quantity || 1,
      item.pricing?.totalLinePrice || 0,
      'mv_transfer',
      item.remarks || item.data?.description || ''
    ];

    console.log('MV Transfer Item Query:', itemQuery);
    console.log('MV Transfer Item Params:', itemParams);

    const itemResult = await client.query(itemQuery, itemParams);
    const saleTransactionItemId: number = itemResult.rows[0].id;
    
    console.log('Created MV Transfer sale transaction item with ID:', saleTransactionItemId);

    // Insert ALL payment records (both pending and non-pending)
    for (const payment of payments) {
      if (payment.amount > 0) {
        const paymentQuery: string = `
          INSERT INTO payment_to_sale_transactions (
            sale_transaction_id,
            payment_method_id,
            amount,
            remarks,
            created_by,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING id
        `;

        // Handle special "transfer" payment method
        let paymentMethodId: number;
        if (payment.methodId === 'transfer') {
          // Use a special payment method ID for transfers, or create one if needed
          // For now, let's use method ID 9 (you may need to adjust this based on your payment_methods table)
          paymentMethodId = 9; // Assuming 9 is the ID for "Transfer" payment method
        } else {
          paymentMethodId = typeof payment.methodId === 'string' ? parseInt(payment.methodId) : payment.methodId;
        }

        const paymentParams: (number | string)[] = [
          saleTransactionId,
          paymentMethodId,
          payment.amount,
          payment.remark || '',
          created_by
        ];

        console.log('MV Transfer Payment Query:', paymentQuery);
        console.log('MV Transfer Payment Params:', paymentParams);

        const paymentResult = await client.query(paymentQuery, paymentParams);
        console.log('Created MV Transfer payment with ID:', paymentResult.rows[0].id);
      }
    }

    await client.query('COMMIT');
    console.log('MV Transfer Transaction committed successfully');

    // Return the created transaction data
    return {
      id: saleTransactionId,
      receipt_no: finalReceiptNo,
      customer_type: customer_type?.toUpperCase() || 'MEMBER',
      member_id: member_id ? member_id.toString() : null,
      total_transaction_amount: totalTransactionAmount,
      total_paid_amount: totalPaidAmount,
      outstanding_total_payment_amount: outstandingAmount, 
      transaction_status: transactionStatus,
      remarks: remarks || '',
      created_by,
      handled_by,
      transfer_amount: item.data?.amount || totalTransactionAmount,
      transfer_description: item.data?.description || '',
      items_count: 1,
      payments_count: payments.filter((p: PaymentMethodRequest) => p.amount > 0).length
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating MV Transfer sale transaction:', error);
    throw error;
  } finally {
    client.release();
  }
};



export default {
  getSalesTransactionList,
  getSalesTransactionById,
  searchServices,
  searchProducts,
  createServicesProductsTransaction,
  createMcpTransaction,
  createMvTransaction,
  createMcpTransferTransaction,
  createMvTransferTransaction
};