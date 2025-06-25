/* eslint-disable @typescript-eslint/no-explicit-any */
import { PoolClient } from 'pg';
import { pool } from '../config/database.js';
import { CursorPayload, FieldMapping, PaginatedOptions, PaginatedReturn } from '../types/common.types.js';
import { CarePackageItemDetails, CarePackages, Employees } from '../types/model.types.js';
import { encodeCursor } from '../utils/cursorUtils.js';
import { getEmployeeIdByUserAuthId } from './employeeModel.js';

const getPaginatedCarePackages = async (
  limit: number,
  options: PaginatedOptions = {},
  start_date_utc: string | undefined | null,
  end_date_utc: string | undefined | null
): Promise<PaginatedReturn<CarePackages>> => {
  const { searchTerm } = options;
  const after = options.after || null;
  const before = options.before || null;
  const page = options.page;

  try {
    const client = await pool().connect();
    try {
      const { filterWhereClause, filterParams, paramCounter } = buildCpFilterConditions(
        searchTerm,
        start_date_utc,
        end_date_utc
      );

      const totalCount = await getCpTotalCount(client, filterWhereClause, filterParams);

      const { finalWhereClause, cursorParams, orderBy, effectiveLimit } = prepareCpPaginationParams(
        filterWhereClause,
        filterParams,
        paramCounter,
        limit,
        page,
        after,
        before
      );

      const dataQuery = buildCpDataQuery(finalWhereClause, orderBy, page, limit, effectiveLimit);

      const { rows: rawResults } = await client.query(dataQuery, cursorParams);
      const actualFetchedCount = rawResults.length;

      const { carePackages, hasNextPage, hasPreviousPage } = processCpPaginationResults(
        rawResults,
        before,
        after,
        page,
        limit,
        totalCount,
        actualFetchedCount
      );

      const { startCursor, endCursor } = generateCpCursors(carePackages);

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
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in CarePackageModel.getPaginatedCarePackages:', error);
    throw new Error('Could not retrieve paginated care packages.');
  }
};

function buildCpFilterConditions(
  searchTerm: string | null | undefined,
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
      `(cp.care_package_name ILIKE $${paramCounter} OR cp.care_package_remarks ILIKE $${paramCounter})`
    );
    filterParams.push(`%${searchTerm}%`);
    paramCounter++;
  }

  if (start_date_utc) {
    filterConditions.push(`cp.created_at >= $${paramCounter}`);
    filterParams.push(start_date_utc);
    paramCounter++;
  }

  if (end_date_utc) {
    filterConditions.push(`cp.created_at <= $${paramCounter}`);
    filterParams.push(end_date_utc);
    paramCounter++;
  }

  const filterWhereClause = filterConditions.length > 0 ? `WHERE ${filterConditions.join(' AND ')}` : '';
  return { filterWhereClause, filterParams, paramCounter };
}

async function getCpTotalCount(client: PoolClient, filterWhereClause: string, filterParams: any[]): Promise<number> {
  const countQuery = `SELECT COUNT(*) FROM care_packages cp ${filterWhereClause}`;
  const { rows } = await client.query<{ count: string }>(countQuery, filterParams);
  return parseInt(rows[0].count, 10);
}

function prepareCpPaginationParams(
  filterWhereClause: string,
  filterParams: any[],
  paramCounter: number,
  limit: number,
  page: number | null | undefined,
  after: CursorPayload | null,
  before: CursorPayload | null
): {
  finalWhereClause: string;
  cursorParams: any[];
  orderBy: string;
  effectiveLimit: number;
} {
  let finalWhereClause = filterWhereClause;
  let orderBy = 'ORDER BY cp.created_at ASC, cp.id ASC';
  let cursorParams = [...filterParams];
  let effectiveLimit = page && page > 0 ? limit : limit + 1;

  if (!page && (after || before)) {
    if (finalWhereClause) {
      finalWhereClause += ' AND ';
    } else {
      finalWhereClause = 'WHERE ';
    }

    if (after) {
      finalWhereClause += `(cp.created_at > $${paramCounter} OR (cp.created_at = $${paramCounter} AND cp.id > $${
        paramCounter + 1
      }))`;
      cursorParams.push(after.createdAt, after.id);
    } else if (before) {
      finalWhereClause += `(cp.created_at < $${paramCounter} OR (cp.created_at = $${paramCounter} AND cp.id < $${
        paramCounter + 1
      }))`;
      cursorParams.push(before.createdAt, before.id);
      orderBy = 'ORDER BY cp.created_at DESC, cp.id DESC';
    }
  }

  return { finalWhereClause, cursorParams, orderBy, effectiveLimit };
}

