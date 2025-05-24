import { pool } from '../config/database.js';
import { encodeCursor } from '../utils/cursorUtils.js';

const getPaginatedCarePackages = async (
  limit,
  { after, before, page, searchTerm } = {},
  start_date_utc,
  end_date_utc
) => {
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
    SELECT get_cp_paginated_json(
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
      console.error('Invalid response from SQL function get_cp_paginated_json');
      throw new Error('Could not retrieve paginated care packages due to invalid DB response.');
    }
    const result = resultRows[0].result;

    if (result.error) {
      console.error('Error reported by SQL function get_cp_paginated_json:', result.error);
      throw new Error(`Database error: ${result.error}`);
    }

    const carePackages = result.data || []; // Ensure data is an array
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
        // The `carePackages` (data) returned by SQL function is already sliced to `limit` and in correct display order.
        hasPreviousPage = actualFetchedCount > limit;
        // If 'before' was used and we got results, there's a "next" page (towards more recent items).
        hasNextPage = carePackages.length > 0;
      } else {
        // 'after' or initial load (no cursor)
        // `actualFetchedCount` included one extra item if more existed "after" the current set.
        hasNextPage = actualFetchedCount > limit;
        // If 'after' was used and we received data, a "previous" page exists.
        hasPreviousPage = !!after && carePackages.length > 0;
        if (!after && !before) {
          // Initial load (no cursor)
          hasPreviousPage = false; // No previous page on the very first fetch.
        }
      }
    }

    if (carePackages.length > 0) {
      // Ensure created_at is a Date object if needed by encodeCursor, SQL returns ISO strings
      startCursor = encodeCursor(new Date(carePackages[0].created_at), carePackages[0].id);
      endCursor = encodeCursor(
        new Date(carePackages[carePackages.length - 1].created_at),
        carePackages[carePackages.length - 1].id
      );
    }

    return {
      data: carePackages,
      pageInfo: {
        startCursor,
        endCursor,
        hasNextPage,
        hasPreviousPage,
        totalCount,
      },
    };
  } catch (error) {
    console.error('Error in CarePackageModel.getPaginatedCarePackages (with PG function):', error.message);
    if (error.message.startsWith('Database error:')) {
      throw error;
    }
    throw new Error('Could not retrieve paginated care packages.');
  }
};

const getCarePackageById = async (id) => {
  try {
    const query = `SELECT * FROM care_packages
                  WHERE id = $1`;
    const values = [id];
    const { rows } = pool().query(query, values);

    return rows;
  } catch (error) {
    console.error('Error in CarePackageModel.getCarePackageById:', error);
    throw new Error('Could not retrieve care package by id');
  }
};

export default {
  getPaginatedCarePackages,
  getCarePackageById,
};
