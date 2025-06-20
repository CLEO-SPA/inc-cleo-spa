import { Request, Response, NextFunction } from 'express';
import model from '../models/employeeModel.js';
import { getCurrentSimStatus } from '../services/simulationService.js';
import validator from 'validator';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { InvJwtPayload } from '../types/auth.types.js';

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
      req.session.end_date_is_default = getCurrentSimStatus().isActive ? false : true;
      req.session.user_id = res.locals.user_id;
      req.session.username = res.locals.username;
      req.session.email = res.locals.email;
      req.session.role = res.locals.role;

      console.log('My Date: ', req.session.end_date_utc);

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

// const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const {
//       employee_code,
//       department_id,
//       employee_contact,
//       employee_email,
//       employee_name,
//       position_id,
//       employee_role,
//       // eslint-disable-next-line no-unused-vars
//       employeeIsActive,
//       commission_percentage,
//     } = req.body;
//     const password_hash = res.locals.hash;

//     if (
//       !employee_code ||
//       !department_id ||
//       !employee_contact ||
//       !employee_email ||
//       !employee_name ||
//       !position_id ||
//       !employee_role
//     ) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }
//     if (!validator.isEmail(employee_email)) {
//       return res.status(400).json({ message: 'Invalid email format' });
//     }
//     if (!validator.isMobilePhone(employee_contact, 'any', { strictMode: false })) {
//       return res.status(400).json({ message: 'Invalid contact number format' });
//     }
//     if (commission_percentage && !validator.isFloat(commission_percentage.toString(), { min: 0 })) {
//       return res.status(400).json({ message: 'Invalid commission percentage' });
//     }

//     // Check if the employee code already exists
//     const exists = await model.checkEmployeeCodeExists(employee_code);
//     if (exists) {
//       return res.status(400).json({ message: 'Employee code already exists' });
//     }

//     // Create the new employee
//     const newEmployee = await model.createEmployee({ ...req.body, password_hash });

//     const token = jwt.sign({ email: employee_email }, process.env.INV_JWT_SECRET as string, {
//       expiresIn: '3d',
//     });

//     const callbackUrl = `${process.env.LOCAL_FRONTEND_URL as string}/invites?token=${token}`;

//     // next();
//     res.status(201).json({
//       message: 'Employee created successfully',
//       employee: newEmployee,
//       url: callbackUrl,
//     });
//   } catch (error) {
//     throw new Error('Error Creating Employee');
//   }
// };

// const inviteEmployee = async (req, res) => {
//   const { employeeEmail } = req.body;
//   if (!employeeEmail) {
//     return res.status(400).json({ message: 'Email is required' });
//   }

//   try {
//     const token = jwt.sign({ email: employeeEmail }, process.env.INV_JWT_SECRET, {
//       expiresIn: '3d',
//     });
//     const callbackUrl = `${process.LOCAL_FRONTEND_URL}/invites?token=${token}`;

//     // console.log(`Invitation link: ${callbackUrl}`);

//     await mailService.sendMail({
//       to: employeeEmail,
//       subject: 'Employee Invitation',
//       text: `You have been invited to join. Click the link to accept the invitation: ${callbackUrl}`,
//     });

//     res.status(200).json({ message: 'Invitation sent successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Error sending invitation', error: error.message });
//   }
// };

const acceptInvitation = async (req: Request, res: Response, next: NextFunction) => {
  const token: string = req.query.token as string;
  const password: string = req.body.password;
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }
  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.INV_JWT_SECRET as string) as unknown as InvJwtPayload;
    const { email } = decoded;

    res.locals.email = email;

    const employee = await model.getUserData(email);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    next();
  } catch (error) {
    console.error('Error accepting invitation');
    next(error);
  }
};

const updateEmployeePassword = async (req: Request, res: Response, next: NextFunction) => {
  const password_hash = res.locals.hash;

  try {
    await model.updateEmployeePassword(res.locals.email, password_hash);

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password', error);
    throw new Error('Error updating password');
  }
};

// const getAllEmployees = async (req: Request, res: Response, next: NextFunction) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const offset = (page - 1) * limit;
//   const { startDate_utc, endDate_utc } = req.session;

//   try {
//     const { employees, totalPages } = await model.getAllEmployees(offset, limit, startDate_utc, endDate_utc);

//     res.status(200).json({
//       currentPage: page,
//       totalPages: totalPages,
//       pageSize: limit,
//       data: employees,
//     });
//   } catch (error) {
//     console.log('Error getting employees:', error);
//     res.status(500).json({ message: 'Error getting employees', error: error.message });
//   }
// };

const regenerateInvitationLink = async (req: Request, res: Response, next: NextFunction) => {
  const employeeEmail = req.body;
  if (!employeeEmail) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const token = jwt.sign({ email: employeeEmail }, process.env.INV_JWT_SECRET as string, {
      expiresIn: '3d',
    });
    const callbackUrl = `${process.env.LOCAL_FRONTEND_URL as string}/invites?token=${token}`;

    res.status(200).json({ message: 'Invitation link regenerated successfully', callbackUrl });
  } catch (error) {
    console.error('Error regenerating invitation link', error);
    throw new Error('Error regenerating invitation link');
  }
};

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
  // createEmployee,
  getAuthUser,
  loginEmployee,
  logoutEmployee,
  // inviteEmployee,
  acceptInvitation,
  updateEmployeePassword,
  // getAllEmployees,
  regenerateInvitationLink,
  getBasicEmployeeDetails,
  getAllEmployeesForDropdown,
};