function buildCpDataQuery(
  finalWhereClause: string,
  orderBy: string,
  page: number | null | undefined,
  limit: number,
  effectiveLimit: number
): string {
  return `
    SELECT cp.*
    FROM care_packages cp
    ${finalWhereClause}
    ${orderBy}
    ${page && page > 0 ? `OFFSET ${(page - 1) * limit}` : ''}
    LIMIT ${effectiveLimit}
  `;
}

function processCpPaginationResults(
  rawResults: any[],
  before: CursorPayload | null,
  after: CursorPayload | null,
  page: number | null | undefined,
  limit: number,
  totalCount: number,
  actualFetchedCount: number
): {
  carePackages: CarePackages[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
} {
  let carePackages = before && !page ? [...rawResults].reverse().slice(0, limit) : rawResults.slice(0, limit);

  let hasNextPage = false;
  let hasPreviousPage = false;

  if (page && page > 0) {
    hasNextPage = page * limit < totalCount;
    hasPreviousPage = page > 1;
  } else if (before) {
    hasNextPage = carePackages.length > 0;
    hasPreviousPage = actualFetchedCount > limit;
  } else if (after) {
    hasNextPage = actualFetchedCount > limit;
    hasPreviousPage = true;
  } else {
    hasNextPage = actualFetchedCount > limit;
    hasPreviousPage = false;
  }

  return { carePackages, hasNextPage, hasPreviousPage };
}

function generateCpCursors(carePackages: CarePackages[]): {
  startCursor: string | null;
  endCursor: string | null;
} {
  let startCursor = null;
  let endCursor = null;

  if (carePackages.length > 0) {
    const firstItem = carePackages[0];
    const lastItem = carePackages[carePackages.length - 1];
    startCursor = encodeCursor(new Date(firstItem.created_at), firstItem.id!);
    endCursor = encodeCursor(new Date(lastItem.created_at), lastItem.id!);
  }

  return { startCursor, endCursor };
}

const getCarePackagesForDropdown = async (): Promise<CarePackages[]> => {
  try {
    const sql = `
      SELECT cp.id, cp.care_package_name
      FROM care_packages cp
      WHERE cp.status = 'ENABLED'
      ORDER BY cp.created_at DESC;
    `;

    const { rows } = await pool().query(sql);

    return rows;
  } catch (error) {
    console.error('Error in cpModel.getAllCarePackages (with details):', error);
    throw new Error('Could not retrieve all care packages with details');
  }
};

interface CarePackagePurchaseCount {
  id: string;
  care_package_name: string;
  purchase_count: string;
  is_purchased: string;
}

const getCarePackagePurchaseCount = async (): Promise<
  Record<number, { purchase_count: number; is_purchased: string }>
> => {
  try {
    const sql = `
      SELECT 
        cp.id,
        cp.care_package_name,
        COUNT(mcp.id) AS purchase_count,
        CASE 
            WHEN COUNT(mcp.id) > 0 THEN 'Yes'
            ELSE 'No'
        END AS is_purchased
      FROM public.care_packages cp
      LEFT JOIN public.member_care_packages mcp 
          ON cp.care_package_name = mcp.package_name
          AND mcp.status = 'ENABLED'
      GROUP BY 
          cp.id,
          cp.care_package_name
      ORDER BY 
          purchase_count DESC,
          cp.care_package_name;
    `;

    const { rows } = await pool().query<CarePackagePurchaseCount>(sql);
    const purchaseCountsMap: Record<number, { purchase_count: number; is_purchased: string }> = {};

    rows.forEach((row) => {
      const id = parseInt(row.id.toString());

      purchaseCountsMap[id] = {
        purchase_count: parseInt(row.purchase_count.toString()),
        is_purchased: row.is_purchased,
      };
    });

    return purchaseCountsMap;
  } catch (error) {
    console.error('Error in getCarePackagePurchaseCounts:', error);
    throw new Error('Could not retrieve care package purchase counts');
  }
};

interface FullCarePackage {
  package: CarePackages;
  details: CarePackageItemDetails[];
}

const getCarePackageById = async (id: string): Promise<FullCarePackage | null> => {
  try {
    const cpSql = 'SELECT get_cp_by_id($1) as data';
    const { rows } = await pool().query<{ data: FullCarePackage }>(cpSql, [id]);

    if (rows.length === 0 || !rows[0].data) {
      return null;
    }

    return rows[0].data;
  } catch (error) {
    console.error('Error in CarePackageModel.getCarePackageById:', error);
    throw new Error('Could not retrieve care package by id');
  }
};

// NOTE: price is original price of service, finalPrice is price x discount
interface servicePayload {
  id: string;
  name: string;
  quantity: number;
  price: number;
  finalPrice: number;
  discount: number;
}

const checkPackageNameExists = async (packageName: string, excludeId?: string): Promise<boolean> => {
  const client = await pool().connect();
  try {
    let query = 'SELECT id FROM care_packages WHERE LOWER(TRIM(care_package_name)) = LOWER(TRIM($1))';
    const params: any[] = [packageName];

    // if we're editing an existing package, exclude it from the check
    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId);
    }

    const result = await client.query(query, params);
    return (result.rowCount ?? 0) > 0;   
  } catch (error) {
    console.error('Error checking package name existence:', error);
    throw new Error('Failed to check package name uniqueness');
  } finally {
    client.release();
  }
};

