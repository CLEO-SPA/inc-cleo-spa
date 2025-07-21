import { Request, Response, NextFunction } from 'express';
import model from '../models/employeeModel.js';
import validator from 'validator';
import 'dotenv/config';
import { boolean } from 'joi';
import { create } from 'domain';



const createEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      employee_email = '',
      employee_name = '',
      employee_contact = '',
      employee_code = '',
      position_ids = [],
      employee_is_active = true, 
      created_at = '',
      updated_at = '', 
    } = req.body;

    const email = employee_email.trim();
    const name = employee_name.trim();
    const contact = employee_contact.trim();
    const code = String(employee_code).trim();

    // Validate timestamps
    if (
      !validator.isISO8601(created_at, { strict: true, strictSeparator: true }) ||
      !validator.isISO8601(updated_at, { strict: true, strictSeparator: true })
    ) {
      res.status(400).json({ message: 'created_at and updated_at must be valid ISO strings.' });
      return;
    }

    // Required field validation
    if (!email || !name || !code) {
      res.status(400).json({ message: 'Required fields cannot be blank.' });
      return;
    }

    if (!validator.isEmail(email)) {
      res.status(400).json({ message: 'Invalid email format.' });
      return;
    }

    if (!validator.isMobilePhone(contact, 'any', { strictMode: false })) {
      res.status(400).json({ message: 'Invalid phone number format.' });
      return;
    }

    // Check uniqueness
    const [emailExists, phoneExists, codeExists] = await Promise.all([
      model.checkEmployeeEmailExists(email),
      model.checkEmployeePhoneExists(contact),
      model.checkEmployeeCodeExists(code),
    ]);

    if (emailExists) {
      res.status(400).json({ message: 'E-mail already in use.' });
      return;
    }

    if (phoneExists) {
      res.status(400).json({ message: 'Phone number already in use.' });
      return;
    }

    if (codeExists) {
      res.status(400).json({ message: 'Employee code already in use.' });
      return;
    }

    // Create employee
    const result = await model.createEmployeeModel({
      employee_code: code,
      employee_name: name,
      employee_email: email,
      employee_contact: contact,
      employee_is_active,
      position_ids,
      created_at,
      updated_at,
    });

    res.status(201).json({
      message: 'Employee created successfully',
      employeeId: result.employeeId,
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    next(error);
  }
};


const getAllEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const searchQuery = (req.query.search as string) || '';

  const { start_date_utc, end_date_utc } = req.session as typeof req.session & {
    start_date_utc?: string;
    end_date_utc?: string;
  };

  try {
    const { employees, totalPages, totalCount } = await model.getAllEmployees(
      offset,
      limit,
      start_date_utc ?? '0001-01-01',
      end_date_utc ?? '9999-12-31',
      searchQuery
    );

    res.status(200).json({
      currentPage: page,
      totalPages,
      totalCount,
      pageSize: limit,
      data: employees,
    });
  } catch (err) {
    console.error('Error getting employees:', err);
    next(err); // let central error-handler format the 500
  }
};

/**
 * Get /api/em/dropdown
 * This endpoint retrieves employee lists for dropdown functionality.
 */
const getAllEmployeesForDropdown = async (req: Request, res: Response) => {
  try {
    const employees = await model.getAllEmployeesForDropdown();
    res.status(200).json(employees);
  } catch (error) {
    console.error('Error in getAllEmployeesForDropdown:', error);
    res.status(500).json({ message: 'Failed to fetch employees for dropdown' });
  }
};

/**
 * Get /api/em/basic-details
 * This endpoint retrieves basic employee details for search functionality.
 */
const getBasicEmployeeDetails = async (req: Request, res: Response) => {
  try {
    console.log('Fetching basic employee details for search');
    const employees = await model.getBasicEmployeeDetails();
    console.log(`Found ${employees.length} active employees`);
    res.status(200).json({
      success: true,
      data: employees,
      total: employees.length,
    });
  } catch (error) {
    console.error('Controller error in getBasicEmployeeDetails:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch basic employee details for search',
      },
    });
  }
};

/**
 * Get /api/em/basic-details/:employeeId
 * This endpoint retrieves basic employee details by ID for search functionality.
 */
const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const employeeId = req.params.employeeId;

    // Validate employeeId
    if (!employeeId || isNaN(parseInt(employeeId, 10))) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid employee ID provided' },
      });
      return;
    }

    const employeeIdNum = parseInt(employeeId, 10);
    console.log(`Fetching details for employee ID: ${req.params.employeeId}`);

    const employee = await model.getEmployeeById(employeeIdNum);
    if (!employee) {
      console.log(`Employee with ID ${employeeId} not found`);
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No active employee found with the given ID' },
      });
      return;
    }
    console.log(`Found employee: ${employee.employee_name}`);
    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Controller error in getEmployeeById:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch employee details by given ID',
      },
    });
  }
};

