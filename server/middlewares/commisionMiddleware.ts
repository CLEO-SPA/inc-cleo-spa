import { Request, Response, NextFunction } from 'express';
import model from '../models/commisionModel.js';

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

const applyMcpCommision = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

export default { applyMcpCommision };
