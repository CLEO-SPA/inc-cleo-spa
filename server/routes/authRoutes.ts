import express from 'express';
const router = express.Router();

import { comparePassword, hashPassword } from '../middlewares/bcryptMiddleware.js';
import isAuthenticated from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

import authController from '../controllers/authController.js';
import employeeController from '../controllers/employeeController.js';

// // =========================
// // Public routes
// // =========================
router.post('/login', authController.getAuthUser, comparePassword, authController.login);
router.post('/logout', authController.logout);

router.get('/status', authController.isAuthenticated);

router.post('/initsu/:token', authController.decodeSuperUserToken, hashPassword, authController.setUpSuperUser);

router.post('/verify', authController.verifyInviteURL);
router.post('/invites', authController.acceptInvitation, hashPassword, authController.updateUserPassword);

// =========================
// Private routes
// =========================
router.use(isAuthenticated);

router.post(
  '/regenerate-uri',
  roleMiddleware.hasRole(['super_admin', 'data_admin']),
  authController.regenerateInvitationLink
);

router.post('/create', roleMiddleware.hasRole('super_admin'), authController.createAndInviteUser);
router.put('/users/:id', authController.updateUser);
router.delete('/users/:id', authController.deleteUser);

router.get('/roles', employeeController.getAllRolesForDropdown);

export default router;
