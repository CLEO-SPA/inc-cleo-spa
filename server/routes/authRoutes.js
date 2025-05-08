import express from 'express';
const router = express.Router();

import authController from '../controllers/authController.js';
import employeeController from '../controllers/employeeController.js';
import { comparePassword } from '../middlewares/bcryptMiddleware.js';

router.post('/login', employeeController.getAuthEmployee, comparePassword, employeeController.loginEmployee);
router.post('/logout', employeeController.logoutEmployee);

router.get('/check-session', authController.isAuthenticated);

export default router;
