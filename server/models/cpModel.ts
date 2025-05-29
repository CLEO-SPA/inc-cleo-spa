import { pool } from '../config/database.js';
import { PaginatedOptions, PaginatedReturn } from '../types/common.types.js';
import { CarePackageItemDetails, CarePackageItems, CarePackages } from '../types/model.types.js';
import { encodeCursor } from '../utils/cursorUtils.js';

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

const getCarePackageById = async (id: string) => {
  try {
    const query = `SELECT * FROM care_packages
                  WHERE id = $1`;
    const values = [id];
    const { rows } = await pool().query<CarePackages>(query, values);

    return rows;
  } catch (error) {
    console.error('Error in CarePackageModel.getCarePackageById:', error);
    throw new Error('Could not retrieve care package by id');
  }
};

const createCarePackage = async (
  package_name: string,
  package_remarks: string,
  package_price: number,
  services: object,
  is_customizable: boolean,
  created_at: string,
  updated_at: string
): Promise<number> => {
  const params = [package_name, package_remarks, package_price, !!!is_customizable, services, created_at, updated_at];

  const sqlProcedureQuery = `
      CALL create_care_package(
        p_package_name := $1,
        p_remarks := $2,
        p_price := $3,
        p_customizable := $4,
        p_services := $5,
        p_created_at := $6,
        p_updated_at := $7
      );
    `;
  try {
    const { rows } = await pool().query(sqlProcedureQuery, params);

    console.log(rows);

    return 1;
  } catch (error) {
    console.error('Error in CarePackageModel.createCarePackage:', error);
    throw new Error('Could not create new care package');
  }
};

const updateCarePackageById = async (id: string) => {};

const deleteCarePackageById = async (id: string) => {};

interface emulatePayload {
  id?: string;
  package_name?: string;
  package_remarks?: string;
  package_price?: number;
  services?: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    discount: number;
  }[];
  is_customizable?: boolean;
  status_id?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

interface FieldMapping {
  payloadKey: keyof emulatePayload;
  dbKey: keyof CarePackages;
  transform?: (value: any) => any;
}

const emulateCarePackage = async (method: string, payload: emulatePayload) => {
  const handlers = {
    POST: em_post,
    PUT: em_put,
    DELETE: em_delete,
  };

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

      const newCp: CarePackages = {
        id: (lastCpId + 1).toString(),
        care_package_name: payload.package_name,
        care_package_remarks: payload.package_remarks,
        care_package_price: payload.package_price,
        care_package_customizable: payload.is_customizable,
        status_id: statusId,
        created_by: payload.user_id,
        last_updated_by: payload.user_id,
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
            care_package_id: newCp.id,
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

      const fieldMappings: FieldMapping[] = [
        { payloadKey: 'package_name', dbKey: 'care_package_name' },
        { payloadKey: 'package_remarks', dbKey: 'care_package_remarks' },
        { payloadKey: 'package_price', dbKey: 'care_package_price' },
        { payloadKey: 'is_customizable', dbKey: 'care_package_customizable' },
        { payloadKey: 'status_id', dbKey: 'status_id' },
        { payloadKey: 'created_at', dbKey: 'created_at' },
        { payloadKey: 'updated_at', dbKey: 'updated_at' },
        { payloadKey: 'user_id', dbKey: 'created_by' },
        { payloadKey: 'user_id', dbKey: 'last_updated_by' },
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

      const newCp: CarePackages = {
        ...oldCarePackage,
        ...updatedCpFields,
        updated_at: payload.updated_at || new Date().toISOString(), // Ensure updated_at is always fresh
      };

      const newCpItemDetails: CarePackageItemDetails[] = (payload.services || []).map((servicePayload) => {
        const existingItem = oldCpItemDetails.find((oldItem) => oldItem.service_id === servicePayload.id);
        return {
          id: existingItem ? existingItem.id : undefined, // Reuse DB ID if service matches, else undefined for new
          care_package_id: oldCarePackage.id,
          service_id: servicePayload.id,
          care_package_item_details_quantity: servicePayload.quantity,
          care_package_item_details_discount: servicePayload.discount,
          care_package_item_details_price: servicePayload.price,
        };
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

  const handler = handlers[method.toUpperCase() as keyof typeof handlers];
  if (handler) {
    return handler(payload);
  } else {
    throw new Error(`Unsupported method: ${method}`);
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
