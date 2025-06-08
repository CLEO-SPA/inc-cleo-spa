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
          s.service_created_at,
          s.service_updated_at,
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

// get id, service_name for dropdown, sorted by service_name
const getAllServicesForDropdown = async () => {
  try {
    const query = `
      SELECT id, service_name FROM services
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
        SELECT 
            s.id,
            s.service_name,
            s.service_description,
            s.service_remarks,
            s.service_duration,
            s.service_price,
            s.service_is_enabled,
            s.service_created_at,
            s.service_updated_at,
            s.service_category_id,
            s.service_sequence_no,
            s.created_by,
            s.updated_by,
            
            -- Category information
            sc.service_category_name,
            
            -- Creator information
            em_c.employee_name as created_by,
            
            -- Updater information
            em_u.employee_name as updated_by
            
        FROM public.services s
        LEFT JOIN service_categories AS sc ON s.service_category_id = sc.id
        INNER JOIN employees AS em_c ON s.created_by = em_c.id
        INNER JOIN employees AS em_u ON s.updated_by = em_u.id
        WHERE s.id = $1; 
    `;
    const result = await pool().query(query, [id]); // Added id parameter to query
    return result.rows;
  } catch (error) {
    console.error('Error fetching service by id:', error);
    throw new Error('Error fetching service by id');
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
            s.service_created_at,
            s.service_updated_at,
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

export default {
  getAllServices,
  getAllServicesForDropdown,
  getServiceById,
  getEnabledServiceById,
};
