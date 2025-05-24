import model from '../models/employeeModel.js';
import { getCurrentSimStatus } from '../services/simulationService.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const isAuthenticated = (req, res) => {
  const rememberToken = req.cookies && req.cookies[process.env.REMEMBER_TOKEN];
  const simParams = getCurrentSimStatus().params;
  const start_date_utc = simParams?.start_date_utc;
  const end_date_utc = simParams?.end_date_utc;
  if (rememberToken) {
    try {
      const decoded = jwt.verify(rememberToken, process.env.JWT_SECRET);
      if (!req.session.user_id) {
        req.session.startDate_utc = getCurrentSimStatus().isActive ? start_date_utc : null;
        req.session.endDate_utc = getCurrentSimStatus().isActive ? end_date_utc : new Date();
        req.session.user_id = decoded.user_id;
        req.session.username = decoded.username;
        req.session.email = decoded.email;
        req.session.role = decoded.role;
        req.session.save();
      }
      return res.status(200).json({
        isAuthenticated: true,
        user: {
          user_id: decoded.user_id,
          username: decoded.username,
          email: decoded.email,
          role: decoded.role,
        },
      });
    } catch (error) {
      console.warn('Invalid remember_me token:', error.message);
      res.clearCookie(process.env.REMEMBER_TOKEN, { path: '/' });
    }
  }

  if (req.session && req.session.userId) {
    return res.status(200).json({
      isAuthenticated: true,
      user: {
        user_id: req.session.user_id,
        username: req.session.username,
        email: req.session.email,
        role: req.session.role,
      },
    });
  }

  res.status(401).json({ message: 'Unauthorized: Please log in.' });
};

const decodeSuperUserToken = async (req, res, next) => {
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email, password } = decoded;

    req.body.password = password;
    req.body.email = email;

    next();
  } catch (error) {
    console.error('Error decoding super user token:', error);
    return null;
  }
};

const setUpSuperUser = async (req, res) => {
  try {
    // Check if no user exists in the database
    const userCount = await model.getUserCount();
    if (userCount > 0) {
      return res.status(400).json({ message: 'Super user already exists' });
    }

    const { email } = req.body;
    const password = res.locals.hash;

    await model.createSuperUser(email, password);

    res.status(201).json({ message: 'Super user created successfully' });
  } catch (error) {
    console.error('Error setting up super user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  isAuthenticated,
  setUpSuperUser,
  decodeSuperUserToken,
};
