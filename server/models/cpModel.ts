import { pool } from '../config/database.js';
import { FieldMapping, PaginatedOptions, PaginatedReturn } from '../types/common.types.js';
import { CarePackageItemDetails, CarePackages, Employees } from '../types/model.types.js';
import { encodeCursor } from '../utils/cursorUtils.js';
import { getEmployeeIdByUserAuthId } from './employeeModel.js';

const getPaginatedCarePackages = async (
  limit: number,
  options: PaginatedOptions = {},
  start_date_utc: string | undefined | null,
  end_date_utc: string
): Promise<PaginatedReturn<CarePackages>> => {
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
  } catch (error: unknown) {
    console.error('Error in CarePackageModel.getPaginatedCarePackages (with PG function):', error);
    throw new Error('Could not retrieve paginated care packages.');
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

interface servicePayload {
  id: string;
  name: string;
  quantity: number;
  price: number;
  finalPrice: number;
  discount: number;
}

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
    const v_status_sql = 'SELECT get_or_create_status($1) as id';

    const [employeeResult, statusResult] = await Promise.all([
      client.query<Employees>(v_employee_sql, [employee_id]),
      client.query<{ id: string }>(v_status_sql, ['ENABLED']),
    ]);

    if (employeeResult.rowCount === 0) {
      throw new Error(`Invalid employee_id: ${employee_id} does not exist.`);
    }
    if (!statusResult.rows || statusResult.rows.length === 0 || !statusResult.rows[0].id) {
      throw new Error('Failed to get or create status ID.');
    }
    const statusId = statusResult.rows[0].id;

    const i_cp_sql = `
      INSERT INTO care_packages
      (care_package_name, care_package_remarks, care_package_price, care_package_customizable, status_id, created_by, last_updated_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;
    `;
    const { rows: cpRows } = await client.query<{ id: string }>(i_cp_sql, [
      package_name,
      package_remarks,
      package_price,
      is_customizable,
      statusId,
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
    const v_status_sql = 'SELECT get_or_create_status($1) as id';

    const [employeeResult, statusResult] = await Promise.all([
      client.query<Employees>(v_employee_sql, [employee_id]),
      client.query<{ id: string }>(v_status_sql, ['ENABLED']),
    ]);

    if (employeeResult.rowCount === 0) {
      throw new Error(`Invalid employee_id: ${employee_id} does not exist.`);
    }
    if (!statusResult.rows || statusResult.rows.length === 0 || !statusResult.rows[0].id) {
      throw new Error('Failed to get or create status ID.');
    }
    const statusId = statusResult.rows[0].id;

    // update care package main details
    const u_cp_sql = `
      UPDATE care_packages 
      SET care_package_name = $1, 
          care_package_remarks = $2, 
          care_package_price = $3, 
          care_package_customizable = $4, 
          status_id = $5, 
          last_updated_by = $6, 
          updated_at = $7
      WHERE id = $8
    `;

    await client.query(u_cp_sql, [
      package_name,
      package_remarks,
      package_price,
      is_customizable,
      statusId,
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

const deleteCarePackageById = async (carePackageId: string) => {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');

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
  status_id: string;
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

      const statusSql = 'SELECT get_or_create_status($1) as id';
      const { rows: statusRows } = await pool().query<{ id: string }>(statusSql, ['ENABLED']);
      if (statusRows.length === 0 || !statusRows[0].id) {
        throw new Error('Failed to get or create status ID.');
      }
      const statusId = statusRows[0].id;

      payload.employee_id =
        payload.employee_id || (await getEmployeeIdByUserAuthId(payload.user_id as string)).rows[0].id;

      const newCp: CarePackages = {
        id: (lastCpId + 1).toString(),
        care_package_name: payload.package_name,
        care_package_remarks: payload.package_remarks,
        care_package_price: payload.package_price,
        care_package_customizable: payload.is_customizable,
        status_id: statusId,
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
        { payloadKey: 'status_id', dbKey: 'status_id' },
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
  getPaginatedCarePackages,
  getCarePackageById,
  createCarePackage,
  updateCarePackageById,
  deleteCarePackageById,
  emulateCarePackage,
};
