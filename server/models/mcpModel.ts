import { pool } from '../config/database.js';
import { PaginatedOptions, PaginatedReturn } from '../types/common.types.js';
import { Employees, MemberCarePackages, MemberCarePackagesDetails } from '../types/model.types.js';
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

interface servicePayload {
  id: string;
  name: string;
  quantity: number;
  price: number;
  finalPrice: number;
  discount: number;
}

const createMemberCarePackage = async (
  package_name: string,
  member_id: string,
  employee_id: string,
  package_remarks: string,
  package_price: number,
  services: servicePayload[],
  created_at: string,
  updated_at: string
) => {
  const client = await pool().connect();

  try {
    await client.query('BEGIN');

    const v_member_sql = 'SELECT id FROM members WHERE id = $1';
    const v_employee_sql = 'SELECT id FROM employees WHERE id = $1';
    const v_status_sql = 'SELECT get_or_create_status($1) as id';

    const [memberResult, employeeResult, statusResult] = await Promise.all([
      client.query(v_member_sql, [member_id]),
      client.query<Employees>(v_employee_sql, [employee_id]),
      client.query<{ id: string }>(v_status_sql, ['ENABLED']),
    ]);

    if (memberResult.rowCount === 0) {
      throw new Error(`Invalid member_id: ${member_id} does not exist.`);
    }
    if (employeeResult.rowCount === 0) {
      throw new Error(`Invalid employee_id: ${employee_id} does not exist.`);
    }
    if (!statusResult.rows || statusResult.rows.length === 0 || !statusResult.rows[0].id) {
      throw new Error('Failed to get or create status ID.');
    }
    const statusId = statusResult.rows[0].id;

    const i_mcp_sql = `
      INSERT INTO member_care_packages
      (member_id, employee_id, package_name, package_remarks, status_id, total_price, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `;
    const { rows: mcpRows } = await client.query<{ id: string }>(i_mcp_sql, [
      member_id,
      employee_id,
      package_name,
      package_remarks,
      statusId,
      package_price,
      created_at,
      updated_at,
    ]);

    if (!mcpRows || mcpRows.length === 0 || !mcpRows[0].id) {
      throw new Error('Failed to insert member care package or retrieve its ID.');
    }
    const memberCarePackageId = mcpRows[0].id;

    const i_mcpd_sql = `
      INSERT INTO member_care_package_details
      (service_name, discount, price, member_care_package_id, service_id, status_id, quantity)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    `;
    const i_mcptl_sql = `
      INSERT INTO member_care_package_transaction_logs
      (type, description, transaction_date, transaction_amount, amount_changed, member_care_package_details_id, employee_id, service_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
    `;

    const serviceProcessingPromises = services.map(async (service) => {
      const { rows: mcpdRows } = await client.query<{ id: string }>(i_mcpd_sql, [
        service.name,
        service.discount,
        service.price,
        memberCarePackageId,
        service.id,
        statusId,
        service.quantity,
      ]);

      if (!mcpdRows || mcpdRows.length === 0 || !mcpdRows[0].id) {
        throw new Error(`Failed to insert detail for service ${service.name} or retrieve its ID.`);
      }
      const memberCarePackageDetailId = mcpdRows[0].id;

      await client.query<{ id: string }>(i_mcptl_sql, [
        'PURCHASE',
        package_name,
        created_at,
        service.finalPrice,
        service.finalPrice,
        memberCarePackageDetailId,
        employee_id,
        service.id,
        created_at,
      ]);
    });

    await Promise.all(serviceProcessingPromises);

    await client.query('COMMIT');

    return {
      memberCarePackageId: memberCarePackageId,
    };
  } catch (error) {
    console.error('Error creating member care package:', error);
    await client.query('ROLLBACK');
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while creating the member care package.');
  } finally {
    client.release();
  }
};

const checkMcpUpdatable = async (id: string) => {
  try {
    const type = 'CONSUMPTION';
    const sql = `
      SELECT
      CASE
          WHEN NOT EXISTS (
              SELECT 1
              FROM
                  member_care_package_details mcpd
              JOIN
                  member_care_package_transaction_logs mcptl
              ON
                  mcpd.id = mcptl.member_care_package_details_id
              WHERE
                  mcpd.member_care_package_id = $1
                  AND mcptl.type = ${type}
          )
          THEN TRUE
          ELSE FALSE
      END AS is_updateable;
    `;

    const { rows } = await pool().query<{ is_updateable: boolean }>(sql, [id]);

    return rows[0].is_updateable;
  } catch (error) {
    console.error('Error checking member care package updateable');
    throw new Error('Error checking member care package updateable');
  }
};
export default {
  getPaginatedMemberCarePackages,
  createMemberCarePackage,
  checkMcpUpdatable,
};
