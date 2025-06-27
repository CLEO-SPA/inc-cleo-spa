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

// GET /api/em/basic-details - for search functionality
router.get('/basic-details', employeeController.getBasicEmployeeDetails);

// GET /api/em/positions - for position dropdown
router.get('/positions', employeeController.getAllActivePositions);

// GET /api/em/dropdown - for employee lists for dropdown option
router.get('/dropdown', employeeController.getAllEmployeesForDropdown);

// GET /api/em/employeeName/:employeeId - for employee name by employee ID
router.get('/employeeName/:employeeId', employeeController.getEmployeeNameByEmployeeId);

// GET /api/em/:employeeId - for employee details
router.get('/:employeeId', employeeController.getEmployeeById);



// router.get('/', employeeController.getAllEmployees);
// router.get('/dropdown', employeeController.getAllEmployeesForDropdown);
// router.get('/basic-details', employeeController.getBasicEmployeeDetails);

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
