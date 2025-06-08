import { pool } from '../config/database.js';
import { PaginatedOptions, PaginatedReturn } from '../types/common.types.js';
import { MemberVouchers, MemberVoucherServices, MemberVoucherTransactionLogs } from '../types/model.types.js';
import { encodeCursor } from '../utils/cursorUtils.js';


const getPaginatedVouchers = async (
  limit: number,
  options: PaginatedOptions = {},
  start_date_utc: string | undefined | null,
  end_date_utc: string
): Promise<PaginatedReturn<MemberVouchers>> => {
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
      console.error('Invalid response from SQL function get_voucher_paginated_json');
      throw new Error('Could not retrieve paginated vouchers due to invalid DB response.');
    }

    const result = resultRows[0].result;

    if (result.error) {
      console.error('Error reported by SQL function get_voucher_paginated_json:', result.error);
      throw new Error(`Database error: ${result.error}`);
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

    return {
      data: vouchers,
      pageInfo: {
        startCursor,
        endCursor,
        hasNextPage,
        hasPreviousPage,
        totalCount,
      },
    };
  } catch (error: unknown) {
    console.error('Error in memberVoucherModel.getPaginatedVouchers (with PG function):', error);
    throw new Error('Could not retrieve paginated vouchers.');
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

    const response = await client.query(query, [id]);

    if (response.rows.length > 0) {
      return { success: true, data: response.rows, message: "Get Services of Member Voucher By Id was successful" };
    } else {
      return { success: false, data: [], message: "The input Id of Member Voucher does not exist" };
    }
  } catch (error: unknown) {
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
      const errorMessage = 'Invalid response from SQL function get_member_voucher_transaction_logs_paginated_json';
      return { success: false, data: [], message: errorMessage };
    }

    const result = resultRows[0].result;

    if (result.error) {
      const errorMessage = 'Error reported by SQL function get_member_voucher_transaction_logs_paginated_json:' + result.error;
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
  } catch (error: unknown) {
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

// const addMembershipType = async (data: NewMembershipType): Promise<{ success: boolean, message: string }> => {
//   const {
//     membership_type_name,
//     default_percentage_discount_for_products,
//     default_percentage_discount_for_services,
//     created_by
//   } = data;

//   const last_updated_by = created_by;

//   const created_at = new Date();

//   const updated_at = created_at;

//   try {
//     const result = await withTransaction(async (client) => { // create the callback for the transaction
//       const query = `
//         INSERT INTO membership_types (
//         membership_type_name,
//         default_percentage_discount_for_products,
//         default_percentage_discount_for_services,
//         created_at,
//         updated_at,
//         created_by,
//         last_updated_by,
//         status
//         )
//         VALUES (
//         $1, $2, $3, $4, $5, $6, $7, 'is_enabled'
//         )
//         `;
//       const values = [
//         membership_type_name,
//         default_percentage_discount_for_products,
//         default_percentage_discount_for_services,
//         created_at,
//         updated_at,
//         created_by,
//         last_updated_by
//       ];

//       return await client.query(query, values);
//     });

//     if (Number(result.rowCount) > 0) {
//       return { success: true, message: "The new Membership Type has been created." };
//     } else {
//       return { success: false, message: "Failed to create membership type - no rows affected." };
//     }

//   } catch (error) {
//     console.error('Error creating membership types:', error);
//     return { success: false, message: "Failed to create membership type due to database error." };
//   }
// };

export default {
  getPaginatedVouchers,
  getServicesOfMemberVoucherById,
  getPaginatedMemberVoucherTransactionLogs
}