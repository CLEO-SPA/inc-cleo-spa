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

interface commissionPayload {
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
    | 'member_care_package_transaction_logs'
    | 'member_voucher_transaction_logs';
  itemId: string;
  created_at: string;
}

const createEmpCommision = async (data: commissionPayload) => {
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

    console.log('✅ Commission record created:', {
      id: result.rows[0].id,
      itemType: data.itemType,
      itemId: data.itemId,
      employeeId: data.employeeId,
      commissionAmount: data.commissionAmount
    });

    return result;
  } catch (error) {
    throw error;
  }
};

// Helper function to get commission records for reporting (updated for business types)
const getCommissionsByTransaction = async (transactionId: string) => {
  try {
    const query = `
      SELECT 
        ec.*,
        e.employee_name,
        e.employee_code,
        sti.service_name,
        sti.product_name,
        sti.item_type as transaction_item_type
      FROM employee_commissions ec
      JOIN employees e ON ec.employee_id = e.id
      LEFT JOIN sale_transaction_items sti ON ec.item_id = sti.id 
        AND ec.item_type IN ('services', 'products')
      WHERE ec.item_type IN ('services', 'products')
        AND sti.sale_transaction_id = $1
      ORDER BY ec.created_at ASC
    `;

    const result = await pool().query(query, [transactionId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching commission records for transaction:', error);
    throw new Error('Error fetching commission records for transaction');
  }
};

// Helper function to get commission summary by employee
const getCommissionSummaryByEmployee = async (employeeId: string, startDate?: string, endDate?: string) => {
  try {
    let query = `
      SELECT 
        ec.item_type,
        COUNT(*) as commission_count,
        SUM(ec.commission_amount) as total_commission,
        SUM(ec.performance_amount) as total_performance,
        AVG(ec.commission_rate) as avg_commission_rate
      FROM employee_commissions ec
      WHERE ec.employee_id = $1
    `;

    const params = [employeeId];

    if (startDate) {
      params.push(startDate);
      query += ` AND ec.created_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND ec.created_at <= $${params.length}`;
    }

    query += ` GROUP BY ec.item_type ORDER BY total_commission DESC`;

    const result = await pool().query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching commission summary for employee:', error);
    throw new Error('Error fetching commission summary for employee');
  }
};


/**
 * Future Enhancements:
 * - Add validation to ensure item exists before creating commission records.
 * - Implement error handling for cases where item or employee does not exist.
 */

// // Helper function to validate that the referenced item exists
// const validateItemExists = async (client: any, itemType: string, itemId: string) => {
//   let validationQuery = '';
//   let tableName = '';

//   switch (itemType) {
//     // For services and products, we validate against sale_transaction_items
//     case 'services':
//     case 'products':
//       validationQuery = 'SELECT id FROM sale_transaction_items WHERE id = $1';
//       tableName = 'sale_transaction_items';
//       break;
//     case 'member_care_packages':
//       validationQuery = 'SELECT id FROM member_care_packages WHERE id = $1';
//       tableName = 'member_care_packages';
//       break;
//     case 'member_vouchers':
//       validationQuery = 'SELECT id FROM member_vouchers WHERE id = $1';
//       tableName = 'member_vouchers';
//       break;
//     case 'member_care_package_transaction_logs':
//       validationQuery = 'SELECT id FROM member_care_package_transaction_logs WHERE id = $1';
//       tableName = 'member_care_package_transaction_logs';
//       break;
//     case 'member_voucher_transaction_logs':
//       validationQuery = 'SELECT id FROM member_voucher_transaction_logs WHERE id = $1';
//       tableName = 'member_voucher_transaction_logs';
//       break;
//     default:
//       throw new Error(`Unsupported item type: ${itemType}`);
//   }

//   const result = await client.query(validationQuery, [itemId]);
  
//   if (result.rows.length === 0) {
//     throw new Error(`Item with ID ${itemId} not found in ${tableName} for item_type ${itemType}`);
//   }

//   console.log(' Item validation passed:', { itemType, itemId, tableName });
// };

// // Helper function to validate employee exists
// const validateEmployeeExists = async (client: any, employeeId: string) => {
//   const result = await client.query(
//     'SELECT id, employee_name FROM employees WHERE id = $1',
//     [employeeId]
//   );
  
//   if (result.rows.length === 0) {
//     throw new Error(`Employee with ID ${employeeId} not found`);
//   }

//   console.log('Employee validation passed:', { 
//     employeeId, 
//     employeeName: result.rows[0].employee_name 
//   });
// };

export default {
  getAllCommissionSettings,
  createEmpCommision,
  getCommissionsByTransaction,
  getCommissionSummaryByEmployee
};
