import { Request, Response, NextFunction } from 'express';
import model from '../models/commissionModel.js';

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

const applyMcpCommission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const assignedEmployees = req.body.assignedEmployee || req.body.item.assignedEmployee;

    if (!assignedEmployees || !Array.isArray(assignedEmployees) || assignedEmployees.length === 0) {
      res.status(400).json({ success: false, message: 'Invalid or empty employee data format' });
      return;
    }

    let itemIds: string[] = [];
    let sourceType: 'transaction' | 'consumption' = 'transaction';

    // Case 1: MCP Transaction (from stController)
    if (res.locals.data?.data?.mcpId) {
      itemIds = [res.locals.data.data.mcpId];
      sourceType = 'transaction';
    }
    // Case 2: MCP Consumption (from mcpController)
    else if (res.locals.results?.completed && Array.isArray(res.locals.results.completed)) {
      itemIds = res.locals.results.completed;
      sourceType = 'consumption';
    } else {
      res.status(400).json({ success: false, message: 'Invalid or empty item data format' });
      return;
    }

    console.log(`Processing ${sourceType} commissions for items:`, itemIds);

    // Process each item with each employee
    const results = [];
    for (const itemId of itemIds) {
      for (const employee of assignedEmployees) {
        // Validate employee data
        if (
          !employee.employeeId ||
          !employee.performanceRate ||
          !employee.performanceAmount ||
          !employee.commissionRate ||
          !employee.commissionAmount ||
          typeof employee.itemType === 'undefined'
        ) {
          res.status(400).json({
            success: false,
            message: 'Missing required fields in employee commission data',
          });
          return;
        }

        let dbItemType: 'member_care_packages' | 'member_care_package_transaction_logs';

        if (sourceType === 'transaction') {
          // For transactions, use the package type
          dbItemType = 'member_care_packages';
        } else {
          // For consumption, use the transaction logs type
          dbItemType = 'member_care_package_transaction_logs';
        }

        const payload: commissionPayload = {
          employeeId: employee.employeeId.toString(),
          performanceRate: parseFloat(employee.performanceRate),
          performanceAmount: parseFloat(employee.performanceAmount),
          commissionRate: parseFloat(employee.commissionRate),
          commissionAmount: parseFloat(employee.commissionAmount),
          remarks: employee.remarks || '',
          itemType: dbItemType,
          itemId: itemId,
          created_at: req.body.created_at || new Date().toISOString(),
        };

        console.log('Creating commission with payload:', {
          employeeId: payload.employeeId,
          itemType: payload.itemType,
          itemId: payload.itemId,
          performanceRate: payload.performanceRate,
          commissionRate: payload.commissionRate,
        });

        // Save to database
        const result = await model.createEmpCommision(payload);
        results.push(result.rows[0]);
      }
    }

    if (sourceType === 'transaction') {
      res.status(201).json(res.locals.data);
    } else {
      res.status(200).json({
        success: true,
        message: 'Consumption and commissions processed successfully',
        data: res.locals.results,
      });
    }
  } catch (error) {
    console.error('Error applying commission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save commission data',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// In commisionMiddleware.ts - add new function
const applyServicesProductsCommission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract commission data from req.body.items[].assignedEmployee
    const items = req.body.items || [];
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('No items with commission data found, responding normally');
      res.status(201).json(res.locals.data);
      return;
    }

    // Check if any items have assigned employees
    const itemsWithEmployees = items.filter(item => 
      item.assignedEmployee && Array.isArray(item.assignedEmployee) && item.assignedEmployee.length > 0
    );

    if (itemsWithEmployees.length === 0) {
      console.log('No items with assigned employees found, responding normally');
      res.status(201).json(res.locals.data);
      return;
    }

    // Get created item IDs from the transaction result
    const createdItemIds = res.locals.data?.data?.createdItemIds || [];
    
    if (createdItemIds.length !== items.length) {
      res.status(400).json({
        success: false,
        message: `Mismatch between created items (${createdItemIds.length}) and commission data (${items.length})`,
      });
      return;
    }

    console.log('Processing services/products commissions for items:', createdItemIds);

    // Process each item with each employee
    const results = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const createdItemId = createdItemIds[i];
      const assignedEmployees = item.assignedEmployee || [];

      if (assignedEmployees.length === 0) {
        console.log(`Skipping item ${i} (ID: ${createdItemId}) - no assigned employees`);
        continue;
      }

      for (const employee of assignedEmployees) {
        // Validate employee data
        if (
          !employee.employeeId ||
          typeof employee.performanceRate === 'undefined' ||
          typeof employee.performanceAmount === 'undefined' ||
          typeof employee.commissionRate === 'undefined' ||
          typeof employee.commissionAmount === 'undefined' ||
          typeof employee.itemType === 'undefined'
        ) {
          res.status(400).json({
            success: false,
            message: 'Missing required fields in employee commission data',
          });
          return;
        }

        // Map item types to database types
        let dbItemType: 'services' | 'products';
        if (item.type === 'service') {
          dbItemType = 'services';
        } else if (item.type === 'product') {
          dbItemType = 'products';
        } else {
          res.status(400).json({
            success: false,
            message: `Invalid item type: ${item.type}. Only 'service' and 'product' are supported.`,
          });
          return;
        }

        const payload: commissionPayload = {
          employeeId: employee.employeeId.toString(),
          performanceRate: parseFloat(employee.performanceRate),
          performanceAmount: parseFloat(employee.performanceAmount),
          commissionRate: parseFloat(employee.commissionRate),
          commissionAmount: parseFloat(employee.commissionAmount),
          remarks: employee.remarks || '',
          itemType: dbItemType,
          itemId: createdItemId.toString(),
          created_at: req.body.created_at || new Date().toISOString(),
        };

        console.log('Creating commission with payload:', {
          employeeId: payload.employeeId,
          itemType: payload.itemType,
          itemId: payload.itemId,
          performanceRate: payload.performanceRate,
          commissionRate: payload.commissionRate,
          commissionAmount: payload.commissionAmount,
        });

        // Save to database
        const result = await model.createEmpCommision(payload);
        results.push(result.rows[0]);
      }
    }

    console.log(`Successfully created ${results.length} commission records for services/products transaction`);

    // Return the original transaction response
    res.status(201).json(res.locals.data);
  } catch (error) {
    console.error('Error applying services/products commission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save commission data',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

const applyMvCommission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const assignedEmployees = req.body.assignedEmployee || req.body.item?.assignedEmployee;

    if (!assignedEmployees || !Array.isArray(assignedEmployees) || assignedEmployees.length === 0) {
      // No commission data, respond normally
      if (res.locals.data) {
        // MV Purchase
        res.status(201).json(res.locals.data);
      } else if (res.locals.results) {
        // MV Consumption
        res.status(201).json({ message: res.locals.results.message });
      } else {
        res.status(500).json({ success: false, message: 'Invalid response data' });
      }
      return;
    }

    console.log('✅ Found commission data:', assignedEmployees.length, 'employees');

    let itemIds: string[] = [];
    let sourceType: 'purchase' | 'consumption' = 'purchase';

    // Case 1: MV Purchase (from stController OR memberVoucherController)
    if (res.locals.data?.data?.voucher_id || res.locals.data?.data?.id) {
      const voucherId = res.locals.data.data.voucher_id || res.locals.data.data.id;
      itemIds = [voucherId.toString()];
      sourceType = 'purchase';
      console.log('📦 Processing MV PURCHASE commission for voucher:', voucherId);
    }
    // Case 2: MV Consumption (from memberVoucherController)
    else if (res.locals.results?.completed && Array.isArray(res.locals.results.completed)) {
      itemIds = res.locals.results.completed.map((id: any) => id.toString());
      sourceType = 'consumption';
      console.log('🔥 Processing MV CONSUMPTION commission for transaction logs:', itemIds);
    } else {
      console.log('❌ Invalid commission context - no valid item IDs found');
      console.log('🔍 Available res.locals.data keys:', Object.keys(res.locals.data || {}));
      console.log('🔍 Available res.locals.results keys:', Object.keys(res.locals.results || {}));
      res.status(400).json({ success: false, message: 'Invalid or empty item data format' });
      return;
    }

    console.log(`Processing ${sourceType} commissions for MV items:`, itemIds);

    // Process each item with each employee
    const results = [];
    for (const itemId of itemIds) {
      for (const employee of assignedEmployees) {
        // Validate employee data
        if (
          !employee.employeeId ||
          typeof employee.performanceRate === 'undefined' ||
          typeof employee.performanceAmount === 'undefined' ||
          typeof employee.commissionRate === 'undefined' ||
          typeof employee.commissionAmount === 'undefined' ||
          typeof employee.itemType === 'undefined'
        ) {
          res.status(400).json({
            success: false,
            message: 'Missing required fields in employee commission data',
          });
          return;
        }

        let dbItemType: 'member_vouchers' | 'member_voucher_transaction_logs';

        if (sourceType === 'purchase') {
          // For purchases, use the voucher type
          dbItemType = 'member_vouchers';
        } else {
          // For consumption, we need to get the transaction log ID
          // Since MV consumption creates transaction logs, we need to get the log ID
          console.log('MV Consumption commission - need to implement log ID retrieval');
          dbItemType = 'member_voucher_transaction_logs';
          // Note: This will need additional implementation to get the actual log ID
          // For now, using the MV ID, but should be the transaction log ID
        }

        const payload: commisionPayload = {
          employeeId: employee.employeeId.toString(),
          performanceRate: parseFloat(employee.performanceRate),
          performanceAmount: parseFloat(employee.performanceAmount),
          commissionRate: parseFloat(employee.commissionRate),
          commissionAmount: parseFloat(employee.commissionAmount),
          remarks: employee.remarks || '',
          itemType: dbItemType,
          itemId: itemId,
          created_at: req.body.created_at || new Date().toISOString(),
        };

        console.log('Creating MV commission with payload:', {
          employeeId: payload.employeeId,
          itemType: payload.itemType,
          itemId: payload.itemId,
          sourceType: sourceType,
          performanceRate: payload.performanceRate,
          commissionRate: payload.commissionRate,
        });

        // Save to database
        const result = await model.createEmpCommision(payload);
        results.push(result.rows[0]);
      }
    }

    console.log(`Successfully created ${results.length} MV commission records`);

    // Return appropriate response based on source type
    if (sourceType === 'purchase') {
      res.status(201).json(res.locals.data);
    } else {
      res.status(200).json({
        success: true,
        message: 'MV consumption and commissions processed successfully',
        data: res.locals.results,
      });
    }
  } catch (error) {
    console.error('Error applying MV commission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save MV commission data',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};


export default { 
  applyMcpCommission, 
  applyServicesProductsCommission,
  applyMvCommission
};

