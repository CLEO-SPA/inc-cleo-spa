import { Request, Response, NextFunction } from 'express';
import model from '../models/employeeModel.js';
import { getCurrentSimStatus } from '../services/simulationService.js';
import validator from 'validator';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { InvJwtPayload } from '../types/auth.types.js';
import bcrypt from 'bcryptjs';

const defaultPassword = async (req: Request, res: Response, next: NextFunction) => {
  const randomPassword = crypto.randomBytes(8).toString('hex');
  req.body.password = randomPassword;
  next();
};

const loginEmployee = async (req: Request, res: Response, next: NextFunction) => {
  if (res.locals.result) {
    const { rememberMe } = req.body;
    const simParams = getCurrentSimStatus().params;
    const start_date_utc = simParams?.start_date_utc;
    const end_date_utc = simParams?.end_date_utc;

    req.session.regenerate((err) => {
      if (err) {
        console.error('Error regenerating session:', err);
        return res.status(500).json({ message: 'Session error' });
      }
      req.session.start_date_utc = getCurrentSimStatus().isActive ? start_date_utc : null;
      req.session.end_date_utc = getCurrentSimStatus().isActive ? end_date_utc : new Date().toUTCString();
      req.session.end_date_is_default = getCurrentSimStatus().isActive ? false : true;
      req.session.user_id = res.locals.user_id;
      req.session.username = res.locals.username;
      req.session.email = res.locals.email;
      req.session.role = res.locals.role;

      // console.log('My Date: ', req.session.end_date_utc);

      const userPayload = {
        user_id: res.locals.user_id,
        username: res.locals.username,
        email: res.locals.email,
        role: res.locals.role,
      };

      if (rememberMe) {
        const token = jwt.sign(userPayload, process.env.AUTH_JWT_SECRET as string, {
          expiresIn: '30d',
        });
        res.cookie(process.env.REMEMBER_TOKEN as string, token, {
          maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // Set to true if using HTTPS
          sameSite: 'lax',
        });
      }

      req.session.save((saveErr) => {
        if (saveErr) {
          next(saveErr);
        }
        res.status(200).json({
          user: userPayload,
        });
      });
    });
  } else {
    throw new Error('Invalid Password');
  }
};

const logoutEmployee = async (req: Request, res: Response, next: NextFunction) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }

    res.clearCookie('connect.sid', { path: '/' }); // Clear the session cookie
    res.clearCookie(process.env.REMEMBER_TOKEN as string, { path: '/' }); // Clear the remember me cookie
    if (err) {
      next(err);
    }
    res.status(200).json({ message: 'Logout successful' });
  });
};

const getAuthUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    if (!validator.isEmail(username) && !validator.isMobilePhone(username, 'any', { strictMode: false })) {
      res.status(400).json({ message: 'Invalid email or contact number format' });
      return;
    }

    // Check if the employee exists
    const user = await model.getAuthUser(username);
    if (!user) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    res.locals.hash = user.password;
    res.locals.username = user.employee_name || user.name || user.email.split('@')[0];
    res.locals.user_id = user.id;
    res.locals.email = user.email;
    res.locals.role = user.role_name;
    next();
  } catch (error) {
    next(error);
  }
};

const createAndInviteEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    if (await model.getAuthUser(email)) {
      res.status(409).json({ message: 'User with this email already exists.' });
      return;
    }

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

const verifyInviteURL = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token: string = req.query.token as string;

  if (!token) {
    res.status(400).json({ message: 'Token is required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.INV_JWT_SECRET as string) as unknown as InvJwtPayload;
    const { email } = decoded;

    res.locals.email = email;

    const employee = await model.getUserData(email);

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    res.status(200).send();
  } catch (error) {
    console.error('Error verifying invitation url', error);
    next(error);
  }
};

const acceptInvitation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token: string = req.query.token as string;
  const password: string = req.body.password;
  if (!token) {
    res.status(400).json({ message: 'Token is required' });
    return;
  }
  if (!password) {
    res.status(400).json({ message: 'Password is required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.INV_JWT_SECRET as string) as unknown as InvJwtPayload;
    const { email } = decoded;

    res.locals.email = email;

    const employee = await model.getUserData(email);

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    res.locals.isInvite = true;

    next();
  } catch (error) {
    console.error('Error accepting invitation');
    next(error);
  }
};

const updateEmployeePassword = async (req: Request, res: Response, next: NextFunction) => {
  const password_hash = res.locals.hash;

  try {
    await model.updateEmployeePassword(res.locals.email, password_hash, res.locals.isInvite);

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password', error);
    throw new Error('Error updating password');
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

const regenerateInvitationLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: 'Email is required' });
    return;
  }

  try {
    const user = await model.getUserData(email);
    if (!user) {
      res.status(404).json({ message: 'Employee not found.' });
      return;
    }

    await model.touchEmployee(email);

    const token = jwt.sign({ email: email }, process.env.INV_JWT_SECRET as string, {
      expiresIn: '3d',
    });
    const callbackUrl = `${process.env.LOCAL_FRONTEND_URL as string}/reset-password?token=${token}`;

    res.status(200).json({ message: 'Invitation link regenerated successfully', callbackUrl });
  } catch (error) {
    console.error('Error regenerating invitation link', error);
    next(error);
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
  defaultPassword,
  getAuthUser,
  loginEmployee,
  logoutEmployee,
  createAndInviteEmployee,
  acceptInvitation,
  updateEmployeePassword,
  getAllEmployees,
  regenerateInvitationLink,
  getAllEmployeesForDropdown,
  getAllRolesForDropdown,
  verifyInviteURL,
  getBasicEmployeeDetails,
  updateEmployee,
  getEmployeeById,
  getAllActivePositions,
  getEmployeeNameByEmployeeId,
  // getOnlyEmployeeById
};
