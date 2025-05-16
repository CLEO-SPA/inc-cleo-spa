import express from 'express';
const router = express.Router();

import { comparePassword, hashPassword } from '../middlewares/bcryptMiddleware.js';

import authController from '../controllers/authController.js';
import employeeController from '../controllers/employeeController.js';

// =========================
// Public routes
// =========================
router.post('/login', employeeController.getAuthUser, comparePassword, employeeController.loginEmployee);
router.post('/logout', employeeController.logoutEmployee);
router.get('/status', authController.isAuthenticated);
router.post('/initsu/:token', authController.decodeSuperUserToken, hashPassword, authController.setUpSuperUser);

// =========================
// Private routes
// =========================

export default router;