const createCarePackage = async (
  package_name: string,
  package_remarks: string,
  package_price: number,
  services: servicePayload[],
  is_customizable: boolean,
  employee_id: string,
  created_at: string,
  updated_at: string
) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    const v_employee_sql = 'SELECT id FROM employees WHERE id = $1';

    const employeeResult = await client.query<Employees>(v_employee_sql, [employee_id]);

    if (employeeResult.rowCount === 0) {
      throw new Error(`Invalid employee_id: ${employee_id} does not exist.`);
    }

    const i_cp_sql = `
      INSERT INTO care_packages
      (care_package_name, care_package_remarks, care_package_price, care_package_customizable, status, created_by, last_updated_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;
    `;
    const { rows: cpRows } = await client.query<{ id: string }>(i_cp_sql, [
      package_name,
      package_remarks,
      package_price,
      is_customizable,
      'ENABLED',
      employee_id,
      employee_id,
      created_at,
      updated_at,
    ]);

    if (!cpRows || cpRows.length === 0 || !cpRows[0].id) {
      throw new Error('Failed to insert care package or retrieve its ID.');
    }
    const carePackageId = cpRows[0].id;

    const i_cpid_sql = `
      INSERT INTO care_package_item_details
      (care_package_item_details_quantity, care_package_item_details_discount, care_package_item_details_price, service_id, care_package_id)
      VALUES ($1, $2, $3, $4, $5) RETURNING id;
    `;

    const serviceProcessingPromise = services.map(async (service) => {
      await client.query<{ id: string }>(i_cpid_sql, [
        service.quantity,
        service.discount,
        service.finalPrice,
        service.id,
        carePackageId,
      ]);
    });

    await Promise.all(serviceProcessingPromise);

    await client.query('COMMIT');

    return {
      carePackageId: carePackageId,
    };
  } catch (error) {
    console.error('Error creating care package:', error);
    await client.query('ROLLBACK');
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while creating the care package.');
  } finally {
    client.release();
  }
};

