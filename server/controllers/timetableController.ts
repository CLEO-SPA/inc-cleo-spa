// controllers/timetableController.ts
import { Request, Response, NextFunction } from 'express';
import timetableModel from '../models/timetableModel.js';

/**
 * Get /api/et/current-and-upcoming/:employeeId?currentDate=YYYY-MM-DD
 * This endpoint retrieves current and upcoming timetables by employee id
 */
const getCurrentAndUpcomingTimetables = async (req: Request, res: Response, next: NextFunction) => {
  const { employeeId } = req.params;
  const { currentDate } = req.query;
  const { start_date_utc, end_date_utc } = req.session;

  if (!employeeId || !currentDate) {
    res.status(400).json({ message: 'Missing employeeId or session date' });
    return;
  }

  const currentDateTime = new Date(currentDate as string).toISOString();

  try {
    const { current, upcoming } = await timetableModel.getCurrentAndUpcomingTimetables(
      parseInt(employeeId),
      currentDateTime,
      start_date_utc!,
      end_date_utc!
    );

    res.status(200).json({
      current_timetables: current,
      upcoming_timetables: upcoming,
    });
  } catch (error) {
    console.error('Error in timetableController.getCurrentAndUpcomingTimetables:', error);
    next(error);
  }
};

/**
 * POST /api/et/create-employee-timetable
 * This endpoint insert new timetable record by calling SQL function "create_employee_timetable"
 */
const createTimetable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await timetableModel.createEmployeeTimetable({
      ...req.body,
    });
    res.status(201).json(data);
  } catch (error) {
    console.error('Failed to create timetable:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to create timetable';

    next(errorMessage);
  }
};

/**
 * GET /api/et/timetables?month=YYYY-MM&page=1&limit=20
 * This endpoint retrieves the paginated list of employee timetables for a specific month.
 */
const getActiveRestDays = async (req: Request, res: Response) => {
  try{
    const { month, page = 1, limit = 10, position_id } = req.query;

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

    // Parse page and limit parameters
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const positionId = position_id ? parseInt(position_id as string, 10) : undefined;

    // Validate page and limit parameters
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAGINATION',
          message: 'Page and limit parameters must be positive integers.',
        }
      });
      return;
    }

    if(positionId && isNaN(positionId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_POSITION_ID',
          message: 'Position ID must be a valid integer.',
        }
      });
      return;
    }

    console.log(`Fetching timetables for month: ${month}, page: ${pageNum}, limit: ${limitNum}, position_id: ${positionId}`);
    const result = await timetableModel.getActiveRestDays(month as string, pageNum, limitNum, positionId);
    console.log(`Fetched ${result.data.length} timetables for month: ${month}`);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('Controller error in fetching active rest days:', error);

    if(error.message.includes('Invalid month format.')) {
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
        message: 'An error occurred while fetching active rest days.',
      }
    });
  }
}

/**
 * GET /api/et/employee/:employeeId?month=YYYY-MM
 * This endpoint retrieves a specific employee's timetable for a given month.
 */
const getActiveRestDaysByEmployee = async (req: Request, res: Response) => {
  try{
    const { employeeId } = req.params;
    const { month } = req.query;

    // Validate employeeId and month parameters
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
    console.log(`Fetching timetable for employee ID: ${employeeIdNum}, month: ${month}`);

    const employeeTimetable = await timetableModel.getActiveRestDaysByEmployee(employeeIdNum, month as string);

    /**
     * Tweak this to show no rest days found meaning the employee has no rest days
     */
    if(employeeTimetable == null){
      console.log(`No timetable found for employee ID: ${employeeIdNum} in month: ${month}`);
      res.status(404).json({
        success: false,
        error: {
          code: 'TIMETABLE_NOT_FOUND',
          message: `No timetable found for employee ID: ${employeeIdNum} in month: ${month}`,
        }
      });
      return;
    }

    console.log(`Found timetables for ${employeeTimetable.employee_name} with ${employeeTimetable.rest_days.length} rest days in month: ${month}`);

    res.status(200).json({
      success: true,
      data: employeeTimetable,
      pagination: {
        current_page: 1,
        per_page: 1,
        total_employees: 1,
        total_pages: 1
      }
    });
  } catch (error: any) {
    console.error('Controller error in fetching active rest days by employee:', error);

    if (error.message.includes('Invalid month format.')) {
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
        message: 'An error occurred while fetching active rest days by employee.',
      }
    });
  }
}

/**
 * GET /api/et/position/:positionId?month=YYYY-MM&page=1&limit=20
 * This endpoint retrieves the paginated list of employee timetables for a specific position in a given month.
 */
const getActiveRestDaysByPosition = async (req: Request, res: Response) => {
  try{
    const { positionId } = req.params;
    const { month, page = 1, limit = 20 } = req.query;

    // Validate positionId and month parameters
    if (!positionId || isNaN(parseInt(positionId as string, 10))) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_POSITION_ID',
          message: 'Position ID must be a valid integer.',
        }
      });
      return;
    }

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

    const positionIdNum = parseInt(positionId as string, 10);
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Validate page and limit parameters
        // Validate page and limit parameters
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAGINATION',
          message: 'Page and limit parameters must be positive integers.',
        }
      });
      return;
    }

    console.log(`Fetching timetables for position ID: ${positionIdNum}, month: ${month}, page: ${pageNum}, limit: ${limitNum}`);
    const result = await timetableModel.getActiveRestDaysByPosition(positionIdNum, month as string, pageNum, limitNum);
    console.log(`Fetched ${result.data.length} timetables for position ID: ${positionIdNum} in month: ${month}`);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('Controller error in fetching active rest days by position:', error);

    if (error.message.includes('Invalid month format.')) {
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
        message: 'An error occurred while fetching active rest days by position.',
      }
    });
  } 
}

/**
 * GET /api/et/:timetableId
 * This endpoint retrieves the timetable by timetable ID
 */
const getTimetableById = async (req: Request, res: Response, next: NextFunction) => {
  const timetableId = Number(req.params.timetableId);
  if (!timetableId) {
    res.status(400).json({ message: 'Invalid timetable ID.' });
    return;
  } 

  try {
    const timetable = await timetableModel.getTimetableById(timetableId);
    if (!timetable) {
      res.status(404).json({ message: 'Timetable not found.' });
      return;
    }

    res.status(200).json(timetable);
  } catch (error) {
    console.error('Error in timetableController.getTimetableById:', error);
    next(error);
  }
};

/**
 * PUT /api/et/update-employee-timetable/:timetableId
 * This endpoint update the timetable record by calling SQL function "update_employee_timetable"
 */
const updateTimetable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { timetableId } = req.params;

    const data = await timetableModel.updateEmployeeTimetable({
      timetable_id: Number(timetableId),
      ...req.body,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error('Failed to update timetable:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to update timetable';

    next(errorMessage);
  }
};

/**
 * GET /api/et/reset-create-timetables-pre
 * This endpoint resets the timetables db table to its defined pre-condition
 */
const resetCreateTimetablePre = async (req: Request, res: Response) => {
  try {
    await timetableModel.resetCreateTimetablePre();
    res.status(200).json({ message: 'Reset successful' });
  } catch (error) {
    console.error('Reset pre-condition failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Reset failed';
    res.status(500).json({ message: errorMessage });
  }
};

export default {
  getCurrentAndUpcomingTimetables,
  createTimetable,
  getActiveRestDays,
  getActiveRestDaysByEmployee,
  getActiveRestDaysByPosition,
  getTimetableById,
  updateTimetable,
  resetCreateTimetablePre
};

