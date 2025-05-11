import express from 'express';
const router = express.Router();

import authController from '../controllers/authController.js';
import employeeController from '../controllers/employeeController.js';
import { comparePassword, hashPassword } from '../middlewares/bcryptMiddleware.js';

router.post('/login', employeeController.getAuthUser, comparePassword, employeeController.loginEmployee);
router.post('/logout', employeeController.logoutEmployee);

router.get('/status', authController.isAuthenticated);

router.post('/initsu/:token', hashPassword, authController.setUpSuperUser);

export default router;
