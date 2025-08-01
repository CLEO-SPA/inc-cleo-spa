import { pool } from '../config/database.js';
import {
  Member,
  Payment,
  Employee,
  PaymentDetail,
  TransactionItem,              // ✅ Already enhanced with voucher/package fields
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
  ItemPricing,
  ProcessPartialPaymentData,
  ProcessPartialPaymentDataWithHandler,
  PartialPaymentResult,
  MemberVoucherTransactionLog,
  MemberCarePackageTransactionLog,

  VoucherGroup,
  CarePackageGroup,
  SalesTransactionResponse,
  MemberVoucher,
  APIResponse
} from '../types/SaleTransactionTypes.js';
import mcpModel from './mcpModel.js';

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
          payment_method: payment.payment_method_name,
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
        member: transaction.member_table_id
          ? {
            id: transaction.member_table_id.toString(),
            name: transaction.member_name,
            email: transaction.member_email,
            contact: transaction.member_contact,
          }
          : null,
        payments,
      };
    });

    return {
      items: transformedTransactions,
      total: totalItems,
      totalPages,
      currentPage: page,
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
        st.reference_sales_transaction_id,
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

    // Enhanced transaction items query with voucher and care package names
    const itemsQuery = `
      SELECT 
        sti.id,
        sti.service_name,
        sti.product_name,
        sti.member_care_package_id,
        sti.member_voucher_id,
        sti.original_unit_price,
        sti.custom_unit_price,
        sti.discount_percentage,
        sti.quantity,
        sti.remarks,
        sti.amount,
        sti.item_type,
        -- Member voucher information
        mv.member_voucher_name,
        mv.current_balance as voucher_balance,
        mv.status as voucher_status,
        -- Member care package information
        mcp.package_name as care_package_name,
        mcp.balance as care_package_balance,
        mcp.status as care_package_status
      FROM sale_transaction_items sti
      LEFT JOIN member_vouchers mv ON sti.member_voucher_id = mv.id
      LEFT JOIN member_care_packages mcp ON sti.member_care_package_id = mcp.id
      WHERE sti.sale_transaction_id = $1
      ORDER BY sti.id
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
      reference_sales_transaction_id: transaction.reference_sales_transaction_id,

      // Member information
      member: transaction.member_table_id
        ? {
          id: transaction.member_table_id.toString(),
          name: transaction.member_name,
          email: transaction.member_email,
          contact: transaction.member_contact,
        }
        : null,

      // Handler information
      handler: transaction.handled_by
        ? {
          code: transaction.handler_code,
          name: transaction.handler_name,
        }
        : null,

      // Creator information
      creator: transaction.created_by
        ? {
          code: transaction.creator_code,
          name: transaction.creator_name,
        }
        : null,

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
          name: payment.payment_creator_name,
        },
        updated_by: {
          code: payment.payment_updater_code,
          name: payment.payment_updater_name,
        },
      })),

      // Enhanced items information with voucher and care package details
      items: itemsResult.rows.map((item: any) => ({
        id: item.id.toString(),
        service_name: item.service_name || null,
        product_name: item.product_name || null,
        member_care_package_id: item.member_care_package_id?.toString() || null,
        member_voucher_id: item.member_voucher_id?.toString() || null,
        original_unit_price: parseFloat(item.original_unit_price || 0),
        custom_unit_price: parseFloat(item.custom_unit_price || 0),
        discount_percentage: parseFloat(item.discount_percentage || 0),
        quantity: item.quantity,
        remarks: item.remarks || '',
        amount: parseFloat(item.amount || 0),
        item_type: item.item_type,
        // Enhanced voucher information
        member_voucher_name: item.member_voucher_name || undefined,
        voucher_balance: item.voucher_balance ? parseFloat(item.voucher_balance) : undefined,
        voucher_status: item.voucher_status || undefined,
        // Enhanced care package information
        care_package_name: item.care_package_name || undefined,
        care_package_balance: item.care_package_balance ? parseFloat(item.care_package_balance) : undefined,
        care_package_status: item.care_package_status || undefined,
      })),
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
      sequence_no: service.service_sequence_no || 0,
    }));
  } catch (error: any) {
    console.error('Detailed error in searchServices:', error);
    throw new Error(`Error searching services: ${error.message}`);
  }
};

const searchProducts = async (searchQuery: string): Promise<Product[]> => {
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
      price: parseFloat(product.product_unit_sale_price || 0) /* Updated column name */,
      cost_price: parseFloat(product.product_unit_cost_price || 0) /* Updated column name */,
      is_enabled: product.product_is_enabled || false,
      sequence_no: product.product_sequence_no || 0,
    }));
  } catch (error: any) {
    console.error('Detailed error in searchProducts:', error);
    throw new Error(`Error searching products: ${error.message}`);
  }
};

const createServicesProductsTransaction = async (
  transactionData: TransactionRequestData
): Promise<TransactionCreationResult> => {
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
      items,
      payments,
      created_at,
      updated_at,
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

    let customCreatedAt = null;
    let customUpdatedAt = null;

    if (created_at) {
      try {
        customCreatedAt = new Date(created_at);
        if (isNaN(customCreatedAt.getTime())) {
          throw new Error('Invalid created_at date format');
        }
      } catch (error) {
        console.warn('Invalid created_at format, using current time:', created_at);
        customCreatedAt = new Date();
      }
    } else {
      customCreatedAt = new Date();
    }

    if (updated_at) {
      try {
        customUpdatedAt = new Date(updated_at);
        if (isNaN(customUpdatedAt.getTime())) {
          throw new Error('Invalid updated_at date format');
        }
      } catch (error) {
        console.warn('Invalid updated_at format, using created_at time:', updated_at);
        customUpdatedAt = customCreatedAt;
      }
    } else {
      customUpdatedAt = customCreatedAt;
    }

    // Calculate totals from items
    const totalTransactionAmount: number = items.reduce((total: number, item: TransactionRequestItem) => {
      return total + (item.pricing?.totalLinePrice || 0);
    }, 0);

    // ✅ FIXED: Use same payment logic as MCP transaction
    const PENDING_PAYMENT_METHOD_ID = 7;

    const pendingPayments = payments.filter((payment: PaymentMethodRequest) =>
      payment.methodId === PENDING_PAYMENT_METHOD_ID
    );

    const nonPendingPayments = payments.filter((payment: PaymentMethodRequest) =>
      payment.methodId !== PENDING_PAYMENT_METHOD_ID
    );

    // Calculate total paid amount from NON-PENDING payments only
    const totalPaidAmount: number = nonPendingPayments.reduce((total: number, payment: PaymentMethodRequest) => {
      return total + (payment.amount || 0);
    }, 0);

    // Outstanding amount comes from PENDING payments only
    const outstandingAmount: number = pendingPayments.reduce((total: number, payment: PaymentMethodRequest) => {
      return total + (payment.amount || 0);
    }, 0);

    // Determine transaction status
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

    // Generate receipt number if not provided
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const transactionParams: (string | number | boolean | null | Date)[] = [
      customer_type?.toUpperCase() || 'MEMBER',
      member_id || null,
      totalPaidAmount,
      outstandingAmount,
      transactionStatus,
      finalReceiptNo,
      remarks || '',
      processPayment, // ✅ Now uses processPayment instead of hardcoded false
      handled_by,
      created_by,
      customCreatedAt,
      customUpdatedAt
    ];

    console.log('Services/Products Transaction Query:', transactionQuery);
    console.log('Services/Products Transaction Params:', transactionParams);

    const transactionResult = await client.query(transactionQuery, transactionParams);
    const saleTransactionId: number = transactionResult.rows[0].id;

    console.log('Created sale transaction with ID:', saleTransactionId);

    // Insert sale transaction items
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
          remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `;

      const pricing: ItemPricing = item.pricing || {
        originalPrice: 0,
        customPrice: 0,
        discount: 0,
        quantity: 1,
        totalLinePrice: 0,
      };

      let itemType: string;
      let serviceName: string | null;
      let productName: string | null;

      if (item.type === 'service') {
        itemType = 'service';
        serviceName = item.data?.name || null;
        productName = null;
      } else if (item.type === 'product') {
        itemType = 'product';
        serviceName = null;
        productName = item.data?.name || null;
      } else {
        throw new Error(`Invalid item type '${item.type}' for services/products transaction.`);
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

      const itemResult = await client.query(itemQuery, itemParams);
      const saleTransactionItemId: number = itemResult.rows[0].id;

      console.log('Created sale transaction item with ID:', saleTransactionItemId);
    }

    // ✅ Insert payments using same logic as MCP
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
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `;

        const paymentParams: (number | string | Date)[] = [
          saleTransactionId,
          payment.methodId,
          payment.amount,
          payment.remark || '',
          created_by, // ✅ Use created_by instead of handled_by for consistency
          customCreatedAt,
          customUpdatedAt
        ];

        const paymentResult = await client.query(paymentQuery, paymentParams);
        console.log('Created payment with ID:', paymentResult.rows[0].id);
      }
    }

    await client.query('COMMIT');
    console.log('Services/Products Transaction committed successfully');

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
      payments_count: payments.filter((p: PaymentMethodRequest) => p.amount > 0).length,
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
  let mcpId: string | number | null | undefined = null;
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
      payments,
      created_at,
      updated_at
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

    let customCreatedAt = null;
    let customUpdatedAt = null;

    if (created_at) {
      try {
        customCreatedAt = new Date(created_at);
        if (isNaN(customCreatedAt.getTime())) {
          customCreatedAt = new Date();
        }
      } catch (error) {
        customCreatedAt = new Date();
      }
    } else {
      customCreatedAt = new Date();
    }

    if (updated_at) {
      try {
        customUpdatedAt = new Date(updated_at);
        if (isNaN(customUpdatedAt.getTime())) {
          customUpdatedAt = customCreatedAt;
        }
      } catch (error) {
        customUpdatedAt = customCreatedAt;
      }
    } else {
      customUpdatedAt = customCreatedAt;
    }

    mcpId = item.data?.member_care_package_id || item.data?.id;

    if (!mcpId) {
      throw new Error('member_care_package_id is required in item data');
    }

    // Validate that the MCP ID exists in the database and get current balance
    const mcpValidationQuery = `
      SELECT id, package_name, balance 
      FROM member_care_packages 
      WHERE id = $1
    `;

    const mcpValidationResult = await client.query(mcpValidationQuery, [mcpId]);

    if (mcpValidationResult.rows.length === 0) {
      throw new Error(`Member Care Package with ID ${mcpId} not found`);
    }

    const mcpRecord = mcpValidationResult.rows[0];
    const currentBalance = parseFloat(mcpRecord.balance) || 0;

    // Calculate totals from single package item
    const totalTransactionAmount: number = item.pricing?.totalLinePrice || 0;

    const PENDING_PAYMENT_METHOD_ID = 7;
    const GST_PAYMENT_METHOD_ID = 10; // GST payment method ID

    // Separate payments by type
    const pendingPayments = payments.filter((payment: PaymentMethodRequest) =>
      payment.methodId === PENDING_PAYMENT_METHOD_ID
    );

    const gstPayments = payments.filter((payment: PaymentMethodRequest) =>
      payment.methodId === GST_PAYMENT_METHOD_ID
    );

    const actualPayments = payments.filter((payment: PaymentMethodRequest) =>
      payment.methodId !== PENDING_PAYMENT_METHOD_ID &&
      payment.methodId !== GST_PAYMENT_METHOD_ID
    );

    // Calculate amounts
    const totalActualPaymentAmount: number = actualPayments.reduce((total: number, payment: PaymentMethodRequest) => {
      return total + (payment.amount || 0);
    }, 0);

    const totalGSTAmount: number = gstPayments.reduce((total: number, payment: PaymentMethodRequest) => {
      return total + (payment.amount || 0);
    }, 0);

    // IGNORE pending amount from frontend - calculate our own
    const frontendPendingAmount: number = pendingPayments.reduce((total: number, payment: PaymentMethodRequest) => {
      return total + (payment.amount || 0);
    }, 0);

    // Calculate correct outstanding amount (backend authority)
    const outstandingAmount: number = Math.max(0, totalTransactionAmount - totalActualPaymentAmount);

    // Total paid amount = actual payments + GST (EXCLUDES pending)
    const totalPaidAmount: number = totalActualPaymentAmount + totalGSTAmount;

    const transactionStatus: 'FULL' | 'PARTIAL' = outstandingAmount <= 0 ? 'FULL' : 'PARTIAL';
    const processPayment: boolean = outstandingAmount > 0;

    console.log('✅ Payment calculations:', {
      totalTransactionAmount,
      totalActualPaymentAmount,
      totalGSTAmount,
      frontendPendingAmount: `${frontendPendingAmount} (from frontend - IGNORED)`,
      outstandingAmount: `${outstandingAmount} (backend calculated - USED)`,
      totalPaidAmount: `${totalPaidAmount} (actual + GST, excludes pending)`,
      transactionStatus,
      note: 'Backend ignores frontend pending amount and calculates its own'
    });

    // Use receipt number from frontend
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const transactionParams: (string | number | boolean | null | Date)[] = [
      customer_type?.toUpperCase() || 'MEMBER',
      member_id || null,
      totalPaidAmount, // Actual + GST (excludes pending)
      outstandingAmount, // Transaction amount - actual payments (excludes GST)
      transactionStatus,
      finalReceiptNo,
      remarks || '',
      processPayment,
      handled_by,
      created_by,
      customCreatedAt,
      customUpdatedAt
    ];

    const transactionResult = await client.query(transactionQuery, transactionParams);
    const saleTransactionId: number = transactionResult.rows[0].id;

    console.log('Created MCP sale transaction with ID:', saleTransactionId);

    // Insert package item with actual MCP ID
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
        remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const itemParams: (string | number | null)[] = [
      saleTransactionId,
      null, // service_name
      null, // product_name
      mcpId,
      null, // member_voucher_id
      item.pricing?.originalPrice || 0,
      item.pricing?.customPrice || 0,
      item.pricing?.discount || 0,
      item.pricing?.quantity || 1,
      item.pricing?.totalLinePrice || 0,
      'member care package',
      item.remarks || ''
    ];

    const itemResult = await client.query(itemQuery, itemParams);
    const saleTransactionItemId: number = itemResult.rows[0].id;

    console.log('Created MCP sale transaction item with ID:', saleTransactionItemId);

    // Update MCP balance with the paid amount EXCLUDING GST
    if (totalActualPaymentAmount > 0) {
      const newBalance = currentBalance + totalActualPaymentAmount;

      const updateBalanceQuery = `
        UPDATE member_care_packages 
        SET balance = $1, updated_at = $2
        WHERE id = $3
        RETURNING balance
      `;

      const updateBalanceResult = await client.query(updateBalanceQuery, [newBalance, customUpdatedAt, mcpId]);
      const updatedBalance = updateBalanceResult.rows[0].balance;

      console.log('✅ Updated MCP balance (excluding GST):', {
        mcpId: mcpId,
        previousBalance: currentBalance,
        actualPaymentAmount: totalActualPaymentAmount,
        gstAmount: totalGSTAmount,
        totalPaidAmount: totalPaidAmount,
        newBalance: updatedBalance,
        note: 'GST excluded from balance calculation'
      });
    }

    // Insert all payments (actual + GST) and create correct pending payment
    for (const payment of payments) {
      // Skip frontend pending payments - we'll create our own
      if (payment.methodId === PENDING_PAYMENT_METHOD_ID) {
        console.log('Skipping frontend pending payment:', {
          amount: payment.amount,
          note: 'Backend will create correct pending payment'
        });
        continue;
      }

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
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `;

        const paymentParams: (number | string | Date)[] = [
          saleTransactionId,
          payment.methodId,
          payment.amount,
          payment.remark || '',
          handled_by,
          customCreatedAt,
          customUpdatedAt
        ];

        const paymentResult = await client.query(paymentQuery, paymentParams);
        console.log('Created payment with ID:', paymentResult.rows[0].id, {
          methodId: payment.methodId,
          amount: payment.amount,
          isGST: payment.methodId === GST_PAYMENT_METHOD_ID
        });
      }
    }

    // Create correct pending payment if needed (using backend calculated amount)
    if (outstandingAmount > 0) {
      const pendingPaymentQuery: string = `
        INSERT INTO payment_to_sale_transactions (
          sale_transaction_id,
          payment_method_id,
          amount,
          remarks,
          created_by,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

      const pendingPaymentParams: (number | string | Date)[] = [
        saleTransactionId,
        PENDING_PAYMENT_METHOD_ID,
        outstandingAmount,
        'Backend calculated pending payment',
        handled_by,
        customCreatedAt,
        customUpdatedAt
      ];

      const pendingResult = await client.query(pendingPaymentQuery, pendingPaymentParams);
      console.log('Created correct pending payment with ID:', pendingResult.rows[0].id, {
        methodId: PENDING_PAYMENT_METHOD_ID,
        amount: outstandingAmount,
        note: 'Backend calculated - ignores frontend pending'
      });
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
      total_paid_amount: totalPaidAmount, // Actual + GST (excludes pending)
      outstanding_total_payment_amount: outstandingAmount, // Transaction - actual (excludes GST)
      transaction_status: transactionStatus,
      remarks: remarks || '',
      created_by,
      handled_by,
      package_name: mcpRecord.package_name,
      items_count: 1,
      payments_count: payments.filter((p: PaymentMethodRequest) => p.amount > 0).length
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating MCP sale transaction:', error);

    // Only attempt to delete the MCP if we have a valid ID
    if (mcpId) {
      try {
        await mcpModel.deleteMemberCarePackage(mcpId as string);
        console.log(`Successfully deleted MCP with ID ${mcpId} after transaction failure`);
      } catch (deleteError) {
        console.error(`Failed to delete MCP with ID ${mcpId} after transaction failure:`, deleteError);
      }
    }

    throw error;
  } finally {
    client.release();
  }
};

//no longer used
const createMvTransaction = async (
  transactionData: SingleItemTransactionRequestData
): Promise<SingleItemTransactionCreationResult> => {
  const client = await pool().connect();

  try {
    await client.query('BEGIN');

    const {
      customer_type,
      member_id,
      receipt_number,
      remarks,
      created_by,
      handled_by,
      item,
      payments,
      created_at,
      updated_at,
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

    let customCreatedAt = null;
    let customUpdatedAt = null;

    if (created_at) {
      try {
        customCreatedAt = new Date(created_at);
        if (isNaN(customCreatedAt.getTime())) {
          console.warn('Invalid created_at format, using current time:', created_at);
          customCreatedAt = new Date();
        }
      } catch (error) {
        console.warn('Error parsing created_at, using current time:', error);
        customCreatedAt = new Date();
      }
    } else {
      customCreatedAt = new Date();
    }

    if (updated_at) {
      try {
        customUpdatedAt = new Date(updated_at);
        if (isNaN(customUpdatedAt.getTime())) {
          console.warn('Invalid updated_at format, using created_at time:', updated_at);
          customUpdatedAt = customCreatedAt;
        }
      } catch (error) {
        console.warn('Error parsing updated_at, using created_at time:', error);
        customUpdatedAt = customCreatedAt;
      }
    } else {
      customUpdatedAt = customCreatedAt;
    }

    const mvId = item.data?.member_voucher_id || item.data?.id;

    if (!mvId) {
      throw new Error('member_voucher_id is required in item data');
    }

    const mvValidationQuery = `
      SELECT id, member_voucher_name 
      FROM member_vouchers 
      WHERE id = $1
    `;

    const mvValidationResult = await client.query(mvValidationQuery, [mvId]);

    if (mvValidationResult.rows.length === 0) {
      throw new Error(`Member Voucher with ID ${mvId} not found`);
    }

    const mvRecord = mvValidationResult.rows[0];
    console.log('✅ Validated MV exists:', {
      mvId: mvId,
      voucherName: mvRecord.member_voucher_name,
    });

    const totalTransactionAmount: number = item.pricing?.totalLinePrice || 0;

    const PENDING_PAYMENT_METHOD_ID = 7;
    const GST_PAYMENT_METHOD_ID = 10;

    // Separate payments by type (same as MCP)
    const pendingPayments = payments.filter((payment: PaymentMethodRequest) =>
      payment.methodId === PENDING_PAYMENT_METHOD_ID
    );

    const gstPayments = payments.filter((payment: PaymentMethodRequest) =>
      payment.methodId === GST_PAYMENT_METHOD_ID
    );

    const actualPayments = payments.filter((payment: PaymentMethodRequest) =>
      payment.methodId !== PENDING_PAYMENT_METHOD_ID &&
      payment.methodId !== GST_PAYMENT_METHOD_ID
    );

    // Calculate amounts (same logic as MCP)
    const totalActualPaymentAmount: number = actualPayments.reduce((total: number, payment: PaymentMethodRequest) => {
      return total + (payment.amount || 0);
    }, 0);

    const totalGSTAmount: number = gstPayments.reduce((total: number, payment: PaymentMethodRequest) => {
      return total + (payment.amount || 0);
    }, 0);

    // IGNORE pending amount from frontend - calculate our own (same as MCP)
    const frontendPendingAmount: number = pendingPayments.reduce((total: number, payment: PaymentMethodRequest) => {
      return total + (payment.amount || 0);
    }, 0);

    // Calculate correct outstanding amount (backend authority) - same as MCP
    const outstandingAmount: number = Math.max(0, totalTransactionAmount - totalActualPaymentAmount);

    // Total paid amount = actual payments + GST (EXCLUDES pending) - same as MCP
    const totalPaidAmount: number = totalActualPaymentAmount + totalGSTAmount;

    const transactionStatus: 'FULL' | 'PARTIAL' = outstandingAmount <= 0 ? 'FULL' : 'PARTIAL';
    const processPayment: boolean = outstandingAmount > 0;

    console.log('✅ MV Payment calculations:', {
      totalTransactionAmount,
      totalActualPaymentAmount,
      totalGSTAmount,
      frontendPendingAmount: `${frontendPendingAmount} (from frontend - IGNORED)`,
      outstandingAmount: `${outstandingAmount} (backend calculated - USED)`,
      totalPaidAmount: `${totalPaidAmount} (actual + GST, excludes pending)`,
      transactionStatus,
      note: 'Backend ignores frontend pending amount and calculates its own'
    });

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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const transactionParams: (string | number | boolean | null | Date)[] = [
      customer_type?.toUpperCase() || 'MEMBER',
      member_id || null,
      totalPaidAmount, // Actual + GST (excludes pending)
      outstandingAmount, // Transaction amount - actual payments (excludes GST)
      transactionStatus,
      finalReceiptNo,
      remarks || '',
      processPayment,
      handled_by,
      created_by,
      customCreatedAt,
      customUpdatedAt,
    ];

    const transactionResult = await client.query(transactionQuery, transactionParams);
    const saleTransactionId: number = transactionResult.rows[0].id;

    // Insert voucher item with actual MV ID
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
        remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const itemParams: (string | number | null)[] = [
      saleTransactionId,
      null, // service_name
      null, // product_name
      null, // member_care_package_id
      mvId,
      item.pricing?.originalPrice || 0,
      item.pricing?.customPrice || 0,
      item.pricing?.discount || 0,
      item.pricing?.quantity || 1,
      item.pricing?.totalLinePrice || 0,
      'member voucher',
      item.remarks || '',
    ];

    const itemResult = await client.query(itemQuery, itemParams);
    const saleTransactionItemId: number = itemResult.rows[0].id;

    // Insert all payments (actual + GST) and create correct pending payment
    for (const payment of payments) {
      // Skip frontend pending payments - we'll create our own (same as MCP)
      if (payment.methodId === PENDING_PAYMENT_METHOD_ID) {
        console.log('Skipping frontend pending payment:', {
          amount: payment.amount,
          note: 'Backend will create correct pending payment'
        });
        continue;
      }

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
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `;

        const paymentParams: (number | string | Date)[] = [
          saleTransactionId,
          payment.methodId,
          payment.amount,
          payment.remark || '',
          handled_by,
          customCreatedAt,
          customUpdatedAt
        ];

        const paymentResult = await client.query(paymentQuery, paymentParams);
        console.log('Created MV payment with ID:', paymentResult.rows[0].id, {
          methodId: payment.methodId,
          amount: payment.amount,
          isGST: payment.methodId === GST_PAYMENT_METHOD_ID
        });
      }
    }

    // Create correct pending payment if needed (using backend calculated amount) - same as MCP
    if (outstandingAmount > 0) {
      const pendingPaymentQuery: string = `
        INSERT INTO payment_to_sale_transactions (
          sale_transaction_id,
          payment_method_id,
          amount,
          remarks,
          created_by,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

      const pendingPaymentParams: (number | string | Date)[] = [
        saleTransactionId,
        PENDING_PAYMENT_METHOD_ID,
        outstandingAmount,
        'Backend calculated pending payment',
        handled_by,
        customCreatedAt,
        customUpdatedAt
      ];

      const pendingResult = await client.query(pendingPaymentQuery, pendingPaymentParams);
      console.log('Created correct pending payment with ID:', pendingResult.rows[0].id, {
        methodId: PENDING_PAYMENT_METHOD_ID,
        amount: outstandingAmount,
        note: 'Backend calculated - ignores frontend pending'
      });
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
      total_paid_amount: totalPaidAmount, // Actual + GST (excludes pending)
      outstanding_total_payment_amount: outstandingAmount, // Transaction - actual (excludes GST)
      transaction_status: transactionStatus,
      remarks: remarks || '',
      created_by,
      handled_by,
      voucher_id: mvId,
      voucher_name: mvRecord.member_voucher_name,
      items_count: 1,
      payments_count: payments.filter((p: PaymentMethodRequest) => p.amount > 0).length,
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

  let transferDetails;

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
      payments,
      created_at,
      updated_at,
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

    let customCreatedAt = null;
    let customUpdatedAt = null;

    if (created_at) {
      try {
        customCreatedAt = new Date(created_at);
        if (isNaN(customCreatedAt.getTime())) {
          console.warn('Invalid created_at format, using current time:', created_at);
          customCreatedAt = new Date();
        }
      } catch (error) {
        console.warn('Error parsing created_at, using current time:', error);
        customCreatedAt = new Date();
      }
    } else {
      customCreatedAt = new Date();
    }

    if (updated_at) {
      try {
        customUpdatedAt = new Date(updated_at);
        if (isNaN(customUpdatedAt.getTime())) {
          console.warn('Invalid updated_at format, using created_at time:', updated_at);
          customUpdatedAt = customCreatedAt;
        }
      } catch (error) {
        console.warn('Error parsing updated_at, using created_at time:', error);
        customUpdatedAt = customCreatedAt;
      }
    } else {
      customUpdatedAt = customCreatedAt;
    }

    console.log('✅ MCP Transfer Using custom date/time:', {
      created_at: customCreatedAt.toISOString(),
      updated_at: customUpdatedAt.toISOString(),
    });

    // Calculate totals from single transfer item
    const totalTransactionAmount: number = item.pricing?.totalLinePrice || 0;

    const GST_PAYMENT_METHOD_ID = 10;

    // Separate payments by type (transfers typically don't have pending payments)
    const gstPayments = payments.filter((payment: PaymentMethodRequest) =>
      payment.methodId === GST_PAYMENT_METHOD_ID
    );

    const actualPayments = payments.filter((payment: PaymentMethodRequest) =>
      payment.methodId !== GST_PAYMENT_METHOD_ID
    );

    // Calculate amounts
    const totalActualPaymentAmount: number = actualPayments.reduce((total: number, payment: PaymentMethodRequest) => {
      return total + (payment.amount || 0);
    }, 0);

    const totalGSTAmount: number = gstPayments.reduce((total: number, payment: PaymentMethodRequest) => {
      return total + (payment.amount || 0);
    }, 0);

    // For transfers, we expect full payment with no outstanding (transfers are typically fully processed)
    const totalPaidAmount: number = totalActualPaymentAmount + totalGSTAmount;
    const outstandingAmount: number = 0; // Transfers don't have outstanding amounts
    const transactionStatus: 'TRANSFER' | 'FULL' = 'TRANSFER';
    const processPayment: boolean = false;

    // Verification: actual payment should match transaction amount (excluding GST)
    if (Math.abs(totalActualPaymentAmount - totalTransactionAmount) > 0.01) {
      console.warn('MCP Transfer payment total mismatch (excluding GST):', {
        totalTransactionAmount,
        totalActualPaymentAmount,
        totalGSTAmount,
        expected: 'Actual payment should equal transaction amount (GST is additional)',
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const transactionParams: (string | number | boolean | null | Date)[] = [
      customer_type?.toUpperCase() || 'MEMBER',
      member_id || null,
      totalPaidAmount, // Includes GST for transaction record
      outstandingAmount, // 0 for transfers
      transactionStatus,
      finalReceiptNo,
      remarks || '',
      processPayment,
      handled_by,
      created_by,
      customCreatedAt,
      customUpdatedAt,
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
        remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    transferDetails = item.data || {};
    const sourceMcpId = transferDetails.mcp_id1 || null;
    const destinationMcpId = transferDetails.mcp_id2 || null;
    const transferAmount = transferDetails.amount || item.pricing?.totalLinePrice || 0;

    // Enhanced remarks with transfer metadata
    const transferRemarks = `MCP Transfer: ${transferAmount} from MCP ${sourceMcpId} to MCP ${destinationMcpId}${transferDetails.isNew ? ' (New Package)' : ''
      }${item.remarks ? ` - ${item.remarks}` : ''}`;

    const itemParams: (string | number | null)[] = [
      saleTransactionId,
      null,
      null,
      destinationMcpId,
      null,
      item.pricing?.originalPrice || 0,
      item.pricing?.customPrice || 0,
      item.pricing?.discount || 0,
      item.pricing?.quantity || 1,
      item.pricing?.totalLinePrice || 0,
      'member care package',
      transferRemarks,
    ];

    console.log('MCP Transfer Item Query:', itemQuery);
    console.log('MCP Transfer Item Params:', itemParams);

    const itemResult = await client.query(itemQuery, itemParams);
    const saleTransactionItemId: number = itemResult.rows[0].id;

    console.log('Created MCP Transfer sale transaction item with ID:', saleTransactionItemId);

    // Insert all payments (including GST) into payment_to_sale_transactions
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
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `;

        // Handle special "transfer" payment method
        let paymentMethodId: number;
        if (payment.methodId === 'transfer') {
          paymentMethodId = 9;
        } else {
          paymentMethodId = typeof payment.methodId === 'string' ? parseInt(payment.methodId) : payment.methodId;
        }

        const paymentParams: (number | string | Date)[] = [
          saleTransactionId,
          paymentMethodId,
          payment.amount,
          payment.remark || '',
          created_by,
          customCreatedAt,
          customUpdatedAt,
        ];

        console.log('MCP Transfer Payment Query:', paymentQuery);
        console.log('MCP Transfer Payment Params:', paymentParams);

        const paymentResult = await client.query(paymentQuery, paymentParams);
        console.log('Created MCP Transfer payment with ID:', paymentResult.rows[0].id, {
          methodId: paymentMethodId,
          amount: payment.amount,
          isGST: paymentMethodId === GST_PAYMENT_METHOD_ID
        });
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
      total_paid_amount: totalPaidAmount, // Includes GST for response
      outstanding_total_payment_amount: outstandingAmount, // 0 for transfers
      transaction_status: transactionStatus,
      remarks: remarks || '',
      created_by,
      handled_by,
      mcp_id1: transferDetails.mcp_id1 || null,
      mcp_id2: transferDetails.mcp_id2 || null,
      transfer_amount: transferAmount,
      transfer_description: transferDetails.description || transferRemarks,
      items_count: 1,
      payments_count: payments.filter((p: PaymentMethodRequest) => p.amount > 0).length,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating MCP Transfer sale transaction:', error);

    if (transferDetails) {
      try {
        await mcpModel.revertMemberCarePackageTransfer(
          transferDetails.mcp_id1,
          transferDetails.mcp_id2,
          transferDetails.isNew,
          transferDetails.amount!
        );
        console.log(`Successfully reverted MCP transfer`);
      } catch (transferErr) {
        console.error(`Failed to reverted MCP transfer after transaction failure:`, transferErr);
      }
    }

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
      payments,
      created_at,
      updated_at,
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

    let customCreatedAt = null;
    let customUpdatedAt = null;

    if (created_at) {
      try {
        customCreatedAt = new Date(created_at);
        if (isNaN(customCreatedAt.getTime())) {
          console.warn('Invalid created_at format, using current time:', created_at);
          customCreatedAt = new Date();
        }
      } catch (error) {
        console.warn('Error parsing created_at, using current time:', error);
        customCreatedAt = new Date();
      }
    } else {
      customCreatedAt = new Date();
    }

    if (updated_at) {
      try {
        customUpdatedAt = new Date(updated_at);
        if (isNaN(customUpdatedAt.getTime())) {
          console.warn('Invalid updated_at format, using created_at time:', updated_at);
          customUpdatedAt = customCreatedAt;
        }
      } catch (error) {
        console.warn('Error parsing updated_at, using created_at time:', error);
        customUpdatedAt = customCreatedAt;
      }
    } else {
      customUpdatedAt = customCreatedAt;
    }

    console.log('✅ MV Transfer Using custom date/time:', {
      created_at: customCreatedAt.toISOString(),
      updated_at: customUpdatedAt.toISOString(),
    });

    // Calculate totals from single transfer item
    const totalTransactionAmount: number = item.pricing?.totalLinePrice || 0;

    const GST_PAYMENT_METHOD_ID = 10;

    // Separate payments by type
    const gstPayments = payments.filter((payment: PaymentMethodRequest) =>
      payment.methodId === GST_PAYMENT_METHOD_ID
    );

    const actualPayments = payments.filter((payment: PaymentMethodRequest) =>
      payment.methodId !== GST_PAYMENT_METHOD_ID
    );

    // Calculate amounts
    const totalActualPaymentAmount: number = actualPayments.reduce((total: number, payment: PaymentMethodRequest) => {
      return total + (payment.amount || 0);
    }, 0);

    const totalGSTAmount: number = gstPayments.reduce((total: number, payment: PaymentMethodRequest) => {
      return total + (payment.amount || 0);
    }, 0);

    // For MV transfers, calculate based on partial payments
    const totalPaidAmount: number = totalActualPaymentAmount + totalGSTAmount;
    const outstandingAmount: number = Math.max(0, totalTransactionAmount - totalActualPaymentAmount); // Exclude GST from outstanding
    const transactionStatus: 'FULL' | 'PARTIAL' = outstandingAmount <= 0.01 ? 'FULL' : 'PARTIAL';
    const processPayment: boolean = outstandingAmount > 0.01;

    // Verification: check if payments make sense (excluding GST from main calculation)
    if (Math.abs((totalActualPaymentAmount + outstandingAmount) - totalTransactionAmount) > 0.01) {
      console.warn('MV Transfer payment total mismatch (excluding GST):', {
        totalTransactionAmount,
        totalActualPaymentAmount,
        totalGSTAmount,
        outstandingAmount,
        expected: 'Actual payment + outstanding should equal transaction amount (GST is additional)',
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const transactionParams: (string | number | boolean | null | Date)[] = [
      customer_type?.toUpperCase() || 'MEMBER',
      member_id || null,
      totalPaidAmount, // Includes GST for transaction record
      outstandingAmount, // Excludes GST - only unpaid transaction amount
      transactionStatus,
      finalReceiptNo,
      remarks || '',
      processPayment,
      handled_by,
      created_by,
      customCreatedAt,
      customUpdatedAt,
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
        remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const itemParams: (string | number | null)[] = [
      saleTransactionId,
      null,
      null,
      null,
      transactionData.newVoucherId || null,
      item.pricing?.originalPrice || 0,
      item.pricing?.customPrice || 0,
      item.pricing?.discount || 0,
      item.pricing?.quantity || 1,
      item.pricing?.totalLinePrice || 0,
      'member voucher',
      item.remarks || item.data?.description || '',
    ];

    console.log('MV Transfer Item Query:', itemQuery);
    console.log('MV Transfer Item Params:', itemParams);

    const itemResult = await client.query(itemQuery, itemParams);
    const saleTransactionItemId: number = itemResult.rows[0].id;

    console.log('Created MV Transfer sale transaction item with ID:', saleTransactionItemId);

    // Insert all payments (including GST) into payment_to_sale_transactions
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
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `;

        // Handle special "transfer" payment method
        let paymentMethodId: number;
        if (payment.methodId === 'transfer') {
          paymentMethodId = 9;
        } else {
          paymentMethodId = typeof payment.methodId === 'string' ? parseInt(payment.methodId) : payment.methodId;
        }

        const paymentParams: (number | string | Date)[] = [
          saleTransactionId,
          paymentMethodId,
          payment.amount,
          payment.remark || '',
          created_by,
          customCreatedAt,
          customUpdatedAt,
        ];

        console.log('MV Transfer Payment Query:', paymentQuery);
        console.log('MV Transfer Payment Params:', paymentParams);

        const paymentResult = await client.query(paymentQuery, paymentParams);
        console.log('Created MV Transfer payment with ID:', paymentResult.rows[0].id, {
          methodId: paymentMethodId,
          amount: payment.amount,
          isGST: paymentMethodId === GST_PAYMENT_METHOD_ID
        });
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
      total_paid_amount: totalPaidAmount, // Includes GST for response
      outstanding_total_payment_amount: outstandingAmount, // Excludes GST
      transaction_status: transactionStatus,
      remarks: remarks || '',
      created_by,
      handled_by,
      transfer_amount: item.data?.amount || totalTransactionAmount,
      transfer_description: item.data?.description || '',
      items_count: 1,
      payments_count: payments.filter((p: PaymentMethodRequest) => p.amount > 0).length,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating MV Transfer sale transaction:', error);
    throw error;
  } finally {
    client.release();
  }
};

const processPartialPayment = async (
  transactionId: string | number,
  paymentData: ProcessPartialPaymentDataWithHandler
): Promise<PartialPaymentResult> => {
  const client = await pool().connect();

  try {
    await client.query('BEGIN');

    const {
      payments,
      general_remarks,
      transaction_handler_id,
      payment_handler_id,
      receipt_number,
      created_at
    } = paymentData;

    if (!payments || payments.length === 0) {
      throw new Error('At least one payment method is required');
    }

    if (!transaction_handler_id) {
      throw new Error('Transaction handler ID is required');
    }

    if (!payment_handler_id) {
      throw new Error('Payment handler ID is required');
    }

    let customCreatedAt = null;
    if (created_at) {
      try {
        customCreatedAt = new Date(created_at);
        if (isNaN(customCreatedAt.getTime())) {
          throw new Error('Invalid creation date format');
        }
      } catch (error) {
        throw new Error('Invalid creation date format');
      }
    }

    const originalTransactionQuery = `
      SELECT 
        st.id,
        st.customer_type,
        st.member_id,
        st.total_paid_amount,
        st.outstanding_total_payment_amount,
        st.sale_transaction_status,
        st.remarks,
        st.receipt_no,
        st.handled_by,
        st.created_by,
        st.process_payment
      FROM sale_transactions st
      WHERE st.id = $1 AND st.process_payment = true
    `;

    const originalResult = await client.query(originalTransactionQuery, [transactionId]);

    if (originalResult.rows.length === 0) {
      throw new Error('Transaction not found or not available for payment processing');
    }

    const originalTransaction = originalResult.rows[0];

    const PENDING_PAYMENT_METHOD_ID = 7;
    const GST_PAYMENT_METHOD_ID = 10;

    const pendingPayments = payments.filter(payment => payment.payment_method_id === PENDING_PAYMENT_METHOD_ID);
    const gstPayments = payments.filter(payment => payment.payment_method_id === GST_PAYMENT_METHOD_ID);
    const actualPayments = payments.filter(payment =>
      payment.payment_method_id !== PENDING_PAYMENT_METHOD_ID &&
      payment.payment_method_id !== GST_PAYMENT_METHOD_ID
    );

    const totalActualPaymentAmount = actualPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalGSTAmount = gstPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const frontendPendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const outstandingReduction = totalActualPaymentAmount;
    const totalNewPaidAmount = totalActualPaymentAmount + totalGSTAmount;

    if (outstandingReduction > originalTransaction.outstanding_total_payment_amount) {
      throw new Error(
        `Payment amount (${outstandingReduction}) exceeds outstanding amount (${originalTransaction.outstanding_total_payment_amount})`
      );
    }

    const originalItemsQuery = `
      SELECT 
        service_name, product_name, member_care_package_id, member_voucher_id,
        original_unit_price, custom_unit_price, discount_percentage, quantity,
        remarks, amount, item_type
      FROM sale_transaction_items 
      WHERE sale_transaction_id = $1
    `;

    const originalItemsResult = await client.query(originalItemsQuery, [transactionId]);
    const originalItems = originalItemsResult.rows;

    const newTotalPaidAmount = totalNewPaidAmount;
    const newOutstandingAmount = originalTransaction.outstanding_total_payment_amount - outstandingReduction;
    const newTransactionStatus = newOutstandingAmount > 0.01 ? 'PARTIAL' : 'FULL';
    const newProcessPayment = newOutstandingAmount > 0.01;

    const finalReceiptNumber = receipt_number || originalTransaction.receipt_no;

    const newTransactionQuery = `
      INSERT INTO sale_transactions (
        customer_type, member_id, total_paid_amount, outstanding_total_payment_amount,
        sale_transaction_status, remarks, receipt_no, reference_sales_transaction_id,
        handled_by, created_by, created_at, updated_at, process_payment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `;

    const currentTime = customCreatedAt || new Date();

    const newTransactionParams = [
      originalTransaction.customer_type,
      originalTransaction.member_id,
      newTotalPaidAmount,
      newOutstandingAmount,
      newTransactionStatus,
      general_remarks || `Additional payment for receipt ${originalTransaction.receipt_no}`,
      finalReceiptNumber,
      originalTransaction.id,
      transaction_handler_id,
      payment_handler_id,
      currentTime,
      currentTime,
      newProcessPayment
    ];

    const newTransactionResult = await client.query(newTransactionQuery, newTransactionParams);
    const newTransactionId = newTransactionResult.rows[0].id;

    const packageItems = originalItems.filter((item: any) => item.member_care_package_id);
    const voucherItems = originalItems.filter((item: any) => item.member_voucher_id);

    for (const item of originalItems) {
      const insertItemQuery = `
        INSERT INTO sale_transaction_items (
          sale_transaction_id, service_name, product_name, member_care_package_id, member_voucher_id,
          original_unit_price, custom_unit_price, discount_percentage, quantity,
          remarks, amount, item_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;

      if (packageItems.length > 0) {
        item.item_type = 'member care package';
      } else if (voucherItems.length > 0) {
        item.item_type = 'member voucher';
      }

      const itemParams = [
        newTransactionId, item.service_name, item.product_name,
        item.member_care_package_id, item.member_voucher_id,
        item.original_unit_price, item.custom_unit_price, item.discount_percentage,
        item.quantity, item.remarks, item.amount, item.item_type
      ];

      await client.query(insertItemQuery, itemParams);
    }

    for (const payment of payments) {
      if (payment.payment_method_id === PENDING_PAYMENT_METHOD_ID) {
        continue;
      }

      const insertPaymentQuery = `
        INSERT INTO payment_to_sale_transactions (
          sale_transaction_id, payment_method_id, amount, remarks, 
          created_by, updated_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      const paymentParams = [
        newTransactionId,
        payment.payment_method_id,
        payment.amount,
        payment.remarks || '',
        payment.payment_handler_id,
        payment.payment_handler_id,
        currentTime,
        currentTime,
      ];

      await client.query(insertPaymentQuery, paymentParams);
    }

    if (newOutstandingAmount > 0) {
      const pendingPaymentQuery = `
        INSERT INTO payment_to_sale_transactions (
          sale_transaction_id, payment_method_id, amount, remarks, 
          created_by, updated_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      const pendingPaymentParams = [
        newTransactionId,
        PENDING_PAYMENT_METHOD_ID,
        newOutstandingAmount,
        'Backend calculated pending payment',
        payment_handler_id,
        payment_handler_id,
        currentTime,
        currentTime,
      ];

      await client.query(pendingPaymentQuery, pendingPaymentParams);
    }

    await client.query('UPDATE sale_transactions SET process_payment = false WHERE id = $1', [originalTransaction.id]);

    if (packageItems.length > 0) {
      for (const packageItem of packageItems) {
        await client.query('UPDATE member_care_packages SET balance = COALESCE(balance, 0) + $1 WHERE id = $2', [
          totalActualPaymentAmount,
          packageItem.member_care_package_id,
        ]);
      }
    }

    if (voucherItems.length > 0) {
      for (const voucherItem of voucherItems) {
        await client.query(
          'UPDATE member_vouchers SET current_balance = COALESCE(current_balance, 0) + $1 WHERE id = $2',
          [totalActualPaymentAmount, voucherItem.member_voucher_id]
        );

        const voucherResult = await client.query(
          'SELECT current_balance FROM member_vouchers WHERE id = $1',
          [voucherItem.member_voucher_id]
        );

        const updatedBalance = parseFloat(voucherResult.rows[0]?.current_balance || 0);

        const insertVoucherLogQuery = `
          INSERT INTO member_voucher_transaction_logs (
            member_voucher_id,
            service_description,
            service_date,
            current_balance,
            amount_change,
            serviced_by,
            type,
            created_by,
            last_updated_by,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;

        const voucherLogParams = [
          voucherItem.member_voucher_id,
          `Partial payment of $${totalActualPaymentAmount} for receipt ${finalReceiptNumber}`,
          currentTime,
          updatedBalance,
          totalActualPaymentAmount,
          transaction_handler_id,
          'PURCHASE',
          payment_handler_id,
          payment_handler_id,
          currentTime,
          currentTime
        ];

        await client.query(insertVoucherLogQuery, voucherLogParams);
      }
    }

    if (voucherItems.length > 0 && newTransactionStatus === 'FULL') {
      for (const voucherItem of voucherItems) {
        const voucherResult = await client.query(
          'SELECT free_of_charge, current_balance FROM member_vouchers WHERE id = $1',
          [voucherItem.member_voucher_id]
        );

        if (voucherResult.rows.length > 0) {
          const voucher = voucherResult.rows[0];
          const freeOfCharge = parseFloat(voucher.free_of_charge) || 0;
          const currentBalance = parseFloat(voucher.current_balance) || 0;

          if (freeOfCharge > 0) {
            await client.query(
              'UPDATE member_vouchers SET current_balance = COALESCE(current_balance, 0) + $1 WHERE id = $2',
              [freeOfCharge, voucherItem.member_voucher_id]
            );

            const insertVoucherLogQuery = `
              INSERT INTO member_voucher_transaction_logs (
                member_voucher_id,
                service_description,
                service_date,
                current_balance,
                amount_change,
                serviced_by,
                type,
                created_by,
                last_updated_by,
                created_at,
                updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `;

            const newBalance = currentBalance + freeOfCharge;
            const voucherLogParams = [
              voucherItem.member_voucher_id,
              `Payment completed for receipt ${finalReceiptNumber} - FOC addition`,
              currentTime,
              newBalance,
              freeOfCharge,
              transaction_handler_id,
              'ADD FOC',
              payment_handler_id,
              payment_handler_id,
              currentTime,
              currentTime
            ];

            await client.query(insertVoucherLogQuery, voucherLogParams);
          }
        }
      }
    }

    await client.query('COMMIT');

    return {
      new_transaction: {
        id: newTransactionId,
        receipt_no: finalReceiptNumber,
        total_paid_amount: newTotalPaidAmount,
        outstanding_amount: newOutstandingAmount,
        transaction_status: newTransactionStatus,
        process_payment: newProcessPayment,
      },
      original_transaction: {
        id: originalTransaction.id,
        receipt_no: originalTransaction.receipt_no,
        process_payment: false,
      },
      payments_processed: payments.filter(p => p.payment_method_id !== PENDING_PAYMENT_METHOD_ID).length,
      total_payment_amount: totalNewPaidAmount,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing partial payment:', error);
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
  createMvTransferTransaction,
  processPartialPayment,
};