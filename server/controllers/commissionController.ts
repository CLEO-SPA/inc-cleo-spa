import { Request, Response } from 'express';
import model from '../models/commissionModel.js';

/**
 * GET /api/com/commissionSettings
 * This endpoint retrieves commission settings.
 */
const getAllCommissionSettings = async (req: Request, res: Response) => {
  try {
    const commissions = await model.getAllCommissionSettings();
    
    // Transform database results to frontend format
    const simplified: Record<string, string> = {};
    
    // Initialize with default values for expected commission types only
    const expectedKeys = ['service', 'product', 'package', 'member-voucher', 'mcpConsumption', 'mvConsumption'];
    expectedKeys.forEach(key => {
      simplified[key] = '0.00';
    });
    
    // Override with actual database values
    commissions.forEach(commission => {
      // Find the frontend key that maps to this database key
      const frontendKey = Object.keys(model.KEY_MAPPING).find(
        key => model.KEY_MAPPING[key as keyof typeof model.KEY_MAPPING] === commission.key
      );
      
      if (frontendKey) {
        simplified[frontendKey] = commission.value;
      }
    });

    // Ensure we only send commission data, no timestamps
    res.status(200).json(simplified);
  } catch (error) {
    console.error('Error in getAllCommissionSettings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch commission settings' 
    });
  }
};

/**
 * PUT /api/com/commissionSettings
 * This endpoint updates commission settings.
 */
const updateCommissionSettings = async (req: Request, res: Response) : Promise <void> => {
  try {
    const updates = req.body;

    // Validate request body
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      res.status(400).json({ 
        success: false, 
        message: 'Request body must contain commission settings to update' 
      });
      return;
    }

    // Validate settings using model
    // const validation = model.validateCommissionSettings(updates);
    // if (!validation.isValid) {
    //   console.warn('Commission settings validation failed:', validation.errors);
    //   return res.status(400).json({ 
    //     success: false, 
    //     message: 'Invalid commission settings', 
    //     errors: validation.errors 
    //   });
    // }

    // Update settings
    const results = await model.updateMultipleCommissionSettings(updates);

    res.status(200).json({
      success: true,
      message: `Successfully updated ${results.length} commission settings`,
      data: results
    });
  } catch (error) {
    console.error('Error updating commission settings:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update commission settings',
      error: errorMessage
    });
  }
};

/**
 * GET /api/com/employee/:employeeId/monthly?month=YYYY-MM
 * This endpoint retrieves monthly commission data for a specific employee with daily breakdown
 * Following the pattern from timetableController and revenueController
 */
const getEmployeeMonthlyCommission = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { month } = req.query;

    // Validate employeeId parameter
    if (!employeeId || isNaN(parseInt(employeeId as string, 10))) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMPLOYEE_ID',
          message: 'Employee ID must be a valid integer.',
        }
      });
      return;
    }

    // Validate month parameter
    if (!month || typeof month !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MONTH',
          message: 'Month parameter is required and must be a string in the format YYYY-MM.',
        }
      });
      return;
    }

    const employeeIdNum = parseInt(employeeId as string, 10);
    console.log(`Fetching monthly commission for employee ID: ${employeeIdNum}, month: ${month}`);

    // Call model function to get daily commission data
    const dailyCommissionData = await model.getEmployeeMonthlyCommission(employeeIdNum, month as string);

    console.log(`Successfully fetched commission data for ${dailyCommissionData.length} days in month: ${month}`);

    res.status(200).json({
      success: true,
      data: dailyCommissionData,
      meta: {
        employee_id: employeeIdNum,
        month: month,
        total_days: dailyCommissionData.length,
        // Calculate monthly totals
        monthly_totals: {
          services: dailyCommissionData.reduce((sum, day) => sum + parseFloat(day.services), 0).toFixed(2),
          products: dailyCommissionData.reduce((sum, day) => sum + parseFloat(day.products), 0).toFixed(2),
          member_vouchers: dailyCommissionData.reduce((sum, day) => sum + parseFloat(day.member_vouchers), 0).toFixed(2),
          member_care_packages: dailyCommissionData.reduce((sum, day) => sum + parseFloat(day.member_care_packages), 0).toFixed(2),
          performance_total: dailyCommissionData.reduce((sum, day) => sum + parseFloat(day.performance_total), 0).toFixed(2),
          commission_total: dailyCommissionData.reduce((sum, day) => sum + parseFloat(day.commission_total), 0).toFixed(2),
        }
      }
    });

  } catch (error: any) {
    console.error('Controller error in getEmployeeMonthlyCommission:', error);

    if (error.message.includes('Invalid month format')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MONTH_FORMAT',
          message: 'Month parameter must be in the format YYYY-MM.',
        }
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching employee monthly commission data.',
      }
    });
  }
};

