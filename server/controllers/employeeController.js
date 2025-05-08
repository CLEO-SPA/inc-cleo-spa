import model from '../models/employeeModel.js';
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

const loginEmployee = async (req, res, next) => {
  if (res.locals.result) {
    req.session.regenerate((err) => {
      if (err) {
        console.error('Error regenerating session:', err);
        return res.status(500).json({ message: 'Session error' });
      }
      req.session.userId = res.locals.userId;

      res.status(200).json({
        message: 'Login successful',
        userId: res.locals.userId,
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
      return res.status(500).json({ message: 'Session error' });
    }

    res.clearCookie('connect.sid', { path: '/' }); // Clear the session cookie
    res.status(200).json({ message: 'Logout successful' });
  });
};

const getAuthEmployee = async (req, res, next) => {
  try {
    const { emp_identity, password } = req.body;
    if (!emp_identity || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!validator.isEmail(emp_identity) || !validator.isMobilePhone(emp_identity, 'any', { strictMode: false })) {
      return res.status(400).json({ message: 'Invalid email or contact number format' });
    }

    // Check if the employee exists
    const employee = await model.getAuthEmployee(emp_identity);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.locals.hash = employee.password_hash;
    res.locals.userId = employee.employee_id;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error getting employee', error: error.message });
  }
};

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

    next();
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

    const employee = await model.getAuthEmployee(email);

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

  try {
    const { employees, totalPages } = await model.getAllEmployees(offset, limit);
    const totalItemsResult = await pool.query('SELECT COUNT(*) FROM employees');
    const totalItems = parseInt(totalItemsResult.rows[0].count);

    res.status(200).json({
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalItems,
      pageSize: limit,
      data: employees,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error getting employees', error: error.message });
  }
};

export default {
  defaultPassword,
  createEmployee,
  getAuthEmployee,
  loginEmployee,
  logoutEmployee,
  inviteEmployee,
  acceptInvitation,
  updateEmployeePassword,
  getAllEmployees,
};
