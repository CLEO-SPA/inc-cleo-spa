/* eslint-disable @typescript-eslint/no-explicit-any */
import { PoolClient } from 'pg';
import { pool } from '../config/database.js';
import { CursorPayload, FieldMapping, PaginatedOptions, PaginatedReturn } from '../types/common.types.js';
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
  end_date_utc: string | undefined | null
): Promise<PaginatedReturn<MemberCarePackages>> => {
  const { searchTerm } = options;
  const after = options.after || null;
  const before = options.before || null;
  const page = options.page;

  try {
    const client = await pool().connect();

    try {
      // Build filter conditions
      const { filterWhereClause, filterParams, paramCounter } = buildFilterConditions(
        searchTerm!,
        start_date_utc,
        end_date_utc
      );

      // Get total count with optimized query
      const totalCount = await getTotalCount(client, filterWhereClause, filterParams);

      // Prepare query parameters for pagination
      const { finalWhereClause, cursorParams, orderBy, effectiveLimit } = preparePaginationParams(
        filterWhereClause,
        filterParams,
        paramCounter,
        limit,
        page!,
        after,
        before
      );

      // Execute the main data query with CTE for better performance
      const dataQuery = buildDataQuery(finalWhereClause, orderBy, page!, limit, effectiveLimit);

      const { rows: rawResults } = await client.query(dataQuery, cursorParams);
      const actualFetchedCount = rawResults.length;

      // Process results based on pagination type
      const { memberCarePackages, hasNextPage, hasPreviousPage } = processPaginationResults(
        rawResults,
        before,
        after,
        page!,
        limit,
        totalCount,
        actualFetchedCount
      );

      // Generate cursors for the result set using the utility function
      const { startCursor, endCursor } = generateCursors(memberCarePackages);

      return {
        data: memberCarePackages as any,
        pageInfo: {
          startCursor,
          endCursor,
          hasNextPage,
          hasPreviousPage,
          totalCount,
        },
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in CarePackageModel.getPaginatedMemberCarePackages:', error);
    throw new Error('Could not retrieve paginated care packages.');
  }
};

function buildFilterConditions(
  searchTerm: string | undefined,
  start_date_utc: string | null | undefined,
  end_date_utc: string | null | undefined
): {
  filterWhereClause: string;
  filterParams: any[];
  paramCounter: number;
} {
  const filterConditions: string[] = [];
  const filterParams: any[] = [];
  let paramCounter = 1;

  if (searchTerm) {
    filterConditions.push(
      `(mcp.package_name ILIKE $${paramCounter} OR 
        mcp.package_remarks ILIKE $${paramCounter} OR 
        m.name ILIKE $${paramCounter} OR 
        e.employee_name ILIKE $${paramCounter})`
    );
    filterParams.push(`%${searchTerm}%`);
    paramCounter++;
  }

  if (start_date_utc) {
    filterConditions.push(`mcp.created_at >= $${paramCounter}`);
    filterParams.push(start_date_utc);
    paramCounter++;
  }

  if (end_date_utc) {
    filterConditions.push(`mcp.created_at <= $${paramCounter}`);
    filterParams.push(end_date_utc);
    paramCounter++;
  }

  const filterWhereClause = filterConditions.length > 0 ? `WHERE ${filterConditions.join(' AND ')}` : '';

  return { filterWhereClause, filterParams, paramCounter };
}

async function getTotalCount(client: PoolClient, filterWhereClause: string, filterParams: any[]): Promise<number> {
  const baseQuery = getBaseJoinQuery();

  const countQuery = `
    SELECT COUNT(*) 
    FROM (
      SELECT 1 
      ${baseQuery}
      ${filterWhereClause}
      GROUP BY mcp.id, m.name, e.employee_name
    ) AS count_subquery
  `;

  const { rows: countRows } = await client.query<{ count: string }>(countQuery, filterParams);
  return parseInt(countRows[0].count, 10);
}

function preparePaginationParams(
  filterWhereClause: string,
  filterParams: any[],
  paramCounter: number,
  limit: number,
  page: number | undefined,
  after: CursorPayload | null,
  before: CursorPayload | null
): {
  finalWhereClause: string;
  cursorParams: any[];
  orderBy: string;
  effectiveLimit: number;
} {
  let finalWhereClause = filterWhereClause;
  let orderBy = 'ORDER BY mcp.created_at ASC, mcp.id ASC';
  let cursorParams = [...filterParams];
  let effectiveLimit = page && page > 0 ? limit : limit + 1;

  if (!page && (after || before)) {
    if (finalWhereClause) {
      finalWhereClause += ' AND ';
    } else {
      finalWhereClause = 'WHERE ';
    }

    if (after) {
      finalWhereClause += `(mcp.created_at > $${paramCounter} OR (mcp.created_at = $${paramCounter} AND mcp.id > $${
        paramCounter + 1
      }))`;
      cursorParams.push(after.createdAt, after.id);
    } else if (before) {
      finalWhereClause += `(mcp.created_at < $${paramCounter} OR (mcp.created_at = $${paramCounter} AND mcp.id < $${
        paramCounter + 1
      }))`;
      cursorParams.push(before.createdAt, before.id);
      orderBy = 'ORDER BY mcp.created_at DESC, mcp.id DESC';
    }
  }

  return { finalWhereClause, cursorParams, orderBy, effectiveLimit };
}

function buildDataQuery(
  finalWhereClause: string,
  orderBy: string,
  page: number | undefined,
  limit: number,
  effectiveLimit: number
): string {
  const baseQuery = getBaseJoinQuery();
  const selectFields = getSelectFields();

  // Use a CTE for more efficient query execution
  return `
    WITH filtered_packages AS (
      SELECT 
        mcp.id,
        mcp.package_name,
        mcp.package_remarks,
        mcp.created_at,
        mcp.updated_at,
        mcp.total_price,
        mcp.balance,
        mcp.status,
        m.name AS member_name,
        e.employee_name
      ${baseQuery}
      ${finalWhereClause}
      GROUP BY mcp.id, m.name, e.employee_name
      ${orderBy}
      ${page && page > 0 ? `OFFSET ${(page - 1) * limit}` : ''}
      LIMIT ${effectiveLimit}
    )
    SELECT 
      fp.id AS mcp_id,
      fp.package_name,
      fp.status,
      fp.balance,
      fp.package_remarks,
      fp.member_name,
      fp.employee_name,
      fp.total_price,
      fp.created_at,
      fp.updated_at,
      ${selectFields}
    FROM filtered_packages fp
  `;
}

function processPaginationResults(
  rawResults: any[],
  before: CursorPayload | null,
  after: CursorPayload | null,
  page: number | undefined,
  limit: number,
  totalCount: number,
  actualFetchedCount: number
): {
  memberCarePackages: any[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
} {
  // Process results based on pagination type
  let memberCarePackages = before && !page ? [...rawResults].reverse().slice(0, limit) : rawResults.slice(0, limit);

  let hasNextPage = false;
  let hasPreviousPage = false;

  if (page && page > 0) {
    // Offset-based pagination
    hasNextPage = page * limit < totalCount;
    hasPreviousPage = page > 1;
  } else if (before) {
    // "Before" cursor pagination
    hasNextPage = memberCarePackages.length > 0;
    hasPreviousPage = actualFetchedCount > limit;
  } else if (after) {
    // "After" cursor pagination
    hasNextPage = actualFetchedCount > limit;
    hasPreviousPage = true;
  } else {
    // Initial load (no cursor)
    hasNextPage = actualFetchedCount > limit;
    hasPreviousPage = false;
  }

  return { memberCarePackages, hasNextPage, hasPreviousPage };
}

function generateCursors(memberCarePackages: any[]): {
  startCursor: string | null;
  endCursor: string | null;
} {
  let startCursor = null;
  let endCursor = null;

  if (memberCarePackages.length > 0) {
    const firstItem = memberCarePackages[0];
    const lastItem = memberCarePackages[memberCarePackages.length - 1];

    startCursor = encodeCursor(new Date(firstItem.created_at), String(firstItem.mcp_id));
    endCursor = encodeCursor(new Date(lastItem.created_at), String(lastItem.mcp_id));
  }

  return { startCursor, endCursor };
}

function getBaseJoinQuery(): string {
  return `
    FROM member_care_packages mcp
    LEFT JOIN employees e ON mcp.member_id = e.id
    LEFT JOIN members m ON mcp.member_id = m.id
  `;
}

function getSelectFields(): string {
  return `
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', mcpd.id,
            'discount', mcpd.discount,
            'price', mcpd.price,
            'member_care_package_id', mcpd.member_care_package_id,
            'service_id', mcpd.service_id,
            'status', mcpd.status,
            'quantity', mcpd.quantity
          ) ORDER BY mcpd.id ASC
        )
        FROM member_care_package_details mcpd
        WHERE mcpd.member_care_package_id = fp.id
      ),
      '[]'::json
    ) AS package_details,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', mcptl.id,
            'type', mcptl.type,
            'description', mcptl.description,
            'transaction_date', mcptl.transaction_date,
            'transaction_amount', mcptl.transaction_amount,
            'amount_changed', mcptl.amount_changed,
            'created_at', mcptl.created_at,
            'member_care_package_details_id', mcptl.member_care_package_details_id,
            'employee_id', mcptl.employee_id,
            'service_id', mcptl.service_id
          ) ORDER BY mcptl.created_at ASC
        )
        FROM member_care_package_details mcpd2
        JOIN member_care_package_transaction_logs mcptl
          ON mcpd2.id = mcptl.member_care_package_details_id
        WHERE mcpd2.member_care_package_id = fp.id
      ),
      '[]'::json
    ) AS transaction_logs
  `;
}

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

const getMemberCarePackagesForDropdown = async (memberId: string) => {
  try {
    const sql = `
      SELECT
          mcp.id,
          mcp.package_name,
          mcp.balance,
          m.name
      FROM
          member_care_packages mcp
      INNER JOIN
          members m ON m.id = mcp.member_id
      WHERE
          mcp.status = 'ENABLED' AND mcp.member_id = $1
      ORDER BY
          mcp.created_at DESC;
    `;

    const { rows } = await pool().query(sql, [memberId]);

    return rows;
  } catch (error) {
    console.error('Error in mcpModel.getMemberCarePackagesForDropdown', error);
    throw new Error('Could not retrieve all mcp for dropdown');
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

    const [memberResult, employeeResult] = await Promise.all([
      client.query(v_member_sql, [member_id]),
      client.query<Employees>(v_employee_sql, [employee_id]),
    ]);

    if (memberResult.rowCount === 0) {
      throw new Error(`Invalid member_id: ${member_id} does not exist.`);
    }
    if (employeeResult.rowCount === 0) {
      throw new Error(`Invalid employee_id: ${employee_id} does not exist.`);
    }

    const i_mcp_sql = `
      INSERT INTO member_care_packages
      (member_id, employee_id, package_name, package_remarks, status, total_price, balance, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
    `;
    const { rows: mcp } = await client.query<{ id: string }>(i_mcp_sql, [
      member_id,
      employee_id,
      package_name,
      package_remarks,
      'ENABLED',
      package_price,
      0,
      created_at,
      updated_at,
    ]);

    if (!mcp || mcp.length === 0 || !mcp[0].id) {
      throw new Error('Failed to insert member care package or retrieve its ID.');
    }
    const memberCarePackageId = mcp[0].id;

    const i_mcpd_sql = `
      INSERT INTO member_care_package_details
      (service_name, discount, price, member_care_package_id, service_id, status, quantity)
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
        service.id || null,
        'ENABLED',
        service.quantity,
      ]);

      if (!mcpdRows || mcpdRows.length === 0 || !mcpdRows[0].id) {
        throw new Error(`Failed to insert detail for service ${service.name} or retrieve its ID.`);
      }
      const memberCarePackageDetailId = mcpdRows[0].id;

      await client.query<{ id: string }>(i_mcptl_sql, [
        'PURCHASE',
        service.name,
        created_at,
        service.finalPrice * service.quantity,
        service.finalPrice * service.quantity,
        memberCarePackageDetailId,
        employee_id,
        service.id || null,
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
  package_balance: number,
  services: servicePayload[],
  status: 'ENABLED' | 'DISABLED',
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
        balance = $5,
        status = $6,
        updated_at = $7
      WHERE
        id = $8;
      `;
    const i_mcpd_sql = `
      INSERT INTO member_care_package_details
      (service_name, discount, price, member_care_package_id, service_id, status, quantity)
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
      package_balance,
      status,
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
        status,
        service.quantity,
      ]);

      if (!mcpdRows || mcpdRows.length === 0 || !mcpdRows[0].id) {
        throw new Error(`Failed to insert detail for service ${service.name} or retrieve its ID.`);
      }
      const memberCarePackageDetailId = mcpdRows[0].id;

      await client.query<{ id: string }>(i_mcptl_sql, [
        'PURCHASE',
        service.name,
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

    const u_mcp_sql = 'UPDATE member_care_packages SET status = $1 WHERE id = $2';
    const u_mcpd_sql = 'UPDATE member_care_package_details SET status = $1 WHERE member_care_package_id = $2';

    const [mcp, mcpd] = await Promise.all([
      client.query(u_mcp_sql, ['DISABLED', id]),
      client.query(u_mcpd_sql, ['DISABLED', id]),
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

interface mcpConsumptionDetails {
  mcpd_id: string;
  mcpd_quantity: number;
  mcpd_date: string;
}

const createConsumption = async (
  mcp_id: string,
  mcp_details: mcpConsumptionDetails[],
  employee_id: string,
  user_id: string
) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    // Check if mcp exists
    const mcp = await getMemberCarePackageById(mcp_id);
    if (!mcp) {
      throw new Error(`Member care package with id ${mcp_id} not found for updating status.`);
    }

    if (mcp.package.balance === 0) {
      throw new Error(`Member care package with id ${mcp_id} has a zero balance. No services left to consume.`);
    }

    if (!employee_id) {
      employee_id = (await getEmployeeIdByUserAuthId(user_id)).rows[0].id;
    }

    const u_mcp_sql = `
      UPDATE member_care_packages SET
        balance = $1,
        updated_at = $2
      WHERE
        id = $3;
    `;
    const g_mcpd_sql = `
      SELECT * FROM member_care_package_details WHERE id = $1;
    `;
    const g_mcptl_sql = `
      SELECT * FROM member_care_package_transaction_logs WHERE member_care_package_details_id = $1 AND transaction_date = $2;
    `;
    const i_mcptl_sql = `
      INSERT INTO member_care_package_transaction_logs
      (type, description, transaction_date, transaction_amount, amount_changed, member_care_package_details_id, employee_id, service_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;
    `;

    const results: { completed: string[]; failed: string[] } = { completed: [], failed: [] };
    const detailPromises = mcp_details.map(async (d) => {
      const { rows: mcpdRows } = await client.query<MemberCarePackagesDetails>(g_mcpd_sql, [d.mcpd_id]);
      if (mcpdRows.length === 0) {
        console.error(`[CONSUMPTION_ERROR] MemberCarePackagesDetails not found for id: ${d.mcpd_id}`);
        throw new Error(`Cannot process consumption: Detail record ${d.mcpd_id} not found.`);
      }
      const mcpDetailToConsume = mcpdRows[0];

      const { rows: baseLogRows } = await client.query<MemberCarePackageTransactionLogs>(g_mcptl_sql, [
        d.mcpd_id,
        mcp.package.created_at,
      ]);

      // Create a local tracking variable for the remaining balance
      let currentBalance = mcp.package.balance;
      const consumptionLogPromises = [];

      for (let i = 0; i < d.mcpd_quantity; i++) {
        if (mcpDetailToConsume.price > currentBalance) {
          results.failed.push(d.mcpd_id);
          break;
        }

        // Update the local balance tracking
        currentBalance -= mcpDetailToConsume.price;
        // console.log(currentBalance);
        baseLogRows[0].transaction_amount -= mcpDetailToConsume.price;

        consumptionLogPromises.push(
          client.query(i_mcptl_sql, [
            'CONSUMPTION',
            baseLogRows[0].description,
            d.mcpd_date,
            baseLogRows[0].transaction_amount,
            -mcpDetailToConsume.price,
            d.mcpd_id,
            employee_id,
            mcpDetailToConsume.service_id,
            d.mcpd_date,
          ])
        );

        results.completed.push(d.mcpd_id);
      }

      await Promise.all(consumptionLogPromises);

      mcp.package.balance = currentBalance;
    });
    await Promise.all(detailPromises);
    await client.query(u_mcp_sql, [mcp.package.balance, new Date().toUTCString(), mcp.package.id]);

    await client.query('COMMIT');
    return results;
  } catch (error) {
    console.error('Error creating member care package consumption:', error);
    await client.query('ROLLBACK');
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while creating the member care package consumption.');
  } finally {
    client.release();
  }
};

interface mcpServiceStatusPayload {
  id: string;
  status_name: 'ENABLED' | 'DISABLED';
}

const updateMemberCarePackageStatus = async (id: string, payload: mcpServiceStatusPayload[]) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    const mcpData = await getMemberCarePackageById(id);
    if (!mcpData) {
      throw new Error(`Member care package with id ${id} not found for updating status.`);
    }

    const existingServiceIds = new Set(mcpData.details.map((d) => d.id));
    for (const service of payload) {
      if (!existingServiceIds.has(service.id)) {
        throw new Error(`Service with id ${service.id} does not belong to member care package ${id}.`);
      }
    }

    const u_mcpd_sql = 'UPDATE member_care_package_details SET status = $1 WHERE id = $2';
    const serviceUpdatePromises = payload.map((service) => {
      return client.query(u_mcpd_sql, [service.status_name, service.id]);
    });

    await Promise.all(serviceUpdatePromises);

    const g_all_mcpd_sql = 'SELECT status FROM member_care_package_details WHERE member_care_package_id = $1';
    const { rows: allServices } = await client.query<{ status: string }>(g_all_mcpd_sql, [id]);

    const allServicesDisabled = allServices.every((s) => s.status === 'DISABLED');
    const finalPackageStatus = allServicesDisabled ? 'DISABLED' : 'ENABLED';

    const u_mcp_sql = 'UPDATE member_care_packages SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
    const { rows: updatedMcp } = await client.query(u_mcp_sql, [finalPackageStatus, id]);

    await client.query('COMMIT');

    return { updatedMcp: updatedMcp[0] };
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
                  AND mcptl.type = '${type}'
          )
          THEN TRUE
          ELSE FALSE
      END AS is_updateable;
    `;

    const { rows } = await pool().query<{ is_updateable: boolean }>(sql, [id]);

    return rows[0].is_updateable;
  } catch (error) {
    console.error('Error checking member care package updateable', error);
    throw new Error('Error checking member care package updateable');
  }
};

const transferMemberCarePackage = async (mcp_id1: string, mcp_id2: string, amount: number) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    const mcp1Result = await client.query<MemberCarePackages>(
      'SELECT * FROM member_care_packages WHERE id = $1 FOR UPDATE',
      [mcp_id1]
    );
    const mcp2Result = await client.query<MemberCarePackages>(
      'SELECT * FROM member_care_packages WHERE id = $1 FOR UPDATE',
      [mcp_id2]
    );

    if (mcp1Result.rowCount === 0) {
      throw new Error(`Source package with ID ${mcp_id1} not found.`);
    }
    if (mcp2Result.rowCount === 0) {
      throw new Error(`Destination package with ID ${mcp_id2} not found.`);
    }

    const sourceMcp = mcp1Result.rows[0];
    const destinationMcp = mcp2Result.rows[0];

    if (sourceMcp.balance < amount) {
      throw new Error(
        `Insufficient balance in source package ${sourceMcp.package_name}. Available: $${sourceMcp.balance}, trying to transfer: $${amount}.`
      );
    }

    if (sourceMcp.balance === amount) {
      const u_mcpd_sql = 'UPDATE member_care_package_details SET status = $1 WHERE member_care_package_id = $2';
      await client.query(u_mcpd_sql, ['DISABLED', mcp_id1]);
    }

    if (destinationMcp.balance === 0 && amount > 0) {
      const enable_sql = 'UPDATE member_care_package_details SET status = $1 WHERE member_care_package_id = $2';
      await client.query(enable_sql, ['ENABLED', mcp_id2]);
    }

    const u_mcp1_sql = 'UPDATE member_care_packages SET balance = balance - $1, updated_at = NOW() WHERE id = $2';
    await client.query(u_mcp1_sql, [amount, mcp_id1]);

    const u_mcp2_sql = 'UPDATE member_care_packages SET balance = balance + $1, updated_at = NOW() WHERE id = $2';
    await client.query(u_mcp2_sql, [amount, mcp_id2]);

    await client.query('COMMIT');

    return { success: true, message: 'Transfer completed successfully.' };
  } catch (error) {
    console.error('Error transfering member care package:', error);
    await client.query('ROLLBACK');
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while transfering the member care package.');
  } finally {
    client.release();
  }
};

interface emulatePayload {
  id?: string;
  package_name: string;
  member_id: string;
  employee_id?: string;
  user_id?: string;
  package_remarks: string;
  package_price: number;
  services: servicePayload[];
  status: 'ENABLED' | 'DISABLED';
  created_at: string;
  updated_at: string;
}

const emulateMemberCarePackage = async (method: string, payload: Partial<emulatePayload>) => {
  async function em_post(payload: emulatePayload) {
    try {
      const lastMcpSql: string = 'SELECT * FROM member_care_packages ORDER BY id DESC LIMIT 1';
      const { rows: mcp } = await pool().query<MemberCarePackages>(lastMcpSql);
      const lastMcp: MemberCarePackages | undefined = mcp[0];
      const lastMcpId = lastMcpSql && lastMcp.id ? parseInt(lastMcp.id) : 0;

      payload.employee_id =
        payload.employee_id || (await getEmployeeIdByUserAuthId(payload.user_id as string)).rows[0].id;

      const newMcp: MemberCarePackages = {
        id: (lastMcpId + 1).toString(),
        member_id: payload.member_id,
        employee_id: payload.employee_id,
        package_name: payload.package_name,
        package_remarks: payload.package_remarks,
        status: 'ENABLED',
        total_price: payload.package_price,
        balance: 0,
        created_at: payload.created_at || new Date().toISOString(),
        updated_at: payload.updated_at || new Date().toISOString(),
      };

      let oldMcpd: MemberCarePackagesDetails[] = [];
      let oldMcptl: MemberCarePackageTransactionLogs[] = [];
      const newMcpd: MemberCarePackagesDetails[] = [];
      const newMcptl: MemberCarePackageTransactionLogs[] = [];

      if (payload.services && payload.services.length > 0) {
        const lastMcpDetailsSql: string = 'SELECT * FROM member_care_package_details ORDER BY id DESC LIMIT 1';
        const { rows: mcpd } = await pool().query<MemberCarePackagesDetails>(lastMcpDetailsSql);
        oldMcpd = mcpd;
        const lastMcpDetailsId = mcpd[0] && mcpd[0].id ? parseInt(mcpd[0].id) : 0;

        const lastMcptlSql: string = 'SELECT * FROM member_care_package_transaction_logs ORDER BY id DESC LIMIT 1';
        const { rows: mcptl } = await pool().query<MemberCarePackageTransactionLogs>(lastMcptlSql);
        oldMcptl = mcptl;
        const lastMcptlId = mcptl[0] && mcptl[0].id ? parseInt(mcptl[0].id) : 0;

        payload.services.forEach((service, idx) => {
          newMcpd.push({
            id: (lastMcpDetailsId + idx + 1).toString(),
            member_care_package_id: newMcp.id!,
            service_id: service.id,
            service_name: service.name,
            status: 'ENABLED',
            quantity: service.quantity,
            discount: service.discount,
            price: service.price,
          });

          newMcptl.push({
            id: (lastMcptlId + idx + 1).toString(),
            type: 'PURCHASE',
            description: service.name,
            transaction_date: payload.created_at,
            transaction_amount: service.finalPrice * service.quantity,
            amount_changed: service.finalPrice * service.quantity,
            employee_id: payload.employee_id!,
            member_care_package_details_id: newMcp.id!,
            service_id: service.id,
            created_at: payload.created_at,
          });
        });
      }

      return {
        old: {
          member_care_packages: mcp,
          member_care_package_details: oldMcpd,
          member_care_package_transaction_logs: oldMcptl,
        },
        new: {
          member_care_packages: [newMcp],
          member_care_package_details: newMcpd,
          member_care_package_transaction_logs: newMcptl,
        },
      };
    } catch (error) {
      console.error('Error emulating member create care package:', error);
      if (error instanceof Error) {
        throw new Error(`Error emulating member create care package: ${error.message}`);
      }
      throw new Error('An unknown error occurred while emulating member create care package');
    }
  }

  async function em_put(payload: emulatePayload) {
    try {
      if (!payload.id) {
        throw new Error('Payload must include an id for the member care package to update.');
      }

      const mcpSql: string = 'SELECT * FROM member_care_packages WHERE id = $1';
      const mcpdSql: string = 'SELECT * FROM member_care_package_details WHERE member_care_package_id = $1';
      const mcptlSql: string =
        'SELECT * FROM member_care_package_transaction_logs WHERE member_care_package_details_id = $1';

      const { rows: oldMcp } = await pool().query<MemberCarePackages>(mcpSql, [payload.id]);
      if (oldMcp.length === 0) {
        throw new Error(`Member care package with id ${payload.id} not found for update.`);
      }
      const isUpdatable = await checkMcpUpdatable(oldMcp[0].id!);

      if (!isUpdatable) {
        throw new Error(`Member care package with id ${payload.id} not updatable`);
      }

      const { rows: oldMcpd } = await pool().query<MemberCarePackagesDetails>(mcpdSql, [oldMcp[0].id]);
      const { rows: oldMcptl } = await pool().query<MemberCarePackageTransactionLogs>(mcptlSql, [oldMcpd[0].id]);

      payload.employee_id =
        payload.employee_id || (await getEmployeeIdByUserAuthId(payload.user_id as string)).rows[0].id;

      const mcpMapping: FieldMapping<emulatePayload, MemberCarePackages>[] = [
        { payloadKey: 'package_name', dbKey: 'package_name' },
        { payloadKey: 'package_remarks', dbKey: 'package_remarks' },
        { payloadKey: 'member_id', dbKey: 'member_id' },
        { payloadKey: 'employee_id', dbKey: 'employee_id' },
        { payloadKey: 'status', dbKey: 'status' },
        { payloadKey: 'package_price', dbKey: 'total_price' },
        { payloadKey: 'created_at', dbKey: 'created_at' },
      ];

      const updatedMcpFields: Partial<MemberCarePackages> = {};
      mcpMapping.forEach((m) => {
        if (m.payloadKey in payload) {
          const payloadValue = payload[m.payloadKey as keyof emulatePayload];
          const existingValue = oldMcp[0][m.dbKey as keyof MemberCarePackages];
          const processedPayloadValue = m.transform ? m.transform(payloadValue) : payloadValue;

          if (processedPayloadValue !== undefined && processedPayloadValue !== existingValue) {
            updatedMcpFields[m.dbKey as keyof MemberCarePackages] = processedPayloadValue;
          }
        }
      });

      const newMcp: Partial<MemberCarePackages> = {
        ...updatedMcpFields,
        updated_at: payload.updated_at || new Date().toISOString(),
      };

      const newMcpd: Partial<MemberCarePackagesDetails>[] = [];
      const newMcptl: Partial<MemberCarePackageTransactionLogs>[] = [];

      (payload.services || []).forEach((servicePayload) => {
        const tempMcpd = {
          id: oldMcpd[0].id,
          member_care_package_id: oldMcp[0].id!,
          service_id: servicePayload.id,
          service_name: servicePayload.name,
          quantity: servicePayload.quantity,
          discount: servicePayload.discount,
          price: servicePayload.finalPrice,
          status: oldMcp[0].status,
        };
        newMcpd.push(tempMcpd);

        // New Logs
        newMcptl.push({
          id: oldMcptl[0].id,
          type: 'PURCHASE',
          description: tempMcpd.service_name,
          transaction_date: oldMcptl[0].transaction_date,
          transaction_amount: servicePayload.finalPrice * servicePayload.quantity,
          amount_changed: servicePayload.finalPrice * servicePayload.quantity,
          member_care_package_details_id: tempMcpd.id,
          employee_id: payload.employee_id,
          service_id: servicePayload.id,
          created_at: payload.updated_at,
        });
      });

      return {
        old: {
          member_care_packages: oldMcp,
          member_care_package_details: oldMcpd,
          member_care_package_transaction_logs: oldMcptl,
        },
        new: {
          member_care_packages: [newMcp],
          member_care_package_details: newMcpd,
          member_care_package_transaction_logs: newMcptl,
        },
      };
    } catch (error) {
      console.error('Error emulating update member care package:', error);
      if (error instanceof Error) {
        throw new Error(`Error emulating update member care package: ${error.message}`);
      }
      throw new Error('An unknown error occurred while emulating update member care package');
    }
  }

  async function em_delete(payload: emulatePayload) {
    try {
      if (!payload.id) {
        throw new Error('Payload must include an id for the care package to delete.');
      }

      const mcpSql: string = 'SELECT id FROM member_care_packages WHERE id = $1';
      const mcpdSql: string = 'SELECT id FROM member_care_package_details WHERE member_care_package_id = $1';
      const mcptlSql: string =
        'SELECT id FROM member_care_package_transaction_logs WHERE member_care_package_details_id = $1';

      const { rows: mcp, rowCount: mcpCount } = await pool().query<MemberCarePackages>(mcpSql, [payload.id]);
      if (mcpCount === 0) {
        throw new Error(`Member care package with id ${payload.id} not found for deletion.`);
      }

      const { rows: mcpd } = await pool().query(mcpdSql, [mcp[0].id]);
      const { rows: mcptl } = await pool().query(mcptlSql, [mcpd[0].id]);

      return {
        old: {
          member_care_packages: mcp,
          member_care_package_details: mcpd,
          member_care_package_transaction_logs: mcptl,
        },
        new: {
          member_care_packages: [],
          member_care_package_details: [],
          member_care_package_transaction_logs: [],
        },
      };
    } catch (error) {
      console.error('Error emulating delete member care package:', error);
      if (error instanceof Error) {
        throw new Error(`Error emulating delete member care package: ${error.message}`);
      }
      throw new Error('An unknown error occurred while emulating delete member care package');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const handlers: { [key: string]: Function } = {
    POST: em_post,
    PUT: em_put,
    DELETE: em_delete,
  };

  const upperMethod = method.toUpperCase();
  const handler = handlers[upperMethod];

  if (!handler) {
    throw new Error(`Unsupported method: ${method}`);
  }

  if (upperMethod === 'POST') {
    if (
      !payload.package_name ||
      !payload.package_remarks ||
      payload.package_price === undefined ||
      !payload.services ||
      !payload.member_id ||
      !payload.created_at ||
      !payload.updated_at
    ) {
      throw new Error('Missing required fields in payload for POST emulation.');
    }
    return em_post(payload as emulatePayload);
  } else if (upperMethod === 'PUT') {
    if (
      !payload.id ||
      !payload.package_name ||
      !payload.package_remarks ||
      payload.package_price === undefined ||
      !payload.services ||
      !payload.status ||
      !payload.updated_at
    ) {
      throw new Error('Missing required fields in payload for PUT emulation.');
    }
    return em_put(payload as emulatePayload);
  } else if (upperMethod === 'DELETE') {
    if (!payload.id) {
      throw new Error("Missing 'id' in payload for DELETE emulation.");
    }
    return em_delete(payload as emulatePayload);
  } else {
    throw new Error(`Handler dispatch error for method: ${method}`);
  }
};

export default {
  getPaginatedMemberCarePackages,
  getMemberCarePackageById,
  getMemberCarePackagesForDropdown,
  createMemberCarePackage,
  updateMemberCarePackage,
  removeMemberCarePackage,
  deleteMemberCarePackage,
  createConsumption,
  updateMemberCarePackageStatus,
  checkMcpUpdatable,
  transferMemberCarePackage,
  emulateMemberCarePackage,
};
