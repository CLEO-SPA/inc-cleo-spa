import { pool } from '../config/database.js';

const getAllCommissionSettings = async () => {
  try {
    const query = `
      SELECT id, key, value FROM settings
      WHERE type = 'Commission'
    `;
    const result = await pool().query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching commission settings list:', error);
    throw new Error('Error fetching commission settings list');
  }
};

export default {
  getAllCommissionSettings,
};
