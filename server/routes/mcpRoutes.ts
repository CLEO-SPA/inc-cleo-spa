import express from 'express';
const router = express.Router();

import roleMiddleware from '../middlewares/roleMiddleware.js';
import isAuthenticated from '../middlewares/authMiddleware.js';
import commissionMiddleware from '../middlewares/commissionMiddleware.js';

import controller from '../controllers/mcpController.js';

// =========================
// Public routes
// =========================

// =========================
// Private routes
// =========================
router.use(isAuthenticated);

router.all('/e', roleMiddleware.hasRole(['data_admin', 'super_admin']), controller.emulateMemberCarePackage);

router.get('/pkg', controller.getAllMemberCarePackages);
router.get('/dropdown/:memberId', controller.getMemberCarePackagesForDropdown);
router.get('/pkg/:id', controller.getMemberCarePackageById);

router.post('/create', controller.createMemberCarePackage);
router.post('/consume', controller.createConsumption, commissionMiddleware.applyMcpCommission);
router.post('/transfer', controller.transferMemberCarePackage);

router.put('/update', controller.updateMemberCarePackage);
router.put('/u/s', controller.updateMemberCarePackageStatus);

router.delete('/void/:id', roleMiddleware.hasRole(['data_admin', 'super_admin']), controller.removeMemberCarePackage); // Soft Delete
router.delete('/del/:id', roleMiddleware.hasRole('super_admin'), controller.deleteMemberCarePackage); // Hard Delete

export default router;
