import { pool } from '../config/database.js';
import { PaginatedOptions, PaginatedReturn } from '../types/common.types.js';
import { MemberVouchers, MemberVoucherServices, MemberVoucherTransactionLogs, MemberVoucherTransactionLogCreateData, MemberName, MemberVoucherTransactionLogUpdateData, Employees } from '../types/model.types.js';
import { encodeCursor } from '../utils/cursorUtils.js';


const getPaginatedVouchers = async (
  limit: number,
  options: PaginatedOptions = {},
  start_date_utc: string | undefined | null,
  end_date_utc: string
): Promise<{ success: boolean, data: PaginatedReturn<MemberVouchers> | [], message: string }> => {
  const { after, before, page, searchTerm } = options;

  const params = [
    limit,
    searchTerm || null,
    start_date_utc ? start_date_utc : null,
    end_date_utc ? end_date_utc : null,
    after ? after.createdAt : null,
    after ? after.id : null,
    before ? before.createdAt : null,
    before ? before.id : null,
    page && page > 0 ? page : null,
  ];

  const sqlFunctionQuery = `
    SELECT get_voucher_paginated_json(
      p_limit := $1,
      p_search_term := $2,
      p_start_date_utc := $3,
      p_end_date_utc := $4,
      p_after_created_at := $5,
      p_after_id := $6,
      p_before_created_at := $7,
      p_before_id := $8,
      p_page := $9
    ) AS result;
  `;

  try {
    const { rows: resultRows } = await pool().query(sqlFunctionQuery, params);

    if (!resultRows[0] || !resultRows[0].result) {
      const errorMessage = 'Error 400: Invalid response from SQL function get_voucher_paginated_json';
      return { success: false, data: [], message: errorMessage };
    }

    const result = resultRows[0].result;

    if (result.error) {
      const errorMessage = 'Error 400: Error reported by SQL function get_voucher_paginated_json: ' + result.error;
      return { success: false, data: [], message: errorMessage };
    }

    const vouchers = result.data || []; // Ensure data is an array
    const totalCount = result.totalCount || 0;
    // actual_fetched_count is how many records the SQL function's data query fetched (typically limit + 1 for cursors)
    const actualFetchedCount = result.actual_fetched_count || 0;

    let hasNextPage = false;
    let hasPreviousPage = false;
    let startCursor = null;
    let endCursor = null;

    if (page && page > 0) {
      // Offset-based pagination
      // totalCount is the count of all items matching filters
      // limit is items per page
      // page is current page number (1-indexed)
      hasNextPage = page * limit < totalCount;
      hasPreviousPage = page > 1;
    } else {
      // Cursor-based pagination
      if (before) {
        // `actualFetchedCount` included one extra item if more existed "before" the current set.
        // The `vouchers` (data) returned by SQL function is already sliced to `limit` and in correct display order.
        hasPreviousPage = actualFetchedCount > limit;
        // If 'before' was used and we got results, there's a "next" page (towards more recent items).
        hasNextPage = vouchers.length > 0;
      } else {
        // 'after' or initial load (no cursor)
        // `actualFetchedCount` included one extra item if more existed "after" the current set.
        hasNextPage = actualFetchedCount > limit;
        // If 'after' was used and we received data, a "previous" page exists.
        hasPreviousPage = !!after && vouchers.length > 0;
        if (!after && !before) {
          // Initial load (no cursor)
          hasPreviousPage = false; // No previous page on the very first fetch.
        }
      }
    }

    if (vouchers.length > 0) {
      // Ensure created_at is a Date object if needed by encodeCursor, SQL returns ISO strings
      startCursor = encodeCursor(new Date(vouchers[0].created_at), vouchers[0].id);
      endCursor = encodeCursor(
        new Date(vouchers[vouchers.length - 1].created_at),
        vouchers[vouchers.length - 1].id
      );
    }

    const data = {
      data: vouchers,
      pageInfo: {
        startCursor,
        endCursor,
        hasNextPage,
        hasPreviousPage,
        totalCount,
      },
    };

    return { success: true, data: data, message: "Successfully retrieved paginated vouchers." };
  } catch (error) {
    console.error('Error retrieving paginated vouchers:', error);

    console.error('Full error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return user-friendly message but also throw for critical errors
    if (error instanceof Error && error.message.includes('connection')) {
      // Critical database errors should bubble up
      throw new Error('Database connection failed. Please try again later.');
    }

    return { success: false, data: [], message: "Failed to retrieve paginated vouchers due to database error." };
  }
};

const getServicesOfMemberVoucherById = async (id: number): Promise<{ success: boolean, data: MemberVoucherServices[] | [], message: string }> => {
  if (!Number(id)) {
    return { success: false, data: [], message: "id must be an integer" };
  }

  const client = await pool().connect();
  try {
    const query = `
    SELECT id, service_name, original_price, custom_price, discount, duration, final_price
    FROM member_voucher_details
    WHERE member_voucher_id = $1
    ORDER BY id ASC;
    `;

    const results = await client.query(query, [id]);

    if (results.rows.length > 0) {
      return { success: true, data: results.rows, message: "Get Services of Member Voucher By Id was successful" };
    } else {
      return { success: false, data: [], message: "Error 400: The input Id of Member Voucher does not exist" };
    }
  } catch (error) {
    console.error('Error retrieving paginated services of member voucher:', error);

    console.error('Full error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return user-friendly message but also throw for critical errors
    if (error instanceof Error && error.message.includes('connection')) {
      // Critical database errors should bubble up
      throw new Error('Database connection failed. Please try again later.');
    }

    return { success: false, data: [], message: "Failed to retrieve paginated services of member voucher due to database error." };
  }
};

const getPaginatedMemberVoucherTransactionLogs = async (
  id: number,
  limit: number,
  options: PaginatedOptions = {},
  start_date_utc: string | undefined | null,
  end_date_utc: string
): Promise<{ success: boolean, data: PaginatedReturn<MemberVoucherTransactionLogs> | [], message: string }> => {
  const { after, before, page } = options;

  const params = [
    limit,
    start_date_utc ? start_date_utc : null,
    end_date_utc ? end_date_utc : null,
    after ? after.createdAt : null,
    after ? after.id : null,
    before ? before.createdAt : null,
    before ? before.id : null,
    page && page > 0 ? page : null,
    id
  ];

  const sqlFunctionQuery = `
    SELECT get_member_voucher_transaction_logs_paginated_json(
      p_limit := $1,
      p_start_date_utc := $2,
      p_end_date_utc := $3,
      p_after_created_at := $4,
      p_after_id := $5,
      p_before_created_at := $6,
      p_before_id := $7,
      p_page := $8,
      p_member_voucher_id := $9
    ) AS result;
  `;

  try {
    const { rows: resultRows } = await pool().query(sqlFunctionQuery, params);

    if (!resultRows[0] || !resultRows[0].result) {
      const errorMessage = 'Error 400: Invalid response from SQL function get_member_voucher_transaction_logs_paginated_json';
      return { success: false, data: [], message: errorMessage };
    }

    const result = resultRows[0].result;

    if (result.error) {
      const errorMessage = 'Error 400: Error reported by SQL function get_member_voucher_transaction_logs_paginated_json:' + result.error;
      return { success: false, data: [], message: errorMessage };
    }

    const transactionLogs = result.data || []; // Ensure data is an array
    const totalCount = result.totalCount || 0;
    // actual_fetched_count is how many records the SQL function's data query fetched (typically limit + 1 for cursors)
    const actualFetchedCount = result.actual_fetched_count || 0;

    let hasNextPage = false;
    let hasPreviousPage = false;
    let startCursor = null;
    let endCursor = null;

    if (page && page > 0) {
      // Offset-based pagination
      // totalCount is the count of all items matching filters
      // limit is items per page
      // page is current page number (1-indexed)
      hasNextPage = page * limit < totalCount;
      hasPreviousPage = page > 1;
    } else {
      // Cursor-based pagination
      if (before) {
        // `actualFetchedCount` included one extra item if more existed "before" the current set.
        // The `transactionLogs` (data) returned by SQL function is already sliced to `limit` and in correct display order.
        hasPreviousPage = actualFetchedCount > limit;
        // If 'before' was used and we got results, there's a "next" page (towards more recent items).
        hasNextPage = transactionLogs.length > 0;
      } else {
        // 'after' or initial load (no cursor)
        // `actualFetchedCount` included one extra item if more existed "after" the current set.
        hasNextPage = actualFetchedCount > limit;
        // If 'after' was used and we received data, a "previous" page exists.
        hasPreviousPage = !!after && transactionLogs.length > 0;
        if (!after && !before) {
          // Initial load (no cursor)
          hasPreviousPage = false; // No previous page on the very first fetch.
        }
      }
    }

    if (transactionLogs.length > 0) {
      // Ensure created_at is a Date object if needed by encodeCursor, SQL returns ISO strings
      startCursor = encodeCursor(new Date(transactionLogs[0].created_at), transactionLogs[0].id);
      endCursor = encodeCursor(
        new Date(transactionLogs[transactionLogs.length - 1].created_at),
        transactionLogs[transactionLogs.length - 1].id
      );
    }

    const data = {
      data: transactionLogs,
      pageInfo: {
        startCursor,
        endCursor,
        hasNextPage,
        hasPreviousPage,
        totalCount,
      },
    };

    return { success: true, data: data, message: "Successfully retrieved paginated transaction logs." }
  } catch (error) {
    console.error('Error retrieving paginated transaction logs:', error);

    console.error('Full error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return user-friendly message but also throw for critical errors
    if (error instanceof Error && error.message.includes('connection')) {
      // Critical database errors should bubble up
      throw new Error('Database connection failed. Please try again later.');
    }

    return { success: false, data: [], message: "Failed to retrieve paginated transaction logs due to database error." };
  }
};

const addTransactionLogsByMemberVoucherId = async (data: MemberVoucherTransactionLogCreateData): Promise<{ success: boolean, message: string }> => {
  const {
    id,
    consumptionValue,
    remarks,
    date,
    time,
    type,
    createdBy,
    handledBy,
    current_balance
  } = data;

  console.log(current_balance);

  const currentBalanceAfterDeduction = current_balance + consumptionValue;

  const service_date = new Date(`${date}T${time}`);

  const last_updated_by = createdBy;

  const created_at = new Date();

  const updated_at = created_at;

  const client = await pool().connect();

  try {

    const insertQuery = `
        INSERT INTO member_voucher_transaction_logs (
          member_voucher_id, service_description, service_date, current_balance, amount_change, serviced_by, type, created_by, last_updated_by, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
        `;

    const insertValues = [
      id,
      remarks,
      service_date,
      currentBalanceAfterDeduction,
      consumptionValue,
      handledBy,
      type,
      createdBy,
      last_updated_by,
      created_at,
      updated_at
    ];
    await client.query('BEGIN');

    const insertResult = await client.query(insertQuery, insertValues);

    const updateQuery = `
    UPDATE member_vouchers 
    SET current_balance = $1 
    WHERE id = $2
  `;

    const updateValues = [
      currentBalanceAfterDeduction,
      id
    ];

    const updateResult = await client.query(updateQuery, updateValues);

    if ((insertResult.rowCount ?? 0) > 0 && (updateResult.rowCount ?? 0) > 0) {
      await client.query('COMMIT');

      return {
        success: true,
        message: "Member Voucher transaction log created and balance updated successfully.",
      };
    } else {
      // Rollback if any operation failed
      await client.query('ROLLBACK');

      return {
        success: false,
        message: "Transaction failed - no rows affected in one or more operations."
      };
    }

  } catch (error) {
    // Rollback on any error
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }

    console.error('Error creating Transaction Log by Member Voucher Id:', error);

    console.error('Full error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return user-friendly message but also throw for critical errors
    if (error instanceof Error && error.message.includes('connection')) {
      throw new Error('Database connection failed. Please try again later.');
    };

    return { success: false, message: "Failed to create Transaction Log by Member Voucher Id due to database error." };

  } finally {
    client.release();
  }
};

const getMemberVoucherCurrentBalance = async (id: number, consumptionValue: number): Promise<{ success: boolean, message?: string }> => {
  if (!Number(id)) {
    return { success: false, message: "Error 400: id must be an integer" };
  };

  if (isNaN(Number(consumptionValue))) {
    return { success: false, message: "Error 400: consumption value must be an integer" };
  };

  const client = await pool().connect();
  try {
    const query = `
    SELECT current_balance
    FROM member_vouchers
    WHERE id = $1;
    `;

    const results = await client.query(query, [id]);

    if (Number.isNaN(Number(results.rows[0].current_balance))) {
      return { success: false, message: "Error 400: This Member Voucher does not exist" };
    }

    const balanceAfterDeduction = parseFloat(results.rows[0].current_balance) + consumptionValue;

    if (balanceAfterDeduction < 0) {
      return { success: false, message: "Error 400: The Consumption Value is greater than the Current balance." };
    } else {
      return { success: true };
    }
  } catch (error) {
    console.error('Error retrieving current balance by Member Voucher Id:', error);

    console.error('Full error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return user-friendly message but also throw for critical errors
    if (error instanceof Error && error.message.includes('connection')) {
      // Critical database errors should bubble up
      throw new Error('Database connection failed. Please try again later.');
    }

    return { success: false, message: "Failed to current balance by Member Voucher Id due to database error." };
  }
};

const getMemberVoucherPaidCurrentBalance = async (id: number, consumptionValue: number): Promise<{ success: boolean, data?: number, message?: string }> => {
  if (!Number(id)) {
    return { success: false, message: "Error 400: id must be an integer" };
  };

  if (isNaN(Number(consumptionValue))) {
    return { success: false, message: "Error 400: consumption value must be an integer" };
  };

  const client = await pool().connect();
  try {
    const query = `
    SELECT st.outstanding_total_payment_amount, mv.current_balance
    FROM sale_transactions st
    JOIN sale_transaction_items sti ON st.id = sti.sale_transaction_id
    JOIN member_vouchers mv ON sti.member_voucher_id = mv.id
    WHERE sti.member_voucher_id = $1
    ORDER BY sti.sale_transaction_id DESC
    LIMIT 1;
    `;

    const results = await client.query(query, [id]);
    console.log(results);

    if (results.rowCount === 0) {
      return { success: false, message: "Error 400: This Member Voucher does not exist" };
    }

    const current_balance = parseFloat(results.rows[0].current_balance);
    const outstanding_total_payment_amount = parseFloat(results.rows[0].outstanding_total_payment_amount);
    // const free_of_charge = parseFloat(results.rows[0].free_of_charge);

    if (outstanding_total_payment_amount === 0) {
      return { success: true, data: current_balance };
    }

    const paidBalance = current_balance - outstanding_total_payment_amount //- free_of_charge;

    const paidbalanceAfterDeduction = paidBalance + consumptionValue;

    if (paidbalanceAfterDeduction < 0) {
      return { success: false, message: "Error 400: The Consumption Value is greater than the Paid Current balance." };
    } else {
      return { success: true, data: current_balance };
    }
  } catch (error) {
    console.error('Error retrieving paid current balance by Member Voucher Id:', error);

    console.error('Full error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof Error && error.message.includes('connection')) {
      throw new Error('Database connection failed. Please try again later.');
    }

    return { success: false, message: "Failed to get paid current balance by Member Voucher Id due to database error." };
  }
};

const getMemberNameByMemberVoucherId = async (id: number): Promise<{ success: boolean, data: MemberName | null, message: string }> => {
  if (!Number(id)) {
    return { success: false, data: null, message: "Error 400: id must be an integer" };
  }

  const client = await pool().connect();
  try {
    const query = `
    SELECT m.id, m.name
    FROM members m
    JOIN member_vouchers mv
    ON m.id = mv.member_id
    WHERE mv.id = $1
    `;

    const results = await client.query(query, [id]);

    if (results.rows.length > 0) {
      return { success: true, data: results.rows[0], message: "Get Member Name By Member Voucher Id was successful" };
    } else {
      return { success: false, data: null, message: "Error 400: The input Id of Member Voucher does not exist" };
    }
  } catch (error) {
    console.error('Error retrieving Member Name By Member Voucher Id:', error);

    console.error('Full error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return user-friendly message but also throw for critical errors
    if (error instanceof Error && error.message.includes('connection')) {
      // Critical database errors should bubble up
      throw new Error('Database connection failed. Please try again later.');
    }

    return { success: false, data: null, message: "Failed to Member Name By Member Voucher Id due to database error." };
  }
};

const setTransactionLogsAndCurrentBalanceByLogId = async (data: MemberVoucherTransactionLogUpdateData): Promise<{ success: boolean, message: string }> => {
  const {
    member_voucher_id,
    transaction_log_id,
    consumptionValue,
    remarks,
    date,
    time,
    type,
    createdBy,
    handledBy,
    lastUpdatedBy
  } = data;

  const service_date = new Date(`${date}T${time}`);

  const updated_at = new Date();

  const client = await pool().connect();

  try {
    // To get the current amount_change value which will be used to find the current_balance value before the respective log deduction
    const getAmountChangeQuery = `
        SELECT amount_change
        FROM member_voucher_transaction_logs
        WHERE id = $1;
    `;

    const getAmountChangeValue = [
      transaction_log_id
    ];

    const updateMemberVoucherQuery = `
        UPDATE member_vouchers
        SET current_balance = current_balance - $1 + $2
        WHERE id = $3;
        `;

    const updateCurrentBalanceOfTransactionLogsQuery = `
        UPDATE member_voucher_transaction_logs
        SET current_balance = current_balance - $1 + $2
        WHERE id >= $3 AND member_voucher_id = $4;
        `;

    const updateTransactionLogQuery = `
        UPDATE member_voucher_transaction_logs
        SET service_description = $1,
            service_date = $2,
            amount_change = $3,
            serviced_by = $4,
            type = $5,
            created_by = $6,
            last_updated_by = $7,
            updated_at = $8
        WHERE id = $9;
        `;

    const updateTransactionLogValue = [
      remarks,
      service_date,
      consumptionValue,
      handledBy,
      type,
      createdBy,
      lastUpdatedBy,
      updated_at,
      transaction_log_id
    ];

    await client.query('BEGIN');

    const getAmountChangeResult = await client.query(getAmountChangeQuery, getAmountChangeValue);

    console.log("getAmountChangeResult.rows[0].amount_change: " + getAmountChangeResult.rows[0].amount_change);

    const updateMemberVoucherValues = [
      getAmountChangeResult.rows[0].amount_change,
      consumptionValue,
      member_voucher_id
    ];

    const updateCurrentBalanceOfTransactionLogsValue = [
      getAmountChangeResult.rows[0].amount_change,
      consumptionValue,
      transaction_log_id,
      member_voucher_id
    ];

    const updateMemberVoucherResults = await client.query(updateMemberVoucherQuery, updateMemberVoucherValues);

    const updateTransactionLogsResults = await client.query(updateCurrentBalanceOfTransactionLogsQuery, updateCurrentBalanceOfTransactionLogsValue);

    const updateTransactionLogByIdResults = await client.query(updateTransactionLogQuery, updateTransactionLogValue);

    if ((updateMemberVoucherResults.rowCount ?? 0) > 0 && (updateTransactionLogsResults.rowCount ?? 0) > 0 && (updateTransactionLogByIdResults.rowCount ?? 0) > 0) {
      await client.query('COMMIT');

      return {
        success: true,
        message: "Member Voucher transaction log and Member Voucher balance has been updated successfully.",
      };
    } else {
      // Rollback if any operation failed
      await client.query('ROLLBACK');

      return {
        success: false,
        message: "Transaction failed - no rows affected in one or more operations."
      };
    }

  } catch (error) {
    // Rollback on any error
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }

    console.error('Error updating Member Voucher transaction log and Member Voucher balance by Transation Log Id:', error);

    console.error('Full error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return user-friendly message but also throw for critical errors
    if (error instanceof Error && error.message.includes('connection')) {
      throw new Error('Database connection failed. Please try again later.');
    };

    return { success: false, message: "Failed to update Member Voucher transaction log and Member Voucher balance Transation Log Id due to database error." };

  } finally {
    client.release();
  }
};

const deleteTransactionLogsAndCurrentBalanceByLogId = async (transaction_log_id: number, member_voucher_id: number): Promise<{ success: boolean, message: string }> => {

  const client = await pool().connect();

  try {
    // To get the sum of the total amount change from all the to-be deleted transaction logs
    const getSumOfAmountChangeQuery = `
        SELECT SUM(amount_change)
        FROM member_voucher_transaction_logs
        WHERE id >= $1;
    `;

    const getSumOfAmountChangeValue = [
      transaction_log_id
    ];

    const updateMemberVoucherQuery = `
        UPDATE member_vouchers
        SET current_balance = current_balance - $1
        WHERE id = $2;
        `;

    const deleteTransactionLogAndSubsequentLogsByIdQuery = `
        DELETE FROM member_voucher_transaction_logs
        WHERE id >= $1
        `;

    await client.query('BEGIN');

    const getAmountChangeResult = await client.query(getSumOfAmountChangeQuery, getSumOfAmountChangeValue);

    console.log("getAmountChangeResult.rows[0].sum: " + getAmountChangeResult.rows[0].sum);

    const updateMemberVoucherValues = [
      getAmountChangeResult.rows[0].sum,
      member_voucher_id
    ];

    const deleteTransactionLogAndSubsequentLogsByIdValue = [
      transaction_log_id
    ];

    const updateMemberVoucherResults = await client.query(updateMemberVoucherQuery, updateMemberVoucherValues);

    const deleteTransactionLogsResults = await client.query(deleteTransactionLogAndSubsequentLogsByIdQuery, deleteTransactionLogAndSubsequentLogsByIdValue);

    if ((updateMemberVoucherResults.rowCount ?? 0) > 0 && (deleteTransactionLogsResults.rowCount ?? 0) > 0) {
      await client.query('COMMIT');

      return {
        success: true,
        message: "The Member Voucher transaction log and Member Voucher balance has been respectively deleted and updated successfully.",
      };
    } else {
      // Rollback if any operation failed
      await client.query('ROLLBACK');

      return {
        success: false,
        message: "Transaction failed - no rows affected in one or more operations."
      };
    }

  } catch (error) {
    // Rollback on any error
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }

    console.error('Error deleting Member Voucher transaction log by Transation Log Id:', error);

    console.error('Full error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return user-friendly message but also throw for critical errors
    if (error instanceof Error && error.message.includes('connection')) {
      throw new Error('Database connection failed. Please try again later.');
    };

    return { success: false, message: "Failed to deleting Member Voucher transaction log by Transation Log Id due to database error." };

  } finally {
    client.release();
  }
};



interface ServicePayload {
  id: string;
  name: string;
  original_price: number;
  custom_price: number;
  discount: number;
  final_price: number;
  duration: number;
}

interface PaymentPayload {
  id: string;
  amount: number;
}

const createMemberVoucher = async (
  member_voucher_name: string,
  voucher_template_id: string,
  member_id: string,
  employee_id: string,
  default_total_price: number,
  free_of_charge: number,
  remarks: string,
  services: ServicePayload[],
  payments: PaymentPayload[],
  created_at: string,
  updated_at: string,
  is_bypass: boolean = false,
) => {
  const client = await pool().connect();

  try {
    await client.query('BEGIN');

    // Validation queries
    const v_member_sql = 'SELECT id FROM members WHERE id = $1';
    const v_employee_sql = 'SELECT id FROM employees WHERE id = $1';
    const v_status_sql = 'SELECT get_or_create_status($1) as id';

    let validationPromises = [
      client.query(v_member_sql, [member_id]),
      client.query<Employees>(v_employee_sql, [employee_id]),
      client.query<{ id: string }>(v_status_sql, ['is_enabled']),
    ];

    // Only validate voucher_template_id if not bypass (voucher_template_id !== '0')
    let voucherTemplateResult;
    if (!is_bypass && voucher_template_id !== '0') {
      const v_voucher_template_sql = 'SELECT id FROM voucher_templates WHERE id = $1';
      voucherTemplateResult = client.query(v_voucher_template_sql, [voucher_template_id]);
      validationPromises.push(voucherTemplateResult);
    }

    const results = await Promise.all(validationPromises);
    const [memberResult, employeeResult, statusResult] = results;
    if (voucherTemplateResult) {
      voucherTemplateResult = results[3];
    }

    // Validation checks
    if (memberResult.rowCount === 0) {
      throw new Error(`Invalid member_id: ${member_id} does not exist.`);
    }
    if (employeeResult.rowCount === 0) {
      throw new Error(`Invalid employee_id: ${employee_id} does not exist.`);
    }
    if (voucherTemplateResult && voucherTemplateResult.rowCount === 0) {
      throw new Error(`Invalid voucher_template_id: ${voucher_template_id} does not exist.`);
    }
    if (!statusResult.rows || statusResult.rows.length === 0 || !statusResult.rows[0].id) {
      throw new Error('Failed to get or create status ID.');
    }

    // === UPDATED BALANCE CALCULATION LOGIC ===
    
    // Check if there's outstanding amount (pending payment)
    const pendingPayment = payments.find(p => String(p.id) === '7'); // Assuming '7' is the ID for pending payment
    const outstanding_amount = pendingPayment ? pendingPayment.amount : 0;
    const is_fully_paid = outstanding_amount === 0;
    
    // Calculate balances based on payment status
    // FOC is only included in balances when fully paid
    let starting_balance: number;
    let current_balance: number;
    
    if (is_fully_paid) {
      // Fully paid: include FOC in both balances
      starting_balance = default_total_price + free_of_charge;
      current_balance = starting_balance;
    } else {
      // Partial payment: exclude FOC from balances
      starting_balance = default_total_price + free_of_charge;
      current_balance = default_total_price;


    }

    console.log('Payment Status:', is_fully_paid ? 'FULL' : 'PARTIAL');
    console.log('Starting Balance:', starting_balance);
    console.log('Current Balance:', current_balance);
    console.log('Outstanding Amount:', outstanding_amount);

    // Insert member voucher
    const i_mv_sql = `
      INSERT INTO member_vouchers
      (member_voucher_name, voucher_template_id, member_id, current_balance, starting_balance, 
       free_of_charge, default_total_price, status, remarks, created_by, handled_by, 
       last_updated_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id
    `;

    const { rows: mvRows } = await client.query<{ id: string }>(i_mv_sql, [
      member_voucher_name,
      is_bypass ? 0 : voucher_template_id, // Use 0 for bypass cases
      member_id,
      current_balance,
      starting_balance,
      free_of_charge,
      default_total_price,
      'is_enabled',
      remarks,
      employee_id,
      employee_id,
      employee_id,
      created_at,
      updated_at,
    ]);

    if (!mvRows || mvRows.length === 0 || !mvRows[0].id) {
      throw new Error('Failed to insert member voucher or retrieve its ID.');
    }
    const memberVoucherId = mvRows[0].id;

    // Insert member voucher details
    const i_mvd_sql = `
      INSERT INTO member_voucher_details
      (member_voucher_id, service_id, service_name, original_price, custom_price, 
       discount, final_price, duration, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id
    `;

    // Insert member voucher transaction log (initial purchase)
    const i_mvtl_sql = `
      INSERT INTO member_voucher_transaction_logs
      (member_voucher_id, service_description, service_date, current_balance, 
       amount_change, serviced_by, type, created_by, last_updated_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id
    `;

    // Process services
    const serviceProcessingPromises = services.map(async (service) => {
      const { rows: mvdRows } = await client.query<{ id: string }>(i_mvd_sql, [
        memberVoucherId,
        is_bypass ? 0 : service.id, // Use 0 for service_id in bypass cases
        service.name,
        service.original_price,
        service.custom_price,
        service.discount,
        service.final_price,
        service.duration,
        created_at,
        updated_at,
      ]);

      if (!mvdRows || mvdRows.length === 0 || !mvdRows[0].id) {
        throw new Error(`Failed to insert detail for service ${service.name} or retrieve its ID.`);
      }
    });

    await Promise.all(serviceProcessingPromises);

    // === UPDATED TRANSACTION LOG LOGIC ===
    
    // Insert initial transaction log (purchase)
    // Use the calculated starting_balance which already includes FOC logic
    await client.query<{ id: string }>(i_mvtl_sql, [
      memberVoucherId,
      'N.A',
      created_at,
      current_balance, // Use starting_balance (includes FOC only if fully paid)
      current_balance, // amount_change same as current_balance
      employee_id,
      'PURCHASE',
      employee_id,
      employee_id,
      created_at,
      updated_at,
    ]);

    // === PAYMENT PROCESSING LOGIC ===
    
    // Determine customer type and sale transaction status
    const customer_type = member_id !== '0' ? 'member' : 'walk in customer';
    const sale_transaction_status = outstanding_amount === 0 ? 'FULL' : 'PARTIAL';

    // Insert into sale_transactions
    const i_st_sql = `
      INSERT INTO sale_transactions
      (customer_type, member_id, total_paid_amount, outstanding_total_payment_amount, 
       sale_transaction_status, remarks, handled_by, created_by, created_at, updated_at, process_payment)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id
    `;

    const { rows: stRows } = await client.query<{ id: string }>(i_st_sql, [
      customer_type,
      member_id !== '0' ? member_id : null,
      default_total_price,
      outstanding_amount,
      sale_transaction_status,
      remarks,
      employee_id,
      employee_id,
      created_at,
      updated_at,
      false
    ]);

    if (!stRows || stRows.length === 0 || !stRows[0].id) {
      throw new Error('Failed to insert sale transaction or retrieve its ID.');
    }
    const saleTransactionId = stRows[0].id;

    // Insert into sale_transaction_items
    const i_sti_sql = `
      INSERT INTO sale_transaction_items
      (sale_transaction_id, member_voucher_id, quantity, item_type, amount)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `;

    await client.query<{ id: string }>(i_sti_sql, [
      saleTransactionId,
      memberVoucherId,
      1,
      'member voucher',
      default_total_price
    ]);

    // Insert into payment_to_sale_transactions for each payment
    const i_ptst_sql = `
      INSERT INTO payment_to_sale_transactions
      (payment_method_id, sale_transaction_id, amount, created_by, created_at, updated_by, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    `;

    // Process regular payments
    const paymentProcessingPromises = payments.map(async (payment) => {
      await client.query<{ id: string }>(i_ptst_sql, [
        payment.id,
        saleTransactionId,
        payment.amount,
        employee_id,
        created_at,
        employee_id,
        updated_at
      ]);
    });

    await Promise.all(paymentProcessingPromises);

    // Add FOC as a payment if it's a full payment and FOC amount > 0
    if (is_fully_paid && free_of_charge > 0) {
      await client.query<{ id: string }>(i_ptst_sql, [
        '6', // Payment method ID for "Free"
        saleTransactionId,
        free_of_charge,
        employee_id,
        created_at,
        employee_id,
        updated_at
      ]);
      
      console.log('Added FOC payment:', free_of_charge);
    }

    await client.query('COMMIT');

    return {
      memberVoucherId: memberVoucherId,
      saleTransactionId: saleTransactionId
    };
  } catch (error) {
    console.error('Error creating member voucher:', error);
    await client.query('ROLLBACK');
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while creating the member voucher.');
  } finally {
    client.release();
  }
};

/**
 * Soft Delete (status changed to DISABLED)
 * @param {string} id - member_voucher ID
 */
const removeMemberVoucher = async (id: string) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    // Check if the voucher exists
    const { rows } = await client.query('SELECT id FROM member_vouchers WHERE id = $1', [id]);
    if (rows.length === 0) {
      throw new Error(`Member voucher with id ${id} not found for removal.`);
    }

    // Use status name directly — no need to resolve an ID
    const disabledStatus = 'disabled';

    const updateVoucherSql = `
      UPDATE member_vouchers
      SET status = $1
      WHERE id = $2
    `;
    const result = await client.query(updateVoucherSql, [disabledStatus, id]);

    await client.query('COMMIT');

    return {
      success: true,
      message: `Member voucher with ID ${id} has been soft deleted (status set to DISABLED).`,
      updated_rows: result.rowCount,
    };
  } catch (error) {
    console.error('Error removing member voucher:', error);
    await client.query('ROLLBACK');
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unexpected error occurred while removing member voucher.');
  } finally {
    client.release();
  }
};



export default {
  getPaginatedVouchers,
  getServicesOfMemberVoucherById,
  getPaginatedMemberVoucherTransactionLogs,
  addTransactionLogsByMemberVoucherId,
  getMemberVoucherCurrentBalance,
  getMemberVoucherPaidCurrentBalance,
  getMemberNameByMemberVoucherId,
  setTransactionLogsAndCurrentBalanceByLogId,
  deleteTransactionLogsAndCurrentBalanceByLogId,
  createMemberVoucher,
  removeMemberVoucher,
}