import { pool, getProdPool as prodPool } from '../config/database.js';
import { createServiceInput, updateServiceInput } from '../types/service.type.js';

// get all services, sorted by sequence number
const getAllServices = async () => {
  try {
    const query = `
      SELECT 
          s.id,
          s.service_name,
          s.service_description,
          s.service_remarks,
          s.service_duration,
          s.service_price,
          s.service_is_enabled,
          s.created_at,
          s.updated_at,
          em_c.employee_name AS created_by,
          em_u.employee_name AS updated_by,
          s.service_category_id,
          s.service_sequence_no,
          sc.service_category_name,
          get_total_sale_transactions(s.service_name) AS total_sale_transactions,
          get_total_care_packages(s.id) AS total_care_packages
      FROM services AS s
      LEFT JOIN service_categories AS sc ON s.service_category_id = sc.id
      INNER JOIN employees AS em_c ON s.created_by = em_c.id
      INNER JOIN employees AS em_u ON s.updated_by = em_u.id
      ORDER BY sc.service_category_sequence_no,
      CASE 
          WHEN s.service_sequence_no = 0 THEN 1
          ELSE 0
      END,
      s.service_sequence_no
    `;
    const result = await pool().query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching all services:', error);
    throw new Error('Error fetching all services');
  }
};

const getServicesPaginationFilter = async (
  page: number,
  limit: number,
  search?: string | null,
  category?: number | null,
  status?: boolean | null
) => {
  try {
    const query = `
      SELECT * FROM get_services_with_pagination(
      $1::INT, 
      $2::INT,
      $3::TEXT,
      $4::BIGINT,
      $5::BOOLEAN
      );`;
    const params = [page, limit, search, category, status];

    const result = await prodPool().query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error in getServicesPaginationFilter:', error);
    throw new Error('Error fetching services with pagination and filter');
  }
};

