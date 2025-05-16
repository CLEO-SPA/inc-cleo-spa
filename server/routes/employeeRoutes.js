import express from 'express';
const router = express.Router();

import { hashPassword } from '../middlewares/bcryptMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';
import isAuthenticated from '../middlewares/authMiddleware.js';

import employeeController from '../controllers/employeeController.js';

// =========================
// Public routes
// =========================
router.post(
  '/register',
  employeeController.defaultPassword,
  hashPassword,
  employeeController.createEmployee
  // employeeController.inviteEmployee
);
router.post('/invites', employeeController.acceptInvitation, hashPassword, employeeController.updateEmployeePassword);

// =========================
// Private routes
// =========================
router.use(isAuthenticated);
router.get('/', employeeController.getAllEmployees);
router.post(
  'regenerate-uri',
  roleMiddleware.hasRole(['super_admin', 'data_admin']),
  employeeController.regenerateInvitationLink
);

export default router;
