import { pool, withTransaction } from '../config/database.js';
import { EmployeeCommisions } from '../types/model.types.js';

interface CommissionSettingUpdate {
  key: string;
  value: string;
  frontendKey: string;
}

// Key mapping between frontend and database
const KEY_MAPPING = {
  service: 'adhoc_service',
  product: 'adhoc_product',
  package: 'member_care_package_purchase',
  'member-voucher': 'member_voucher_purchase',
  mcpConsumption: 'member_care_package_consumption',
  mvConsumption: 'member_voucher_consumption'
};

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

const updateMultipleCommissionSettings = async (updates: Record<string, number>): Promise<CommissionSettingUpdate[]> => {
  return withTransaction(async (client) => {
    const results: CommissionSettingUpdate[] = [];
    
    for (const [frontendKey, value] of Object.entries(updates)) {
      const dbKey = KEY_MAPPING[frontendKey as keyof typeof KEY_MAPPING];
      
      if (!dbKey) {
        console.warn(` Unknown commission setting key: ${frontendKey}`);
        continue;
      }

      // Validate rate (0-100%)
      if (isNaN(value) || value < 0 || value > 100) {
        throw new Error(`Invalid commission rate for ${frontendKey}: ${value}. Must be between 0 and 100.`);
      }

      // First try to update existing record
      const updateQuery = `
        UPDATE settings 
        SET value = $1 
        WHERE type = 'Commission' AND key = $2
        RETURNING *;
      `;
      
      const updateResult = await client.query(updateQuery, [value.toFixed(2), dbKey]);
      
      if (updateResult.rows.length > 0) {
        // Record was updated
        results.push({
          key: dbKey,
          value: value.toFixed(2),
          frontendKey: frontendKey
        });
      } else {
        // Record doesn't exist, insert new one
        const insertQuery = `
          INSERT INTO settings (type, key, value)
          VALUES ('Commission', $1, $2)
          RETURNING *;
        `;
        
        const insertResult = await client.query(insertQuery, [dbKey, value.toFixed(2)]);
        
        if (insertResult.rows.length > 0) {
          results.push({
            key: dbKey,
            value: value.toFixed(2),
            frontendKey: frontendKey
          });
        }
      }
    }    
    return results;
  });
};

const validateCommissionSettings = (settings: Record<string, any>): { isValid: boolean, errors: string[] } => {
  const errors: string[] = [];
  
  for (const [key, value] of Object.entries(settings)) {
    if (!KEY_MAPPING[key as keyof typeof KEY_MAPPING]) {
      errors.push(`Unknown setting: ${key}`);
      continue;
    }
    
    // Convert string to number if needed
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (typeof numericValue !== 'number' || isNaN(numericValue)) {
      errors.push(`${key} must be a valid number`);
      continue;
    }
    
    if (numericValue < 0) {
      errors.push(`${key} cannot be negative`);
      continue;
    }
    
    if (numericValue > 100) {
      errors.push(`${key} cannot exceed 100%`);
      continue;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
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

const createEmpCommission = async (data: commissionPayload) => {
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
  createEmpCommission,
  getCommissionsByTransaction,
  getCommissionSummaryByEmployee,
  updateMultipleCommissionSettings,
  validateCommissionSettings,
  KEY_MAPPING
};
