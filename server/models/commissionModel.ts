import { pool, withTransaction } from '../config/database.js';
import { EmployeeCommisions } from '../types/model.types.js';
import { format } from 'date-fns';

interface CommissionSettingUpdate {
  key: string;
  value: string;
  frontendKey: string;
}

// Type definitions for commission data
export interface DailyCommissionData {
  date: string; // YYYY-MM-DD format
  services: string;
  products: string;
  member_vouchers: string;
  member_care_packages: string;
  performance_total: string;
  commission_total: string;
}

export interface CommissionBreakdownRecord {
  id: number;
  item_type: string;
  item_id: string;
  commission_amount: string;
  performance_amount: string;
  commission_rate: string;
  performance_rate: string;
  remarks: string;
  created_at: string;
  item_name?: string; // Optional - for display purposes
}

export interface MonthDateRange {
  start_date: Date;
  end_date: Date;
}

// Key mapping between frontend and database
const KEY_MAPPING = {
  service: 'adhoc_service',
  product: 'adhoc_product',
  package: 'member_care_package_purchase',
  'member-voucher': 'member_voucher_purchase',
  mcpConsumption: 'member_care_package_consumption',
  mvConsumption: 'member_voucher_consumption',
  transferMCP: 'mcp_transfer',
  transferMV: 'mv_transfer'
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

/**
 * Utility function - Validate month format (YYYY-MM)
 * Following timetable module pattern
 */
const isValidMonthFormat = (month: string): boolean => {
  const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return monthRegex.test(month);
};

/**
 * Utility function - Get the start and end dates for a month
 * Following timetable module pattern exactly
 */
const getMonthDateRange = (monthInput: string): MonthDateRange => {
  const start_date = new Date(`${monthInput}-01T00:00:00Z`);
  const end_date = new Date(start_date.getFullYear(), start_date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start_date, end_date };
};

/**
 * Get monthly commission data for an employee - Daily aggregated view
 * Similar to revenue controller pattern with daily array
 */
const getEmployeeMonthlyCommission = async (
  employeeId: number,
  month: string
): Promise<DailyCommissionData[]> => {
  try {
    // Validate month format
    if (!isValidMonthFormat(month)) {
      throw new Error('Invalid month format. Use YYYY-MM format.');
    }

    const { start_date, end_date } = getMonthDateRange(month);
    const year = start_date.getFullYear();
    const monthNum = start_date.getMonth() + 1;

    console.log('=== DEBUG COMMISSION QUERY ===');
    console.log('Employee ID:', employeeId);
    console.log('Month:', month);
    console.log('start_date:', start_date.toISOString());
    console.log('end_date:', end_date.toISOString());

    // Debug query to see the actual commission data and how dates are converted
    const debugQuery = `
      SELECT 
        ec.id,
        ec.created_at,
        ec.created_at AT TIME ZONE 'Asia/Singapore' as created_at_sgt,
        DATE(ec.created_at AT TIME ZONE 'Asia/Singapore') as commission_date_sgt,
        ec.item_type,
        ec.commission_amount
      FROM employee_commissions ec
      WHERE ec.employee_id = $1
        AND ec.created_at >= $2::timestamptz
        AND ec.created_at < $3::timestamptz
      ORDER BY ec.created_at;
    `;
    
    const debugResult = await pool().query(debugQuery, [employeeId, start_date.toISOString(), end_date.toISOString()]);
    console.log('=== DEBUG: Raw commission records with timezone conversion ===');
    debugResult.rows.forEach(row => {
      console.log(`ID: ${row.id}, UTC: ${row.created_at.toISOString()}, SGT: ${row.created_at_sgt}, Date: ${row.commission_date_sgt}, Amount: ${row.commission_amount}`);
    });

    // Get number of days in the month
    const daysInMonth = new Date(year, monthNum, 0).getDate();

    // Create array of day objects with default values (following revenue controller pattern)
    const daysArray: DailyCommissionData[] = Array.from({ length: daysInMonth }, (_, i) => {
      const day = (i + 1).toString().padStart(2, '0');
      const date = `${year}-${monthNum.toString().padStart(2, '0')}-${day}`;

      return {
        date, // YYYY-MM-DD format
        services: "0.00",
        products: "0.00",
        member_vouchers: "0.00",
        member_care_packages: "0.00",
        performance_total: "0.00",
        commission_total: "0.00",
      };
    });

    // Query to get daily aggregated commission data
    const query = `
      SELECT 
        DATE(ec.created_at AT TIME ZONE 'Asia/Singapore') as commission_date,
        ec.item_type,
        SUM(ec.commission_amount) as total_commission,
        SUM(ec.performance_amount) as total_performance
      FROM employee_commissions ec
      WHERE ec.employee_id = $1
        AND ec.created_at >= $2::timestamptz
        AND ec.created_at < $3::timestamptz
      GROUP BY 
        DATE(ec.created_at AT TIME ZONE 'Asia/Singapore'),
        ec.item_type
      ORDER BY commission_date, ec.item_type;
    `;

    const queryParams = [
      employeeId,
      start_date.toISOString(),
      end_date.toISOString()
    ];

    const result = await pool().query(query, queryParams);
    console.log('Raw commission aggregation result:', result.rows);

    // Process results and populate daysArray
    result.rows.forEach((row: any) => {
      // Handle commission_date properly - it represents the Singapore date
      // Use toDateString() to get the actual date without timezone issues
      let commissionDateStr;
      
      if (row.commission_date instanceof Date) {
        // Extract year, month, day from the date object to avoid timezone conversion issues
        const year = row.commission_date.getFullYear();
        const month = String(row.commission_date.getMonth() + 1).padStart(2, '0'); // getMonth() is 0-based
        const day = String(row.commission_date.getDate()).padStart(2, '0');
        commissionDateStr = `${year}-${month}-${day}`;
      } else {
        commissionDateStr = row.commission_date.toString();
      }
      
      console.log(`Processing commission: SGT date = ${commissionDateStr}, item_type = ${row.item_type}, amount = ${row.total_commission}`);
      
      const day = parseInt(commissionDateStr.split('-')[2], 10) - 1; // Convert to 0-based index
      
      if (day >= 0 && day < daysInMonth) {
        const commissionAmount = parseFloat(row.total_commission || 0);
        const performanceAmount = parseFloat(row.total_performance || 0);

        // Update specific item type totals
        switch (row.item_type) {
          case 'services':
            daysArray[day].services = commissionAmount.toFixed(2);
            break;
          case 'products':
            daysArray[day].products = commissionAmount.toFixed(2);
            break;
          case 'member_vouchers':
          case 'member_voucher_transaction_logs':
            // Combine MV purchase and consumption commissions
            const currentMV = parseFloat(daysArray[day].member_vouchers);
            daysArray[day].member_vouchers = (currentMV + commissionAmount).toFixed(2);
            break;
          case 'member_care_packages':
          case 'member_care_package_transaction_logs':
            // Combine MCP purchase and consumption commissions
            const currentMCP = parseFloat(daysArray[day].member_care_packages);
            daysArray[day].member_care_packages = (currentMCP + commissionAmount).toFixed(2);
            break;
        }

        // Update daily totals
        const currentPerformance = parseFloat(daysArray[day].performance_total);
        const currentCommission = parseFloat(daysArray[day].commission_total);
        
        daysArray[day].performance_total = (currentPerformance + performanceAmount).toFixed(2);
        daysArray[day].commission_total = (currentCommission + commissionAmount).toFixed(2);
      }
    });

    console.log('Processed commission data for', daysInMonth, 'days');
    return daysArray;

  } catch (error) {
    console.error('Database Error in getEmployeeMonthlyCommission:', error);
    throw new Error('Failed to fetch employee monthly commission data from the database');
  }
};

/**
 * Get detailed commission breakdown for a specific employee and date
 * Shows individual commission records for a specific day
 */
const getEmployeeCommissionBreakdown = async (
  employeeId: number,
  date: string
): Promise<CommissionBreakdownRecord[]> => {
  try {
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD format.');
    }

    console.log('=== DEBUG COMMISSION BREAKDOWN ===');
    console.log('Employee ID:', employeeId);
    console.log('Date:', date);

    console.log('Start of day (SGT):', `${date}T00:00:00+08:00`);
    console.log('End of day (SGT):', `${date}T23:59:59+08:00`);

    // Query to get individual commission records for the specific date
    // Use Singapore timezone in the WHERE clause to match the monthly query logic
    const query = `
      SELECT 
        ec.id,
        ec.item_type,
        ec.item_id,
        ec.commission_amount,
        ec.performance_amount,
        ec.commission_rate,
        ec.performance_rate,
        ec.remarks,
        ec.created_at,
        -- Try to get item names for better display
        CASE 
          WHEN ec.item_type = 'services' THEN (
            SELECT sti.service_name 
            FROM sale_transaction_items sti 
            WHERE sti.id = ec.item_id::bigint
            LIMIT 1
          )
          WHEN ec.item_type = 'products' THEN (
            SELECT sti.product_name 
            FROM sale_transaction_items sti 
            WHERE sti.id = ec.item_id::bigint
            LIMIT 1
          )
          WHEN ec.item_type = 'member_vouchers' THEN (
            SELECT mv.member_voucher_name 
            FROM member_vouchers mv 
            WHERE mv.id = ec.item_id::bigint
            LIMIT 1
          )
          WHEN ec.item_type = 'member_care_packages' THEN (
            SELECT mcp.package_name 
            FROM member_care_packages mcp 
            WHERE mcp.id = ec.item_id::bigint
            LIMIT 1
          )
          ELSE 'N/A'
        END as item_name
      FROM employee_commissions ec
      WHERE ec.employee_id = $1
        AND DATE(ec.created_at AT TIME ZONE 'Asia/Singapore') = $2::date
      ORDER BY ec.created_at ASC;
    `;

    const queryParams = [
      employeeId,
      date  // Pass date as YYYY-MM-DD string directly
    ];

    const result = await pool().query(query, queryParams);
    console.log('Breakdown query result:', result.rows.length, 'records found');

    // Format the results
    const breakdownRecords: CommissionBreakdownRecord[] = result.rows.map((row: any) => ({
      id: row.id,
      item_type: row.item_type,
      item_id: row.item_id.toString(),
      commission_amount: parseFloat(row.commission_amount || 0).toFixed(2),
      performance_amount: parseFloat(row.performance_amount || 0).toFixed(2),
      commission_rate: parseFloat(row.commission_rate || 0).toFixed(2),
      performance_rate: parseFloat(row.performance_rate || 0).toFixed(2),
      remarks: row.remarks || '',
      created_at: row.created_at,
      item_name: row.item_name || 'N/A'
    }));

    return breakdownRecords;

  } catch (error) {
    console.error('Database Error in getEmployeeCommissionBreakdown:', error);
    throw new Error('Failed to fetch employee commission breakdown from the database');
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
  updateMultipleCommissionSettings,
  getEmployeeMonthlyCommission,
  getEmployeeCommissionBreakdown,
  validateCommissionSettings,
  KEY_MAPPING
};