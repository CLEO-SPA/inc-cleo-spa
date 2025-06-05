import model from '../models/employeeModel.js';
import { getCurrentSimStatus } from '../services/simulationService.js';
import mailService from '../services/mailService.js';
import validator from 'validator';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const defaultPassword = async (req, res, next) => {
  const randomPassword = crypto.randomBytes(8).toString('hex');
  req.body.password = randomPassword;
  next();
};

const loginEmployee = async (req, res) => {
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
      req.session.startDate_utc = getCurrentSimStatus().isActive ? start_date_utc : null;
      req.session.endDate_utc = getCurrentSimStatus().isActive ? end_date_utc : new Date();
      req.session.user_id = res.locals.user_id;
      req.session.username = res.locals.username;
      req.session.email = res.locals.email;
      req.session.role = res.locals.role;

      const userPayload = {
        user_id: res.locals.user_id,
        username: res.locals.username,
        email: res.locals.email,
        role: res.locals.role,
      };

      if (rememberMe) {
        const token = jwt.sign(userPayload, process.env.JWT_SECRET, {
          expiresIn: '30d',
        });
        res.cookie(process.env.REMEMBER_TOKEN, token, {
          maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // Set to true if using HTTPS
          sameSite: 'lax',
        });
      }

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Error saving session:', saveErr);
          return res.status(500).json({ message: 'Session save error' });
        }
        res.status(200).json({
          user: userPayload,
        });
      });
    });
  } else {
    res.status(401).json({ message: 'Invalid password' });
  }
};

const logoutEmployee = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }

    res.clearCookie('connect.sid', { path: '/' }); // Clear the session cookie
    res.clearCookie(process.env.REMEMBER_TOKEN, { path: '/' }); // Clear the remember me cookie
    if (err) {
      return res.status(500).json({ message: 'Session error during logout' });
    }
    res.status(200).json({ message: 'Logout successful' });
  });
};

const getAuthUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!validator.isEmail(username) && !validator.isMobilePhone(username, 'any', { strictMode: false })) {
      return res.status(400).json({ message: 'Invalid email or contact number format' });
    }

    // Check if the employee exists
    const user = await model.getAuthUser(username);
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.locals.hash = user.password;
    res.locals.username = user.employee_name || user.name || user.email.split('@')[0];
    res.locals.user_id = user.id;
    res.locals.email = user.email;
    res.locals.role = user.role_name;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error getting employee', error: error.message });
  }
};

// eslint-disable-next-line no-unused-vars
const createEmployee = async (req, res, next) => {
  try {
    const {
      employee_code,
      department_id,
      employee_contact,
      employee_email,
      employee_name,
      position_id,
      employee_role,
      // eslint-disable-next-line no-unused-vars
      employeeIsActive,
      commission_percentage,
    } = req.body;
    const password_hash = res.locals.hash;

    if (
      !employee_code ||
      !department_id ||
      !employee_contact ||
      !employee_email ||
      !employee_name ||
      !position_id ||
      !employee_role
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!validator.isEmail(employee_email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (!validator.isMobilePhone(employee_contact, 'any', { strictMode: false })) {
      return res.status(400).json({ message: 'Invalid contact number format' });
    }
    if (commission_percentage && !validator.isFloat(commission_percentage.toString(), { min: 0 })) {
      return res.status(400).json({ message: 'Invalid commission percentage' });
    }

    // Check if the employee code already exists
    const exists = await model.checkEmployeeCodeExists(employee_code);
    if (exists) {
      return res.status(400).json({ message: 'Employee code already exists' });
    }

    // Create the new employee
    const newEmployee = await model.createEmployee({ ...req.body, password_hash });

    const token = jwt.sign({ email: employee_email }, process.env.JWT_SECRET, {
      expiresIn: '3d',
    });

    const callbackUrl = `${process.LOCAL_FRONTEND_URL}/invites?token=${token}`;

    // next();
    res.status(201).json({
      message: 'Employee created successfully',
      employee: newEmployee,
      url: callbackUrl,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating employee', error: error.message });
  }
};

const inviteEmployee = async (req, res) => {
  const { employeeEmail } = req.body;
  if (!employeeEmail) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const token = jwt.sign({ email: employeeEmail }, process.env.JWT_SECRET, {
      expiresIn: '3d',
    });
    const callbackUrl = `${process.LOCAL_FRONTEND_URL}/invites?token=${token}`;

    // console.log(`Invitation link: ${callbackUrl}`);

    await mailService.sendMail({
      to: employeeEmail,
      subject: 'Employee Invitation',
      text: `You have been invited to join. Click the link to accept the invitation: ${callbackUrl}`,
    });

    res.status(200).json({ message: 'Invitation sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending invitation', error: error.message });
  }
};

const acceptInvitation = async (req, res, next) => {
  const { token } = req.query;
  const { password } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }
  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email } = decoded;

    res.locals.email = email;

    const employee = await model.getUserData(email);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(400).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Error accepting invitation', error: error.message });
  }
};

const updateEmployeePassword = async (req, res) => {
  const password_hash = res.locals.hash;

  try {
    await model.updateEmployeePassword(res.locals.email, password_hash);

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password', error: error.message });
  }
};

const getAllEmployees = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { startDate_utc, endDate_utc } = req.session;

  try {
    const { employees, totalPages } = await model.getAllEmployees(offset, limit, startDate_utc, endDate_utc);

    res.status(200).json({
      currentPage: page,
      totalPages: totalPages,
      pageSize: limit,
      data: employees,
    });
  } catch (error) {
    console.log('Error getting employees:', error);
    res.status(500).json({ message: 'Error getting employees', error: error.message });
  }
};

const getAllEmployeesForDropdown = async (req, res) => {
  console.log("Fetching all employees for dropdown");
  try {
    const employees = await model.getAllEmployeesForDropdown();
    res.status(200).json(employees);
  } catch (error) {
    console.error('Error in getAllEmployeesForDropdown:', error);
    res.status(500).json({ message: 'Failed to fetch employees for dropdown' });
  }
};

const regenerateInvitationLink = async (req, res) => {
  const { employeeEmail } = req.body;
  if (!employeeEmail) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const token = jwt.sign({ email: employeeEmail }, process.env.JWT_SECRET, {
      expiresIn: '3d',
    });
    const callbackUrl = `${process.LOCAL_FRONTEND_URL}/invites?token=${token}`;

    await mailService.sendMail({
      to: employeeEmail,
      subject: 'Employee Invitation',
      text: `You have been invited to join. Click the link to accept the invitation: ${callbackUrl}`,
    });

    res.status(200).json({ message: 'Invitation link regenerated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error regenerating invitation link', error: error.message });
  }
};

export default {
  defaultPassword,
  createEmployee,
  getAuthUser,
  loginEmployee,
  logoutEmployee,
  inviteEmployee,
  acceptInvitation,
  updateEmployeePassword,
  getAllEmployees,
  getAllEmployeesForDropdown,
  regenerateInvitationLink,
};
