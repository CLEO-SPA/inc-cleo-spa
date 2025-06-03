import express from 'express';
const router = express.Router();

import roleMiddleware from '../middlewares/roleMiddleware.js';
import isAuthenticated from '../middlewares/authMiddleware.js';

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
router.get('/pkg/:id', controller.getMemberCarePackageById);

router.post('/create', controller.createMemberCarePackage);
router.post('/enable', controller.enableMemberCarePackage);
router.post('/consume', controller.createConsumption);

router.put('/update', controller.updateMemberCarePackage);

router.delete('/:id/rm', controller.removeMemberCarePackage);
router.delete('/:id/del', controller.deleteMemberCarePackage);

export default router;