const updateCarePackageById = async (
  care_package_id: string,
  package_name: string,
  package_remarks: string,
  package_price: number,
  services: servicePayload[],
  is_customizable: boolean,
  employee_id: string,
  updated_at: string
) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    // validate that the care package exists
    const v_cp_sql = 'SELECT id FROM care_packages WHERE id = $1';
    const cpResult = await client.query(v_cp_sql, [care_package_id]);

    if (cpResult.rowCount === 0) {
      throw new Error(`Care package with ID ${care_package_id} does not exist.`);
    }

    // validate employee exists
    const v_employee_sql = 'SELECT id FROM employees WHERE id = $1';

    const employeeResult = await client.query<Employees>(v_employee_sql, [employee_id]);

    if (employeeResult.rowCount === 0) {
      throw new Error(`Invalid employee_id: ${employee_id} does not exist.`);
    }

    // update care package main details
    const u_cp_sql = `
      UPDATE care_packages 
      SET care_package_name = $1, 
          care_package_remarks = $2, 
          care_package_price = $3, 
          care_package_customizable = $4, 
          status = $5, 
          last_updated_by = $6, 
          updated_at = $7
      WHERE id = $8
    `;

    await client.query(u_cp_sql, [
      package_name,
      package_remarks,
      package_price,
      is_customizable,
      'ENABLED',
      employee_id,
      updated_at,
      care_package_id,
    ]);

    // delete existing care package item details
    const d_cpid_sql = 'DELETE FROM care_package_item_details WHERE care_package_id = $1';
    await client.query(d_cpid_sql, [care_package_id]);

    // insert new care package item details
    const i_cpid_sql = `
      INSERT INTO care_package_item_details
      (care_package_item_details_quantity, care_package_item_details_discount, care_package_item_details_price, service_id, care_package_id)
      VALUES ($1, $2, $3, $4, $5) RETURNING id;
    `;

    const serviceProcessingPromise = services.map(async (service) => {
      await client.query<{ id: string }>(i_cpid_sql, [
        service.quantity,
        service.discount,
        service.finalPrice,
        service.id,
        care_package_id,
      ]);
    });

    await Promise.all(serviceProcessingPromise);

    await client.query('COMMIT');

    return {
      carePackageId: care_package_id,
      message: 'Care package updated successfully',
    };
  } catch (error) {
    console.error('Error updating care package:', error);
    await client.query('ROLLBACK');
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while updating the care package.');
  } finally {
    client.release();
  }
};

const updateCarePackageStatusById = async (
  care_package_id: string,
  status: 'ENABLED' | 'DISABLED',
  employee_id: string,
  updated_at: string
) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    // validate that the care package exists
    const v_cp_sql = 'SELECT id FROM care_packages WHERE id = $1';
    const cpResult = await client.query(v_cp_sql, [care_package_id]);

    if (cpResult.rowCount === 0) {
      throw new Error(`Care package with ID ${care_package_id} does not exist.`);
    }

    // validate employee exists
    const v_employee_sql = 'SELECT id FROM employees WHERE id = $1';
    const employeeResult = await client.query(v_employee_sql, [employee_id]);

    if (employeeResult.rowCount === 0) {
      throw new Error(`Invalid employee_id: ${employee_id} does not exist.`);
    }

    // update only the status and tracking fields
    const u_status_sql = `
      UPDATE care_packages 
      SET status = $1, 
          last_updated_by = $2, 
          updated_at = $3
      WHERE id = $4
    `;

    await client.query(u_status_sql, [status, employee_id, updated_at, care_package_id]);

    await client.query('COMMIT');

    return {
      carePackageId: care_package_id,
      message: 'Care package status updated successfully',
      status: status,
    };
  } catch (error) {
    console.error('Error updating care package status:', error);
    await client.query('ROLLBACK');
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while updating the care package status.');
  } finally {
    client.release();
  }
};

const deleteCarePackageById = async (carePackageId: string) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

    const allPurchaseCounts = await getCarePackagePurchaseCount();

    if (allPurchaseCounts[parseInt(carePackageId)] && allPurchaseCounts[parseInt(carePackageId)].purchase_count > 0) {
      throw new Error('Cannot Delete Purchased CarePackage');
    }
    // delete care package item details first (foreign key constraint)
    const d_cpid_sql = 'DELETE FROM care_package_item_details WHERE care_package_id = $1';
    await client.query(d_cpid_sql, [carePackageId]);

    // delete the care package
    const d_cp_sql = 'DELETE FROM care_packages WHERE id = $1 RETURNING id';
    const result = await client.query<{ id: string }>(d_cp_sql, [carePackageId]);

    if (result.rowCount === 0) {
      throw new Error(`Care package with ID ${carePackageId} does not exist.`);
    }

    await client.query('COMMIT');

    return {
      message: 'Care package deleted successfully.',
      deletedCarePackageId: carePackageId,
    };
  } catch (error) {
    console.error('Error deleting care package:', error);
    await client.query('ROLLBACK');
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while deleting the care package.');
  } finally {
    client.release();
  }
};

interface emulatePayload {
  id?: string;
  package_name: string;
  package_remarks: string;
  package_price: number;
  services: servicePayload[];
  is_customizable: boolean;
  status: 'ENABLED' | 'DISABLED';
  created_at: string;
  updated_at: string;
  employee_id?: string;
  user_id?: string;
}

