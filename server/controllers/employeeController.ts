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
    const {
      employee_email,
      employee_name,
      employee_contact,
      employee_code,
      role_name,
      position_ids,
      created_at,
      updated_at,
    } = req.body;

    if (!employee_email || !employee_name || !employee_contact || !employee_code || !role_name) {
      res.status(400).json({ message: 'Missing required fields for employee creation.' });
      return;
    }
    if (!validator.isEmail(employee_email)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    const existingUser = await model.getAuthUser(employee_email);
    if (existingUser) {
      res.status(409).json({ message: 'User with this email already exists.' });
      return;
    }

    const defaultPassword = crypto.randomBytes(8).toString('hex');
    const password_hash = await bcrypt.hash(defaultPassword, 10);

    const results = await model.createAuthAndEmployee({
      email: employee_email,
      password_hash,
      phone: employee_contact,
      role_name,
      employee_code,
      employee_name,
      employee_is_active: true,
      position_ids,
      created_at,
      updated_at,
    });

    const token = jwt.sign({ email: employee_email }, process.env.INV_JWT_SECRET as string, {
      expiresIn: '3d',
    });

    const callbackUrl = `${process.env.LOCAL_FRONTEND_URL}/reset-password?token=${token}`;

    res.status(201).json({
      message: 'Employee created successfully. Please send the following link to the user to set their password.',
      resetUrl: callbackUrl,
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
      start_date_utc,
      end_date_utc,
    });
  } catch (error) {
    console.error('Error getting employees:', error);
    next(error);
  }
};

const regenerateInvitationLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const employeeEmail = req.body;
  if (!employeeEmail) {
    res.status(400).json({ message: 'Email is required' });
    return;
  }

  try {
    const token = jwt.sign({ email: employeeEmail }, process.env.INV_JWT_SECRET as string, {
      expiresIn: '3d',
    });
    const callbackUrl = `${process.env.LOCAL_FRONTEND_URL as string}/reset-password?token=${token}`;

    res.status(200).json({ message: 'Invitation link regenerated successfully', callbackUrl });
  } catch (error) {
    console.error('Error regenerating invitation link', error);
    throw new Error('Error regenerating invitation link');
  }
};

const getAllEmployeesForDropdown = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employees = await model.getAllEmployeesForDropdown();
    res.status(200).json(employees);
  } catch (error) {
    console.error('Error fetching employee list:', error);
    next(error);
  }
};

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
  verifyInviteURL,
};
