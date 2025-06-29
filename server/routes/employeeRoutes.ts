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



router.get('/dropdown', employeeController.getAllEmployeesForDropdown);
router.get('/basic-details', employeeController.getBasicEmployeeDetails);

router.get('/', employeeController.getAllEmployees);

<<<<<<< HEAD
router.post(
  '/regenerate-uri',
  roleMiddleware.hasRole(['super_admin', 'data_admin']),
  employeeController.regenerateInvitationLink
);

router.put(
  '/:id', 
  employeeController.updateEmployee
);

router.get(
  '/:id',
  employeeController.getEmployeeById
);

=======
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
>>>>>>> origin/master

export default router;
