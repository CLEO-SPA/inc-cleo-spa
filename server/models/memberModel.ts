import { pool, getProdPool as prodPool } from '../config/database.js';


const getAllMembersForDropdown = async () => {
  try {
    const query = `
      SELECT id, name, contact FROM members
      ORDER BY name ASC
    `;
    const result = await pool().query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching member list:', error);
    throw new Error('Error fetching member list');
  }
};

export default {
  getAllMembersForDropdown
};