/**
 * Get /api/em/positions
 * This endpoint retrieves all employee positions for dropdown selection.
 */
const getAllActivePositions = async (req: Request, res: Response) => {
  try {
    console.log('Fetching all employee positions for dropdown');
    const positions = await model.getAllActivePositions();
    console.log(`Found ${positions.length} active positions`);
    res.status(200).json({
      success: true,
      data: positions,
      total: positions.length,
    });
  } catch (error) {
    console.error('Controller error in getAllActivePositions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch employee positions for dropdown',
      },
    });
  }
};

/**
 * Get /api/em/employeeName/:employeeId
 * This endpoint retrieves employee name by employee id
 */
const getEmployeeNameByEmployeeId = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId || isNaN(parseInt(employeeId, 10))) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid employee ID provided',
        },
      });
      return;
    }

    const employeeIdNum = parseInt(employeeId, 10);
    console.log(`Fetching details for employee ID: ${employeeIdNum}`);

    const employee = await model.getEmployeeNameByEmployeeById(employeeIdNum);

    if (!employee) {
      console.log(`Employee with ID ${employeeId} not found`);
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No active employee found with the given ID',
        },
      });
      return;
    }

    console.log(`Found employee: ${employee.employee_name}`);
    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Controller error in getEmployeeNameByEmployeeId:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch employee details by given ID',
      },
    });
  }
};

const getAllRolesForDropdown = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await model.getAllRolesForDropdown();

    res.status(200).json(roles);
  } catch (error) {
    console.error('Error fetching getAllRolesForDropdown', error);
    next(error);
  }
};

/**
 * PUT /employees/:id
 * --------------------------------------------------------------
 * • Validates inputs
 * • Delegates to model.updateEmployee(...)
 * • If e-mail was actually changed, model returns { emailChanged: true }
 *   → we regenerate a fresh 3-day invite link and include it in the response.
 */
/* --------------------------------------------------------------------------
 * PUT /employees/:id
 * Robust update (auth, employee row, positions)
 * ------------------------------------------------------------------------ */
const updateEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 0. Validate and extract employee ID from URL param
    const employee_id = Number(req.params.id);
    if (!employee_id || Number.isNaN(employee_id)) {
      res.status(400).json({ message: 'Invalid employee ID.' });
      return;
    }

    // 1. Extract and trim body inputs
    const {
      employee_email,
      employee_name,
      employee_contact,
      employee_code,
      employee_is_active,
      position_ids,
      updated_at, // ISO string from client
    } = req.body as {
      employee_email?: string;
      employee_name?: string;
      employee_contact?: string;
      employee_code?: string | number;
      employee_is_active?: boolean;
      position_ids?: number[];
      updated_at?: string;
    };

    const sanitizedUpdatedAt = validator.isISO8601(updated_at ?? '', {
      strict: true,
      strictSeparator: true,
    })
      ? updated_at
      : new Date().toISOString(); // fallback if invalid or empty

    // 2. Format checks
    if (employee_email && !validator.isEmail(employee_email)) {
      res.status(400).json({ message: 'Invalid email format.' });
      return;
    }

    if (employee_contact && !validator.isMobilePhone(employee_contact, 'any')) {
      res.status(400).json({ message: 'Invalid contact number format.' });
      return;
    }

    // 3. Build payload and send to model
    const payload = {
      employee_id,
      employee_email: employee_email?.trim(),
      employee_name: employee_name?.trim(),
      employee_contact: employee_contact?.trim(),
      employee_code: employee_code !== undefined ? String(employee_code).trim() : undefined,
      employee_is_active,
      position_ids,
      updated_at: sanitizedUpdatedAt,
    };

    await model.updateEmployee(payload);
    const updated = await model.getEmployeeById(employee_id);

    res.status(200).json({
      message: 'Employee updated.',
      data: updated,
    });
  } catch (err) {
    console.error('updateEmployee ctrl error:', err);
    next(err);
  }
};

// const getOnlyEmployeeById = async (req: Request, res: Response, next: NextFunction) => {
//   const employeeId = Number(req.params.id);
//   if (!employeeId || Number.isNaN(employeeId)) {
//     res.status(400).json({ message: 'Invalid employee ID.' });
//     return;
//   }

//   try {
//     const employee = await model.getOnlyEmployeeById(employeeId);
//     if (!employee) {
//       res.status(404).json({ message: 'Employee not found.' });
//       return;
//     }
//     res.status(200).json(employee);
//   } catch (error) {
//     console.error('Error fetching employee by ID:', error);
//     next(error);
//   }
// };

export default {
  createEmployee,
  getAllEmployees,
  getAllEmployeesForDropdown,
  getAllRolesForDropdown,
  getBasicEmployeeDetails,
  updateEmployee,
  getEmployeeById,
  getAllActivePositions,
  getEmployeeNameByEmployeeId,
  // getOnlyEmployeeById
};
