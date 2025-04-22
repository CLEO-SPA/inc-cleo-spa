import express from 'express';
const router = express.Router();

import employeeController from '../controllers/employeeController.js';
import { hashPassword, comparePassword } from '../middlewares/bcryptMiddleware.js';

router.post('/login', employeeController.getAuthEmployee, comparePassword, employeeController.loginEmployee);
router.post('/logout', employeeController.logoutEmployee);
router.post('/register', hashPassword, employeeController.createEmployee);

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }

  res.status(401).json({ message: 'Unauthorized: Please log in.' });
};

router.get('/check-session', isAuthenticated, (req, res) => {
  res.status(200).json({
    isAuthenticated: true,
    user: { id: req.session.userId },
  });
});

export default router;