const emulateCarePackage = async (method: string, payload: Partial<emulatePayload>) => {
  async function em_post(payload: emulatePayload) {
    try {
      const lastCpSql: string = 'SELECT * FROM care_packages ORDER BY id DESC LIMIT 1';
      const { rows: cpRows } = await pool().query<CarePackages>(lastCpSql);
      const lastCp: CarePackages | undefined = cpRows[0];
      const lastCpId = lastCp && lastCp.id ? parseInt(lastCp.id) : 0;

      payload.employee_id =
        payload.employee_id || (await getEmployeeIdByUserAuthId(payload.user_id as string)).rows[0].id;

      const newCp: CarePackages = {
        id: (lastCpId + 1).toString(),
        care_package_name: payload.package_name,
        care_package_remarks: payload.package_remarks,
        care_package_price: payload.package_price,
        care_package_customizable: payload.is_customizable,
        status: 'ENABLED',
        created_by: payload.employee_id,
        last_updated_by: payload.employee_id,
        created_at: payload.created_at || new Date().toISOString(),
        updated_at: payload.updated_at || new Date().toISOString(),
      };

      let oldCpItemDetails: CarePackageItemDetails[] = [];
      const newCpItemDetails: CarePackageItemDetails[] = [];

      if (payload.services && payload.services.length > 0) {
        const lastCpItemDetailsSql: string = 'SELECT * FROM care_package_item_details ORDER BY id DESC LIMIT 1';
        const { rows: itemRows } = await pool().query<CarePackageItemDetails>(lastCpItemDetailsSql);
        oldCpItemDetails = itemRows;
        const lastCpItemDetailsId = itemRows[0] && itemRows[0].id ? parseInt(itemRows[0].id) : 0;

        payload.services.forEach((service, idx) => {
          newCpItemDetails.push({
            id: (lastCpItemDetailsId + idx + 1).toString(),
            care_package_id: newCp.id!,
            service_id: service.id,
            care_package_item_details_quantity: service.quantity,
            care_package_item_details_discount: service.discount,
            care_package_item_details_price: service.price,
          });
        });
      }

      return {
        old: {
          care_packages: cpRows,
          care_package_item_details: oldCpItemDetails,
        },
        new: {
          care_packages: [newCp],
          care_package_item_details: newCpItemDetails,
        },
      };
    } catch (error) {
      console.error('Error emulating create care package:', error);
      if (error instanceof Error) {
        throw new Error(`Error emulating create care package: ${error.message}`);
      }
      throw new Error('An unknown error occurred while emulating create care package');
    }
  }

  async function em_put(payload: emulatePayload) {
    try {
      if (!payload.id) {
        throw new Error('Payload must include an id for the care package to update.');
      }

      const cpSql: string = 'SELECT * FROM care_packages WHERE id = $1';
      const cpItemDetailsSql: string = 'SELECT * FROM care_package_item_details WHERE care_package_id = $1';

      const { rows: cpRows } = await pool().query<CarePackages>(cpSql, [payload.id]);
      if (cpRows.length === 0) {
        throw new Error(`Care package with id ${payload.id} not found for update.`);
      }
      const oldCarePackage: CarePackages = cpRows[0];

      const { rows: oldCpItemDetails } = await pool().query<CarePackageItemDetails>(cpItemDetailsSql, [
        oldCarePackage.id,
      ]);

      payload.employee_id =
        payload.employee_id || (await getEmployeeIdByUserAuthId(payload.user_id as string)).rows[0].id;

      const fieldMappings: FieldMapping<emulatePayload, CarePackages>[] = [
        { payloadKey: 'package_name', dbKey: 'care_package_name' },
        { payloadKey: 'package_remarks', dbKey: 'care_package_remarks' },
        { payloadKey: 'package_price', dbKey: 'care_package_price' },
        { payloadKey: 'is_customizable', dbKey: 'care_package_customizable' },
        { payloadKey: 'status', dbKey: 'status' },
        { payloadKey: 'created_at', dbKey: 'created_at' },
        { payloadKey: 'updated_at', dbKey: 'updated_at' },
        { payloadKey: 'employee_id', dbKey: 'created_by' },
        { payloadKey: 'employee_id', dbKey: 'last_updated_by' },
      ];

      const updatedCpFields: Partial<CarePackages> = {};
      fieldMappings.forEach((m) => {
        if (m.payloadKey in payload) {
          const payloadValue = payload[m.payloadKey as keyof emulatePayload];
          const existingValue = oldCarePackage[m.dbKey as keyof CarePackages];
          const processedPayloadValue = m.transform ? m.transform(payloadValue) : payloadValue;

          if (processedPayloadValue !== undefined && processedPayloadValue !== existingValue) {
            updatedCpFields[m.dbKey as keyof CarePackages] = processedPayloadValue;
          }
        }
      });

      const newCp: Partial<CarePackages> = {
        // ...oldCarePackage,
        ...updatedCpFields,
        updated_at: payload.updated_at || new Date().toISOString(), // Ensure updated_at is always fresh
      };

      const newCpItemDetails: Partial<CarePackageItemDetails>[] = [];

      const serviceItemMappings: FieldMapping<servicePayload, CarePackageItemDetails>[] = [
        { payloadKey: 'quantity', dbKey: 'care_package_item_details_quantity' },
        { payloadKey: 'discount', dbKey: 'care_package_item_details_discount' },
        { payloadKey: 'finalPrice', dbKey: 'care_package_item_details_price' },
      ];

      (payload.services || []).forEach((servicePayloadItem) => {
        const existingItem = oldCpItemDetails.find(
          (oldItem) => oldItem.service_id === servicePayloadItem.id && oldItem.care_package_id === oldCarePackage.id!
        );

        if (!existingItem) {
          newCpItemDetails.push({
            care_package_id: oldCarePackage.id!,
            service_id: servicePayloadItem.id,
            care_package_item_details_quantity: servicePayloadItem.quantity,
            care_package_item_details_discount: servicePayloadItem.discount,
            care_package_item_details_price: servicePayloadItem.price,
          });
        } else {
          const updatedDetailFields: Partial<CarePackageItemDetails> = {
            id: existingItem.id,
            care_package_id: oldCarePackage.id!,
            service_id: servicePayloadItem.id,
          };
          let hasChanges = false;

          serviceItemMappings.forEach((m) => {
            // Ensure the keys exist on both objects before comparison
            const payloadValue = servicePayloadItem[m.payloadKey];
            const existingDbValue = existingItem[m.dbKey];

            if (payloadValue !== undefined && payloadValue !== existingDbValue) {
              (updatedDetailFields as any)[m.dbKey] = payloadValue;
              hasChanges = true;
            }
          });

          if (hasChanges) {
            newCpItemDetails.push(updatedDetailFields);
          }
        }
      });

      return {
        old: {
          care_packages: [oldCarePackage],
          care_package_item_details: oldCpItemDetails,
        },
        new: {
          care_packages: [newCp],
          care_package_item_details: newCpItemDetails,
        },
      };
    } catch (error) {
      console.error('Error emulating update care package:', error);
      if (error instanceof Error) {
        throw new Error(`Error emulating update care package: ${error.message}`);
      }
      throw new Error('An unknown error occurred while emulating update care package');
    }
  }

  async function em_delete(payload: emulatePayload) {
    try {
      if (!payload.id) {
        throw new Error('Payload must include an id for the care package to delete.');
      }

      const cpSql: string = 'SELECT * FROM care_packages WHERE id = $1';
      const cpItemDetailsSql: string = 'SELECT * FROM care_package_item_details WHERE care_package_id = $1';

      const { rows: cpRows } = await pool().query<CarePackages>(cpSql, [payload.id]);
      if (cpRows.length === 0) {
        throw new Error(`Care package with id ${payload.id} not found for deletion.`);
      }
      const oldCarePackage: CarePackages = cpRows[0];
      const { rows: oldCpItemDetails } = await pool().query<CarePackageItemDetails>(cpItemDetailsSql, [
        oldCarePackage.id,
      ]);

      return {
        old: {
          care_packages: [oldCarePackage],
          care_package_item_details: oldCpItemDetails,
        },
        new: {
          care_packages: [],
          care_package_item_details: [],
        },
      };
    } catch (error) {
      console.error('Error emulating delete care package:', error);
      if (error instanceof Error) {
        throw new Error(`Error emulating delete care package: ${error.message}`);
      }
      throw new Error('An unknown error occurred while emulating delete care package');
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
      typeof payload.is_customizable !== 'boolean' ||
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
      typeof payload.is_customizable !== 'boolean' ||
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
  getPaginatedCarePackages,
  getCarePackagesForDropdown,
  getCarePackageById,
  getCarePackagePurchaseCount,
  createCarePackage,
  updateCarePackageById,
  updateCarePackageStatusById,
  deleteCarePackageById,
  emulateCarePackage,
  checkPackageNameExists,
};
