import model from '../models/employeeModel.js';
import validator from 'validator';

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
    const { employeeCode, password } = req.body;
    if (!employeeCode || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if the employee code exists
    const employee = await model.getAuthEmployee(employeeCode);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.locals.hash = employee.password_hash;
    res.locals.userId = employee.employee_id;
    next(); // Proceed to compare the password
  } catch (error) {
    res.status(500).json({ message: 'Error getting employee', error: error.message });
  }
};

const createEmployee = async (req, res, next) => {
  try {
    const {
      employeeCode,
      departmentId,
      employeeContact,
      employeeEmail,
      employeeName,
      positionId,
      employeeIsActive,
      commissionPercentage,
    } = req.body;
    const passwordHash = res.locals.hash;

    if (!employeeCode || !departmentId || !employeeContact || !employeeEmail || !employeeName || !positionId) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!validator.isEmail(employeeEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (!validator.isMobilePhone(employeeContact, 'any', { strictMode: false })) {
      return res.status(400).json({ message: 'Invalid contact number format' });
    }
    if (commissionPercentage && !validator.isFloat(commissionPercentage.toString(), { min: 0 })) {
      return res.status(400).json({ message: 'Invalid commission percentage' });
    }

    // Check if the employee code already exists
    const exists = await model.checkEmployeeCodeExists(employeeCode);
    if (exists) {
      return res.status(400).json({ message: 'Employee code already exists' });
    }

    // Create the new employee
    const newEmployee = await model.createEmployee({ ...req.body, passwordHash });

    return res.status(201).json(newEmployee);
  } catch (error) {
    res.status(500).json({ message: 'Error creating employee', error: error.message });
  }
};

export default {
  createEmployee,
  getAuthEmployee,
  loginEmployee,
  logoutEmployee,
};
