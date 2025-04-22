import express from 'express';
const router = express.Router();

import employeeController from '../controllers/employeeController.js';
import { hashPassword, comparePassword } from '../middlewares/bcryptMiddleware.js';

router.post('/login', employeeController.getAuthEmployee, comparePassword, employeeController.loginEmployee);
router.post('/logout', employeeController.logoutEmployee);
router.post('/register', hashPassword, employeeController.createEmployee);

export default router;
