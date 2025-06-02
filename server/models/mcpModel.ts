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
    const { rows: mcp } = await client.query<{ id: string }>(i_mcp_sql, [
      member_id,
      employee_id,
      package_name,
      package_remarks,
      statusId,
      package_price,
      created_at,
      updated_at,
    ]);

    if (!mcp || mcp.length === 0 || !mcp[0].id) {
      throw new Error('Failed to insert member care package or retrieve its ID.');
    }
    const memberCarePackageId = mcp[0].id;

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
                  AND mcptl.type = '${type}'
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

interface emulatePayload {
  id?: string;
  package_name: string;
  member_id: string;
  employee_id?: string;
  user_id?: string;
  package_remarks: string;
  package_price: number;
  services: servicePayload[];
  status_id: string;
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

      const statusSql = 'SELECT get_or_create_status($1) as id';
      const { rows: statusRows } = await pool().query<{ id: string }>(statusSql, ['ENABLED']);
      if (statusRows.length === 0 || !statusRows[0].id) {
        throw new Error('Failed to get or create status ID.');
      }
      const statusId = statusRows[0].id;

      payload.employee_id =
        payload.employee_id || (await getEmployeeIdByUserAuthId(payload.user_id as string)).rows[0].id;

      const newMcp: MemberCarePackages = {
        id: (lastMcpId + 1).toString(),
        member_id: payload.member_id,
        employee_id: payload.employee_id,
        package_name: payload.package_name,
        package_remarks: payload.package_remarks,
        status_id: statusId,
        total_price: payload.package_price,
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
            status_id: statusId,
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
        { payloadKey: 'status_id', dbKey: 'status_id' },
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
          status_id: oldMcp[0].status_id,
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
      !payload.status_id ||
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
  createMemberCarePackage,
  updateMemberCarePackage,
  removeMemberCarePackage,
  deleteMemberCarePackage,
  enableMemberCarePackage,
  checkMcpUpdatable,
  emulateMemberCarePackage,
};
