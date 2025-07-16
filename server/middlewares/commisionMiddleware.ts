import { Request, Response, NextFunction } from 'express';
import model from '../models/commisionModel.js';

interface commisionPayload {
  employeeId: string;
  performanceRate: number;
  performanceAmount: number;
  commissionRate: number;
  commissionAmount: number;
  remarks: string;
  itemType: 'member_vouchers' | 'member_care_packages' | 'products' | 'services';
  itemId: string;
  created_at: string;
}

const applyMcpCommision = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const assignedEmployees = req.body.assignedEmployee;
    const itemId = req.body.itemId || '';

    if (!assignedEmployees || !Array.isArray(assignedEmployees) || assignedEmployees.length === 0) {
      res.status(400).json({ success: false, message: 'Invalid or empty employee data format' });
      return;
    }

    const results = [];

    for (const employee of assignedEmployees) {
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

      // Map frontend item types to database item types
      let dbItemType: string;
      switch (employee.itemType) {
        case 'service':
          dbItemType = 'services';
          break;
        case 'product':
          dbItemType = 'products';
          break;
        case 'package':
          dbItemType = 'member_care_packages';
          break;
        case 'member-voucher':
          dbItemType = 'member_vouchers';
          break;
        default:
          dbItemType = employee.itemType || 'services';
      }

      // Create payload for database
      const payload: commisionPayload = {
        employeeId: employee.employeeId.toString(),
        performanceRate: parseFloat(employee.performanceRate),
        performanceAmount: parseFloat(employee.performanceAmount),
        commissionRate: parseFloat(employee.commissionRate),
        commissionAmount: parseFloat(employee.commissionAmount),
        remarks: employee.remarks || '',
        itemType: dbItemType as 'member_vouchers' | 'member_care_packages' | 'products' | 'services',
        itemId: itemId,
        created_at: req.body.created_at || new Date().toISOString(),
      };

      const result = await model.createEmpCommision(payload);
      results.push(result.rows[0]);
    }

    res.status(200).json(res.locals.data);
  } catch (error) {
    console.error('Error applying commission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save commission data',
      error: error instanceof Error ? error.message : error,
    });
  }
};

export default { applyMcpCommision };
