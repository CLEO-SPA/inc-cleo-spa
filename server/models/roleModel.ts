import { getProdPool as pool } from '../config/database.js';

const getUserRoles = async (userId: string) => {
  try {
    const query = `
      SELECT r.role_name 
      FROM roles r
      JOIN user_to_role utr ON r.id = utr.role_id
      WHERE utr.user_auth_id = $1
    `;
    const values = [userId];
    const result = await pool().query(query, values);

    result.rows.forEach((row) => {
      row.role_name = row.role_name.toLowerCase().replace(' ', '_');
    });

    // Return array of role names
    return result.rows.map((row) => row.role_name);
  } catch (error) {
    console.error('Error fetching user roles:', error);
    throw new Error('Error fetching user roles');
  }
};

export default {
  getUserRoles,
};