// get total pages for pagination
const getTotalCount = async (search: string | null, category: number | null, status: boolean | null) => {
  try {
    let query = `SELECT COUNT(*) AS total_count FROM services`;
    const conditions: string[] = [];
    const params: (string | number | boolean)[] = [];

    if (search != null) {
      params.push(search);
      conditions.push(`service_name ILIKE '%' || $${params.length}::TEXT || '%'`);
    }

    if (category != null) {
      params.push(category);
      conditions.push(`service_category_id = $${params.length}::BIGINT`);
    }

    if (status != null) {
      params.push(status);
      conditions.push(`service_is_enabled = $${params.length}::BOOLEAN`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    const result =
      search || category || status !== null ? await prodPool().query(query, params) : await prodPool().query(query);
    if (result.rows.length === 0) {
      return 0; // No services found
    }

    return result.rows[0].total_count;
  } catch (error) {
    console.error('Error in getTotalPages:', error);
    throw new Error('Error fetching total number of pages');
  }
};

// get id, service_name for dropdown, sorted by service_name
const getAllServicesForDropdown = async () => {
  try {
    const query = `
      SELECT id, service_name, service_price FROM services
      WHERE service_is_enabled = true
      ORDER BY service_name ASC
    `;
    const result = await pool().query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching service list:', error);
    throw new Error('Error fetching service list');
  }
};

// get service by id, include both enabled and disabled services
const getServiceById = async (id: number) => {
  try {
    const query = `
        SELECT *
        FROM public.services s
        WHERE s.id = $1; 
    `;
    const result = await pool().query(query, [id]); // Added id parameter to query
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching service by id:', error);
    throw new Error('Error fetching service by id');
  }
};

// get service by name
const getServiceByName = async (service_name: string) => {
  try {
    const query = `
        SELECT 
            s.id,
            s.service_name
        FROM services AS s
        WHERE s.service_name = $1; 
    `;
    const result = await pool().query(query, [service_name]); // Added string parameter to query
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching service by name:', error);
    throw new Error('Error fetching service by name');
  }
};

const getEnabledServiceById = async (id: number) => {
  // Added missing id parameter
  try {
    const query = `
        SELECT 
            s.id,
            s.service_name,
            s.service_description,
            s.service_remarks,
            s.service_duration,
            s.service_price,
            s.service_is_enabled,
            s.created_at,
            s.updated_at,
            s.created_at,
            s.updated_at,
            s.service_category_id,
            s.service_sequence_no,
            s.created_by,
            s.updated_by,
            
            -- Category information
            sc.service_category_name,
            
            -- Creator information
            e1.employee_name as created_by_name,
            
            -- Updater information
            e2.employee_name as updated_by_name
            
        FROM public.services s
        LEFT JOIN public.service_categories sc ON s.service_category_id = sc.id
        LEFT JOIN public.employees e1 ON s.created_by = e1.id
        LEFT JOIN public.employees e2 ON s.updated_by = e2.id
        WHERE s.id = $1 AND s.service_is_enabled = true;
          
    `;
    const result = await pool().query(query, [id]); // Added id parameter to query
    return result.rows;
  } catch (error) {
    console.error('Error fetching service list:', error);
    throw new Error('Error fetching service list');
  }
};

const getServiceSequenceNo = async (service_category_id: number) => {
  try {
    // get sequence number by counting services that are enabled and in same category
    const query = `
    SELECT COUNT(*) + 1 AS seq_no FROM services
    WHERE service_category_id = $1
    AND service_is_enabled = true;`;
    const result = await pool().query(query, [service_category_id]);
    return result.rows[0].seq_no;
  } catch (error) {
    console.error('Error fetching service sequence no:', error);
    throw new Error('Error fetching service sequence no');
  }
};

const getServiceByCategory = async (service_category_id: number) => {
  try {
    const query = `
    SELECT id, service_name, service_sequence_no FROM services
    WHERE service_category_id = $1
    AND service_is_enabled = true
    ORDER BY service_sequence_no ASC;`;
    const result = await pool().query(query, [service_category_id]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching services:', error);
    throw new Error('Error fetching services');
  }
};

const createService = async ({
  service_name,
  service_description,
  service_remarks,
  service_duration,
  service_price,
  service_is_enabled,
  created_at,
  updated_at,
  service_category_id,
  service_sequence_no,
  created_by,
  updated_by,
}: createServiceInput) => {
  try {
    const query = `
      INSERT INTO services (
        service_name,
        service_description,
        service_remarks,
        service_duration,
        service_price,
        service_is_enabled,
        created_at,
        updated_at,
        service_category_id,
        service_sequence_no,
        created_by,
        updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
      RETURNING *;
    `;
    const params = [
      service_name,
      service_description,
      service_remarks,
      service_duration,
      service_price,
      service_is_enabled,
      created_at,
      updated_at,
      service_category_id,
      service_sequence_no,
      created_by,
      updated_by,
    ];
    const result = await pool().query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error creating new service:', error);
    throw new Error('Error creating new service');
  }
};

const updateService = async ({
  id,
  service_name,
  service_description,
  service_remarks,
  service_duration,
  service_price,
  created_at,
  updated_at,
  service_category_id,
  service_sequence_no,
  created_by,
  updated_by,
}: Partial<updateServiceInput>) => {
  try {
    const conditions: string[] = [];
    const params: (string | number | boolean | null)[] = [];
    let index = 1;

    if (service_name) {
      params.push(service_name);
      conditions.push(`service_name = $${index++}`);
    }

    if (service_description != null) {
      params.push(service_description);
      conditions.push(`service_description = $${index++}`);
    }

    if (service_remarks != null) {
      params.push(service_remarks);
      conditions.push(`service_remarks = $${index++}`);
    }

    if (service_duration) {
      params.push(service_duration);
      conditions.push(`service_duration = $${index++}`);
    }

    if (service_price) {
      params.push(service_price);
      conditions.push(`service_price = $${index++}`);
    }

    if (service_category_id) {
      params.push(service_category_id);
      conditions.push(`service_category_id = $${index++}`);
      if (service_sequence_no) {
        params.push(service_sequence_no);
        conditions.push(`service_sequence_no = $${index++}`);
      }
    }

    if (created_at) {
      params.push(created_at);
      conditions.push(`created_at = $${index++}`);
    }

    if (created_by) {
      params.push(created_by);
      conditions.push(`created_by = $${index++}`);
    }

    // Always update updated_at and updated_by
    params.push(updated_at || new Date().toISOString());
    conditions.push(`updated_at = $${index++}`);

    params.push(updated_by || '');
    conditions.push(`updated_by = $${index++}`);

    const query = `UPDATE services SET ${conditions.join(', ')} WHERE id = $${index}
    RETURNING *`;
    params.push(id || 0);

    const result = await prodPool().query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error updating service:', error);
    throw new Error('Error updating service');
  }
};

const reorderServices = async (services: { id: number; service_sequence_no: number }[]) => {
  try {
    const query = `
    UPDATE services
    SET service_sequence_no = $1
    WHERE id = $2`;
    for (const service of services) {
      const params = [service.service_sequence_no, service.id];
      await prodPool().query(query, params);
    }
    return { success: true, updatedCount: services.length };
  } catch (error) {
    console.error('Error updating service sequence:', error);
    throw new Error('Error updating service sequence');
  }
};

const disableService = async (updateData: {
  id: number;
  updated_at: string;
  updated_by: number;
  service_remarks?: string | null;
}) => {
  try {
    let params = [updateData.updated_by, updateData.updated_at, updateData.id];
    let query = `   
    UPDATE services
    SET
      service_is_enabled = false,
      service_sequence_no = 0,
      updated_by = $1,
      updated_at = $2`;

    if (updateData.service_remarks) {
      query += `,
        remarks = $4
      WHERE id = $3
      RETURNING *`;
      params.push(updateData.service_remarks);
    } else {
      query += `
      WHERE id = $3
      RETURNING *`;
    }

    const result = await pool().query(query, params);
    return result.rows[0];
  } catch (error) {
    console.error('Error disabling service:', error);
    throw new Error('Error disabling service');
  }
};

const enableService = async (updateData: {
  id: number;
  updated_at: string;
  updated_by: number;
  service_sequence_no: number;
  service_remarks?: string | null;
}) => {
  try {
    let params = [updateData.service_sequence_no, updateData.updated_by, updateData.updated_at, updateData.id];
    let query = `   
    UPDATE services
    SET
      service_is_enabled = true,
      service_sequence_no = $1,
      updated_by = $2,
      updated_at = $3`;

    if (updateData.service_remarks) {
      query += `,
        remarks = $5
      WHERE id = $4
      RETURNING *`;
      params.push(updateData.service_remarks);
    } else {
      query += `
      WHERE id = $4
      RETURNING *`;
    }

    const result = await pool().query(query, params);
    return result.rows[0];
  } catch (error) {
    console.error('Error enabling service sequence:', error);
    throw new Error('Error enabling service sequence');
  }
};

const getServiceCategories = async () => {
  try {
    const query = `
      SELECT 
        sc.*,
        COUNT(s.id) AS total_services
      FROM service_categories sc
      LEFT JOIN services s ON s.service_category_id = sc.id
      GROUP BY sc.id
      ORDER BY sc.service_category_sequence_no;
    `;
    const result = await pool().query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching service categories:', error);
    throw new Error('Error fetching service categories');
  }
};

const getServiceCategoryById = async (id: number) => {
  try {
    const query = `
        SELECT 
            id,
            service_category_name
        FROM service_categories
        WHERE id = $1; 
    `;
    const result = await pool().query(query, [id]); // Added string parameter to query
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching service category by id:', error);
    throw new Error('Error fetching service category by id');
  }
};

// get sales history by service id, selected month and year
const getSalesHistoryByServiceId = async (id: number, month: number, year: number) => {
  try {
    const salesQuery = `SELECT * FROM get_sales_history_for_each_service($1, $2, $3);`;
    const result = await pool().query(salesQuery, [id, year, month]);

    return result.rows;
  } catch (error) {
    console.error('Error fetching sales history by service ID:', error);
    throw new Error('Error fetching sales history');
  }
};

// create a new service category
const createServiceCategory = async (name: string) => {
  try {
    const query = `SELECT * FROM create_service_category($1)`;
    const result = await pool().query(query, [name]);
    return result.rows;
  } catch (error) {
    console.error('Error creating service category:', error);

    if (error instanceof Error && error.message.includes('Category already exists')) {
      throw new Error('Category already exists');
    }

    throw new Error('Error creating service category');
  }
};

// update service category by id
const updateServiceCategory = async (id: number, name: string) => {
  try {
    const result = await prodPool().query('SELECT * FROM update_service_category($1, $2)', [id, name]);
    return result.rows;
  } catch (error) {
    console.error('Error updating service category:', error);

    if (error instanceof Error && error.message.includes('does not exist')) {
      throw new Error('Category not found');
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      throw new Error('Category already exists');
    }

    throw new Error('Error updating service category');
  }
};

// reorder service category sequence no
const reorderServiceCategory = async (categories: { id: number; service_category_sequence_no: number }[]) => {
  const client = await prodPool().connect();

  try {
    await client.query('BEGIN');

    for (const { id, service_category_sequence_no } of categories) {
      await client.query(
        `UPDATE service_categories
         SET service_category_sequence_no = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [service_category_sequence_no, id]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// get total pages for pagination
const getServiceCategoriesCount = async (search: string | null) => {
  try {
    let query = `SELECT COUNT(*) AS total_count FROM service_categories`;
    const conditions: string[] = [];
    const params: any[] = [];

    if (search != null) {
      params.push(search);
      conditions.push(`service_category_name ILIKE '%' || $${params.length}::TEXT || '%'`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    const result = await pool().query(query, params);
    return result.rows[0].total_count;
  } catch (error) {
    console.error('Error in getServiceCategoriesCount:', error);
    throw new Error('Error fetching category count');
  }
};

// Get service categories with pagination and search filter
const getServiceCategoriesPaginationFilter = async (
  page: number,
  limit: number,
  search: string | null
) => {
  try {
    const offset = (page - 1) * limit;
    const params: any[] = [limit, offset];
    let filterClause = '';

    if (search != null) {
      params.push(`%${search}%`);
      filterClause = `WHERE sc.service_category_name ILIKE $${params.length}::TEXT`;
    }

    const query = `
      SELECT 
        sc.*,
        COUNT(s.id) AS total_services
      FROM service_categories sc
      LEFT JOIN services s ON s.service_category_id = sc.id
      ${filterClause}
      GROUP BY sc.id
      ORDER BY sc.service_category_sequence_no
      LIMIT $1 OFFSET $2;
    `;

    const result = await pool().query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error in getServiceCategoriesPaginationFilter:', error);
    throw new Error('Error fetching service categories with pagination');
  }
};


export default {
  getAllServices,
  getServicesPaginationFilter,
  getTotalCount,
  getAllServicesForDropdown,
  getServiceById,
  getServiceByName,
  getEnabledServiceById,
  getServiceSequenceNo,
  getServiceByCategory,
  createService,
  updateService,
  reorderServices,
  disableService,
  enableService,
  getServiceCategories,
  getServiceCategoryById,
  getSalesHistoryByServiceId,
  createServiceCategory,
  updateServiceCategory,
  reorderServiceCategory,
  getServiceCategoriesCount,
  getServiceCategoriesPaginationFilter
};
