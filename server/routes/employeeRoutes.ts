import express from 'express';
const router = express.Router();

import { hashPassword } from '../middlewares/bcryptMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';
import isAuthenticated from '../middlewares/authMiddleware.js';

import employeeController from '../controllers/employeeController.js';

// =========================
// Public routes
// =========================
router.post('/verify', employeeController.verifyInviteURL);

router.post('/invites', employeeController.acceptInvitation, hashPassword, employeeController.updateEmployeePassword);

// =========================
// Private routes
// =========================
router.use(isAuthenticated);

router.post(
  '/create-invite',
  roleMiddleware.hasRole(['super_admin', 'data_admin']),
  employeeController.createAndInviteEmployee
);


// GET /api/em/basic-details - for search functionality
router.get('/basic-details', employeeController.getBasicEmployeeDetails);

// GET /api/em/positions - for position dropdown
router.get('/positions', employeeController.getAllActivePositions);

// GET /api/em/dropdown - for employee lists for dropdown option
router.get('/dropdown', employeeController.getAllEmployeesForDropdown);

// GET /api/em/commission - for commission rates for assigned employees
router.get('/commissionSettings', employeeController.getAllCommissionSettings);

// GET /api/em/employeeName/:employeeId - for employee name by employee ID
router.get('/employeeName/:employeeId', employeeController.getEmployeeNameByEmployeeId);

// GET /api/em/:employeeId - for employee details
router.get('/:employeeId', employeeController.getEmployeeById);

router.get('/', employeeController.getAllEmployees);

router.post(
  '/regenerate-uri',
  roleMiddleware.hasRole(['super_admin', 'data_admin']),
  employeeController.regenerateInvitationLink
);

router.put('/:id', roleMiddleware.hasRole(['super_admin', 'data_admin']), employeeController.updateEmployee);

// GET /api/em/:id - for fetching a single employee by ID
// router.get('/:id', employeeController.getOnlyEmployeeById);

export default router;
