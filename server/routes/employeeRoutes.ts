import express from 'express';
const router = express.Router();

import { hashPassword } from '../middlewares/bcryptMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';
import isAuthenticated from '../middlewares/authMiddleware.js';

import employeeController from '../controllers/employeeController.js';

// =========================
// Public routes
// =========================
// router.post('/invites', employeeController.acceptInvitation, hashPassword, employeeController.updateEmployeePassword);

// =========================
// Private routes
// =========================
// router.use(isAuthenticated);

// router.get('/', employeeController.getAllEmployees);
router.get('/dropdown', employeeController.getAllEmployeesForDropdown);
router.get('/basic-details', employeeController.getBasicEmployeeDetails);

router.get('/', employeeController.getAllEmployees);
router.get('/dropdown', employeeController.getAllEmployeesForDropdown);

// router.post(
//   '/create',
//   employeeController.defaultPassword,
//   hashPassword,
//   employeeController.createEmployee
//   // employeeController.inviteEmployee
// );
// router.post(
//   'regenerate-uri',
//   roleMiddleware.hasRole(['super_admin', 'data_admin']),
//   employeeController.regenerateInvitationLink
// );

export default router;
