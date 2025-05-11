import model from '../models/employeeModel.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.status(200).json({
      isAuthenticated: true,
      user: { id: req.session.userId },
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

const setUpSuperUser = async (req, res, next) => {
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
