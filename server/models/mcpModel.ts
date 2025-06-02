import { pool } from '../config/database.js';
import { FieldMapping, PaginatedOptions, PaginatedReturn } from '../types/common.types.js';
import {
  Employees,
  MemberCarePackages,
  MemberCarePackagesDetails,
  MemberCarePackageTransactionLogs,
} from '../types/model.types.js';
import { encodeCursor } from '../utils/cursorUtils.js';
import { getEmployeeIdByUserAuthId } from './employeeModel.js';

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

interface FullMemberCarePackage {
  package: MemberCarePackages;
  details: MemberCarePackagesDetails[];
  transactionLogs: MemberCarePackageTransactionLogs[];
}

const getMemberCarePackageById = async (id: string): Promise<FullMemberCarePackage | null> => {
  try {
    const mcpSql = 'SELECT get_mcp_by_id($1) as data';
    const { rows } = await pool().query<{ data: FullMemberCarePackage }>(mcpSql, [id]);

    if (rows.length === 0 || !rows[0].data) {
      return null;
    }

    return rows[0].data;
  } catch (error) {
    console.error('Error getting member care package by id:', error);
    throw new Error('Error getting member care package by id');
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

const updateMemberCarePackage = async (
  id: string,
  package_name: string,
  package_remarks: string,
  package_price: number,
  services: servicePayload[],
  status_id: string,
  employee_id: string,
  user_id: string,
  updated_at: string
) => {
  const client = await pool().connect();
  try {
    if (!id) {
      throw new Error('Payload must include an id for the member care package to update.');
    }

    await client.query('BEGIN');

    // Validations
    const mcpSql = 'SELECT * FROM member_care_packages WHERE id = $1';
    const { rows: oldMcp } = await client.query<MemberCarePackages>(mcpSql, [id]);
    if (oldMcp.length === 0) {
      throw new Error(`Member care package with id ${id} not found for update.`);
    }

    // Check if the package is updatable
    const is_updateable = await checkMcpUpdatable(id);
    if (!is_updateable) {
      throw new Error('Member Care Package not updatable');
    }

    // Check employee_id
    if (!employee_id) {
      employee_id = (await getEmployeeIdByUserAuthId(user_id)).rows[0].id;
    }

    const d_mcpd_sql = 'DELETE FROM member_care_package_details WHERE member_care_package_id = $1';
    await client.query(d_mcpd_sql, [id]);

    const u_mcp_sql = `
      UPDATE member_care_packages SET
        employee_id = $1,
        package_name = $2,
        package_remarks = $3,
        total_price = $4,
        status_id = $5,
        updated_at = $6
      WHERE
        id = $7;
      `;
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

    const results = await client.query(u_mcp_sql, [
      employee_id,
      package_name,
      package_remarks,
      package_price,
      status_id,
      updated_at,
      id,
    ]);

    const serviceProcessingPromises = services.map(async (service) => {
      const { rows: mcpdRows } = await client.query<{ id: string }>(i_mcpd_sql, [
        service.name,
        service.discount,
        service.price,
        id,
        service.id,
        status_id,
        service.quantity,
      ]);

      if (!mcpdRows || mcpdRows.length === 0 || !mcpdRows[0].id) {
        throw new Error(`Failed to insert detail for service ${service.name} or retrieve its ID.`);
      }
      const memberCarePackageDetailId = mcpdRows[0].id;

      await client.query<{ id: string }>(i_mcptl_sql, [
        'PURCHASE',
        package_name,
        oldMcp[0].created_at,
        service.finalPrice * service.quantity,
        service.finalPrice * service.quantity,
        memberCarePackageDetailId,
        employee_id,
        service.id,
        updated_at,
      ]);
    });

    await Promise.all(serviceProcessingPromises);

    await client.query('COMMIT');

    return results.rowCount;
  } catch (error) {
    console.error('Error updating member care package:', error);
    await client.query('ROLLBACK');
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while updating the member care package.');
  } finally {
    client.release();
  }
};

/**
 * Permanent Deletion
 * @param {string} id
 */
const deleteMemberCarePackage = async (id: string) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    const d_mcp = 'DELETE FROM member_care_packages WHERE id = $1';
    const result = client.query(d_mcp, [id]);

    await client.query('COMMIT');

    return result;
  } catch (error) {
    console.error('Error deleting member care package:', error);
    await client.query('ROLLBACK');
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while deleting the member care package.');
  } finally {
    client.release();
  }
};

/**
 * Soft Delete (status changed to DISABLED)
 * @param {string} id
 */
const removeMemberCarePackage = async (id: string) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    // Check if mcp exists
    const results = await getMemberCarePackageById(id);
    if (!results) {
      throw new Error(`Member care package with id ${id} not found for remove.`);
    }

    const { rows: status_id } = await client.query<{ id: string }>('SELECT get_or_create_status($1) as id', [
      'DISABLED',
    ]);

    const u_mcp_sql = 'UPDATE member_care_packages SET status_id = $1 WHERE id = $2';
    const u_mcpd_sql = 'UPDATE member_care_package_details SET status_id = $1 WHERE member_care_package_id = $2';

    const [mcp, mcpd] = await Promise.all([
      client.query(u_mcp_sql, [status_id[0].id, id]),
      client.query(u_mcpd_sql, [status_id[0].id, id]),
    ]);

    await client.query('COMMIT');

    return { mcp, mcpd };
  } catch (error) {
    console.error('Error removing member care package:', error);
    await client.query('ROLLBACK');
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while removing the member care package.');
  } finally {
    client.release();
  }
};

interface mcpServiceStatusPayload {
  id: string;
  status_name: string;
}

const enableMemberCarePackage = async (id: string, payload: mcpServiceStatusPayload[]) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    // Check if mcp exists
    const results = await getMemberCarePackageById(id);
    if (!results) {
      throw new Error(`Member care package with id ${id} not found for updating status.`);
    }

    const { rows: status_id } = await client.query<{ id: string }>('SELECT get_or_create_status($1) as id', [
      'ENABLED',
    ]);

    const u_mcp_sql = 'UPDATE member_care_packages SET status_id = $1 WHERE id = $2';
    const u_mcpd_sql = 'UPDATE member_care_package_details SET status_id = $1 WHERE id = $2';

    const mcp = await client.query(u_mcp_sql, [status_id[0].id, id]);
    const mcpd: any = [];
    const servicePromise = payload.map(async (service) => {
      const { rows: status_id } = await client.query<{ id: string }>('SELECT get_or_create_status($1) as id', [
        service.status_name,
      ]);
      const results = await client.query(u_mcpd_sql, [status_id[0].id, service.id]);
      mcpd.push(results);
    });

    await Promise.all(servicePromise);

    await client.query('COMMIT');

    return { mcp, mcpd };
  } catch (error) {
    console.error('Error changing member care package status:', error);
    await client.query('ROLLBACK');
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while changing the member care package status.');
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
  getMemberCarePackageById,
  createMemberCarePackage,
  updateMemberCarePackage,
  removeMemberCarePackage,
  deleteMemberCarePackage,
  enableMemberCarePackage,
  checkMcpUpdatable,
};
