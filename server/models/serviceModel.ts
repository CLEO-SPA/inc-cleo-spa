import { pool, getProdPool as prodPool } from '../config/database.js';

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

const getEnabledServiceById = async (id: number) => {  // Added missing id parameter
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
    const result = await pool().query(query, [id]);  // Added id parameter to query
    return result.rows;
  } catch (error) {
    console.error('Error fetching service list:', error);
    throw new Error('Error fetching service list');
  }
};

export default {
  getAllServicesForDropdown,
  getEnabledServiceById
};