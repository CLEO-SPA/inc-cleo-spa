import { pool } from '../config/database.js';
import { PaginatedOptions, PaginatedReturn } from '../types/common.types.js';
import { MemberCarePackages } from '../types/model.types.js';
import { encodeCursor } from '../utils/cursorUtils.js';

const getPaginatedMemberCarePackages = async (
  limit: number,
  options: PaginatedOptions = {},
  start_date_utc: string | undefined | null,
  end_date_utc: string
): Promise<PaginatedReturn<MemberCarePackages>> => {
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
    SELECT get_mcp_paginated_json(
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
      console.error('Invalid response from SQL function get_mcp_paginated_json');
      throw new Error('Could not retrieve paginated member care packages due to invalid DB response.');
    }
    const result = resultRows[0].result;

    if (result.error) {
      console.error('Error reported by SQL function get_mcp_paginated_json:', result.error);
      throw new Error(`Database error: ${result.error}`);
    }

    const memberCarePackages = result.data || []; // Ensure data is an array
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
        // The `memberCarePackages` (data) returned by SQL function is already sliced to `limit` and in correct display order.
        hasPreviousPage = actualFetchedCount > limit;
        // If 'before' was used and we got results, there's a "next" page (towards more recent items).
        hasNextPage = memberCarePackages.length > 0;
      } else {
        // 'after' or initial load (no cursor)
        // `actualFetchedCount` included one extra item if more existed "after" the current set.
        hasNextPage = actualFetchedCount > limit;
        // If 'after' was used and we received data, a "previous" page exists.
        hasPreviousPage = !!after && memberCarePackages.length > 0;
        if (!after && !before) {
          // Initial load (no cursor)
          hasPreviousPage = false; // No previous page on the very first fetch.
        }
      }
    }

    if (memberCarePackages.length > 0) {
      // Ensure created_at is a Date object if needed by encodeCursor, SQL returns ISO strings
      startCursor = encodeCursor(new Date(memberCarePackages[0].created_at), memberCarePackages[0].id);
      endCursor = encodeCursor(
        new Date(memberCarePackages[memberCarePackages.length - 1].created_at),
        memberCarePackages[memberCarePackages.length - 1].id
      );
    }

    return {
      data: memberCarePackages,
      pageInfo: {
        startCursor,
        endCursor,
        hasNextPage,
        hasPreviousPage,
        totalCount,
      },
    };
  } catch (error) {
    console.error('Error in CarePackageModel.getPaginatedMemberCarePackages (with PG function):', error);
    throw new Error('Could not retrieve paginated care packages.');
  }
};

export default {
  getPaginatedMemberCarePackages,
};
