import { Request, Response, NextFunction } from 'express';
import model from '../models/employeeModel.js';
import validator from 'validator';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

const createEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    /* -------------------------------------------------------------------- *
     * 1.  Trim inputs so "   " → ""  (prevents sneaky whitespace values)   *
     * -------------------------------------------------------------------- */
    const {
      employee_email = '',
      employee_name = '',
      employee_contact = '',
      employee_code = '',
      role_name = '',
      position_ids,
      created_at,
      updated_at,
    } = req.body;

    const email = employee_email.trim();
    const name = employee_name.trim();
    const contact = employee_contact.trim();
    const code = String(employee_code).trim(); // cope with numeric codes
    const role = role_name.trim();

    /* -------------------------------------------------------------------- *
     * 2.  Required-field & format checks                                   *
     * -------------------------------------------------------------------- */
    const missing = !email || !name || !contact || !code || !role;

    if (missing) {
      res.status(400).json({ message: 'All required fields must be non-blank.' });
      return;
    }

    if (!validator.isEmail(email)) {
      res.status(400).json({ message: 'Invalid email format.' });
      return;
    }

    // (Optional) strict phone test; tweak locale list as needed
    if (!validator.isMobilePhone(contact, 'any', { strictMode: false })) {
      res.status(400).json({ message: 'Invalid contact number format.' });
      return;
    }

    /* -------------------------------------------------------------------- *
     * 3.  Uniqueness checks                                                *
     * -------------------------------------------------------------------- */
    // if (await model.getAuthUser(email)) {
    //   res.status(409).json({ message: 'User with this email already exists.' });
    //   return;
    // }

    if (await model.checkEmployeeEmailExists(email)) {
      res.status(409).json({ message: 'Employee email already in use.' });
      return;
    }

    if (await model.checkEmployeeCodeExists(code)) {
      res.status(409).json({ message: 'Employee code already in use.' });
      return;
    }

    if (await model.checkEmployeePhoneExists(contact)) {
      res.status(409).json({ message: 'Employee contact already in use.' });
      return;
    }

    /* -------------------------------------------------------------------- *
     * 4.  Create user + employee                                           *
     * -------------------------------------------------------------------- */
    const defaultPassword = crypto.randomBytes(8).toString('hex');
    const password_hash = await bcrypt.hash(defaultPassword, 10);

    const results = await model.createAuthAndEmployee({
      email,
      password_hash,
      phone: contact,
      role_name: role,
      employee_code: code,
      employee_name: name,
      employee_is_active: false,
      position_ids,
      created_at,
      updated_at,
    });

    /* -------------------------------------------------------------------- *
     * 5.  Send invite link                                                 *
     * -------------------------------------------------------------------- */
    const token = jwt.sign({ email }, process.env.INV_JWT_SECRET as string, { expiresIn: '3d' });
    const resetUrl = `${process.env.LOCAL_FRONTEND_URL}/reset-password?token=${token}`;

    res.status(201).json({
      message: 'Employee created successfully. Send the link below so they can set a password.',
      resetUrl,
      results,
    });
  } catch (error) {
    console.error('Error in createAndInviteEmployee:', error);
    next(error);
  }
};

const getAllEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  // session keys are snake_case in the rest of the code
  const { start_date_utc, end_date_utc } = req.session as typeof req.session & {
    start_date_utc?: string;
    end_date_utc?: string;
  };

  try {
    const { employees, totalPages, totalCount } = await model.getAllEmployees(
      offset,
      limit,
      start_date_utc ?? '0001-01-01',
      end_date_utc ?? '9999-12-31'
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
export const updateEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    /* ------------------------------------------------- 0. URL param */
    const employee_id = Number(req.params.id);
    if (!employee_id || Number.isNaN(employee_id)) {
      res.status(400).json({ message: 'Invalid employee ID.' });
      return;
    }

    /* ------------------------------------------------- 1. Body sanitise */
    const {
      employee_email,
      employee_name,
      employee_contact,
      employee_code,
      employee_is_active,
      position_ids,
      updated_at, // ← optional ISO string from client
    } = req.body as {
      employee_email?: string;
      employee_name?: string;
      employee_contact?: string;
      employee_code?: string | number;
      employee_is_active?: boolean;
      position_ids?: string[];
      updated_at?: string;
    };

    const sanitizedTs = validator.isISO8601(updated_at ?? '', {
      strict: true,
      strictSeparator: true,
    })
      ? updated_at
      : undefined;

    const payload = {
      employee_id,
      email: employee_email?.trim(),
      phone: employee_contact?.trim(),
      employee_contact: employee_contact?.trim(),
      employee_name: employee_name?.trim(),
      employee_code: employee_code !== undefined ? String(employee_code).trim() : undefined,
      employee_is_active,
      position_ids,
      updated_at: sanitizedTs ?? new Date().toISOString(), // fallback
    };

    /* ------------------------------------------------- 2. Quick format checks */
    if (payload.email && !validator.isEmail(payload.email)) {
      res.status(400).json({ message: 'Invalid email format.' });
      return;
    }
    if (payload.phone && !validator.isMobilePhone(payload.phone, 'any')) {
      res.status(400).json({ message: 'Invalid contact number format.' });
      return;
    }

    /* ------------------------------------------------- 3. Update via model */
    const { emailChanged } = await model.updateEmployee(payload);

    /* ------------------------------------------------- 4. Optional invite link regeneration */
    let newInviteUrl: string | undefined;
    if (emailChanged && payload.email) {
      // update touched-at timestamp so “recently updated” filters pick it up
      await model.touchEmployee(payload.email);

      const token = jwt.sign({ email: payload.email }, process.env.INV_JWT_SECRET as string, { expiresIn: '3d' });

      newInviteUrl = `${process.env.LOCAL_FRONTEND_URL}/reset-password?token=${token}`;
    }

    /* ------------------------------------------------- 5. Fetch & send response */
    const updated = await model.getEmployeeById(employee_id);

    res.status(200).json({
      message: 'Employee updated.',
      ...(newInviteUrl ? { newInviteUrl } : {}),
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