/**
 * GET /api/com/employee/:employeeId/breakdown/:date
 * This endpoint retrieves detailed commission breakdown for a specific employee and date
 * Shows individual commission records for that day
 */
const getEmployeeCommissionBreakdown = async (req: Request, res: Response) => {
  try {
    const { employeeId, date } = req.params;

    // Validate employeeId parameter
    if (!employeeId || isNaN(parseInt(employeeId as string, 10))) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMPLOYEE_ID',
          message: 'Employee ID must be a valid integer.',
        }
      });
      return;
    }

    // Validate date parameter (YYYY-MM-DD format)
    if (!date || typeof date !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Date parameter is required and must be a string in the format YYYY-MM-DD.',
        }
      });
      return;
    }

    // Additional date format validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE_FORMAT',
          message: 'Date parameter must be in the format YYYY-MM-DD.',
        }
      });
      return;
    }

    const employeeIdNum = parseInt(employeeId as string, 10);
    console.log(`Fetching commission breakdown for employee ID: ${employeeIdNum}, date: ${date}`);

    // Call model function to get detailed breakdown
    const breakdownRecords = await model.getEmployeeCommissionBreakdown(employeeIdNum, date);

    if (breakdownRecords.length === 0) {
      console.log(`No commission records found for employee ID: ${employeeIdNum} on date: ${date}`);
      res.status(200).json({
        success: true,
        data: [],
        meta: {
          employee_id: employeeIdNum,
          date: date,
          total_records: 0,
          message: 'No commission records found for this date.'
        }
      });
      return;
    }

    console.log(`Found ${breakdownRecords.length} commission records for employee ID: ${employeeIdNum} on date: ${date}`);

    // Calculate summary for the breakdown
    const summary = {
      total_records: breakdownRecords.length,
      total_commission: breakdownRecords.reduce((sum, record) => sum + parseFloat(record.commission_amount), 0).toFixed(2),
      total_performance: breakdownRecords.reduce((sum, record) => sum + parseFloat(record.performance_amount), 0).toFixed(2),
      breakdown_by_type: {} as Record<string, { count: number; commission_total: string; performance_total: string }>
    };

    // Group by item type for summary
    breakdownRecords.forEach(record => {
      const itemType = record.item_type;
      if (!summary.breakdown_by_type[itemType]) {
        summary.breakdown_by_type[itemType] = {
          count: 0,
          commission_total: "0.00",
          performance_total: "0.00"
        };
      }
      
      summary.breakdown_by_type[itemType].count += 1;
      summary.breakdown_by_type[itemType].commission_total = (
        parseFloat(summary.breakdown_by_type[itemType].commission_total) + parseFloat(record.commission_amount)
      ).toFixed(2);
      summary.breakdown_by_type[itemType].performance_total = (
        parseFloat(summary.breakdown_by_type[itemType].performance_total) + parseFloat(record.performance_amount)
      ).toFixed(2);
    });

    res.status(200).json({
      success: true,
      data: breakdownRecords,
      meta: {
        employee_id: employeeIdNum,
        date: date,
        summary: summary
      }
    });

  } catch (error: any) {
    console.error('Controller error in getEmployeeCommissionBreakdown:', error);

    if (error.message.includes('Invalid date format')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE_FORMAT',
          message: 'Date parameter must be in the format YYYY-MM-DD.',
        }
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching employee commission breakdown.',
      }
    });
  }
};

export default {
  getAllCommissionSettings,
  updateCommissionSettings,
  getEmployeeMonthlyCommission,
  getEmployeeCommissionBreakdown
};