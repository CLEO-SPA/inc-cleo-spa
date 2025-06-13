import { pool, getProdPool as prodPool } from '../config/database.js';

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
  search: string | null,
  category: number | null,
  status: boolean | null
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
    const params: any[] = [];

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
    const query = `
    SELECT COUNT(*) AS seq_no FROM services
    WHERE service_category_id = $1;`;
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
    ORDER BY service_sequence_no ASC;`;
    const result = await pool().query(query, [service_category_id]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching services:', error);
    throw new Error('Error fetching services');
  }
};

const createService = async (serviceData: any) => {
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
      serviceData.service_name,
      serviceData.service_description,
      serviceData.service_remarks,
      serviceData.service_duration,
      serviceData.service_price,
      serviceData.service_is_enabled,
      serviceData.created_at,
      serviceData.updated_at,
      serviceData.service_category_id,
      serviceData.service_sequence_no,
      serviceData.created_by,
      serviceData.updated_by,
    ];
    const result = await pool().query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error creating new service:', error);
    throw new Error('Error creating new service');
  }
};

const updateService = async (formData: any) => {
  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let index = 1;

    if (formData.service_name) {
      params.push(formData.service_name);
      conditions.push(`service_name = $${index++}`);
    }

    if (formData.service_description) {
      params.push(formData.service_description);
      conditions.push(`service_description = $${index++}`);
    }

    if (formData.service_remarks) {
      params.push(formData.service_remarks);
      conditions.push(`service_remarks = $${index++}`);
    }

    if (formData.service_duration) {
      params.push(formData.service_duration);
      conditions.push(`service_duration = $${index++}`);
    }

    if (formData.service_price) {
      params.push(formData.service_price);
      conditions.push(`service_price = $${index++}`);
    }

    if (formData.service_category_id) {
      params.push(formData.service_category_id);
      conditions.push(`service_category_id = $${index++}`);
      params.push(formData.service_sequence_no);
      conditions.push(`service_sequence_no = $${index++}`);
    }

    if (formData.created_at) {
      params.push(formData.created_at);
      conditions.push(`created_at = $${index++}`);
    }

    if (formData.created_by) {
      params.push(formData.created_by);
      conditions.push(`created_by = $${index++}`);
    }

    // Always update updated_at and updated_by
    params.push(formData.updated_at || new Date());
    conditions.push(`updated_at = $${index++}`);

    params.push(formData.updated_by || '');
    conditions.push(`updated_by = $${index++}`);

    const query = `UPDATE services SET ${conditions.join(', ')} WHERE id = $${index}
    RETURNING *`;
    params.push(formData.id);

    const result = await prodPool().query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error updating service:', error);
    throw new Error('Error updating service');
  }
};

const reorderServices = async (services: any) => {
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

const disableService = async (updateData: any) => {
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

const enableService = async (updateData: any) => {
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
    SELECT * FROM service_categories
    ORDER BY service_category_sequence_no;`;
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
};
