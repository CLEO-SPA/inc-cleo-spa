import express from 'express';
const router = express.Router();

import employeeController from '../controllers/employeeController.js';
import { hashPassword, comparePassword } from '../middlewares/bcryptMiddleware.js';

router.post(
  '/register',
  employeeController.defaultPassword,
  hashPassword,
  employeeController.createEmployee
  // employeeController.inviteEmployee
);

router.post('/invites', employeeController.acceptInvitation, hashPassword, employeeController.updateEmployeePassword);

router.get('/', employeeController.getAllEmployees);

export default router;
