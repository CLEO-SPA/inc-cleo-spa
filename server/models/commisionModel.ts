import { pool } from '../config/database.js';
import { EmployeeCommisions } from '../types/model.types.js';

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

interface commisionPayload {
  employeeId: string;
  performanceRate: number;
  performanceAmount: number;
  commissionRate: number;
  commissionAmount: number;
  remarks: string;
  itemType:
    | 'member_vouchers'
    | 'member_care_packages'
    | 'products'
    | 'services'
    | 'member_care_package_transaction_logs';
  itemId: string;
  created_at: string;
}

const createEmpCommision = async (data: commisionPayload) => {
  try {
    const query = `
        INSERT INTO employee_commissions 
        (item_type, item_id, employee_id, performance_rate, performance_amount, commission_rate, commission_amount, remarks, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;
    `;

    const result = await pool().query<EmployeeCommisions>(query, [
      data.itemType,
      data.itemId,
      data.employeeId,
      data.performanceRate,
      data.performanceAmount,
      data.commissionRate,
      data.commissionAmount,
      data.remarks,
      data.created_at,
    ]);

    return result;
  } catch (error) {
    throw error;
  }
};

export default {
  getAllCommissionSettings,
  createEmpCommision,
};
