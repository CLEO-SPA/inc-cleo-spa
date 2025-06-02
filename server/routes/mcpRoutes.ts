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

router.get('/pkg', controller.getAllMemberCarePackages);
router.get('/pkg/:id', controller.getMemberCarePackageById);

router.post('/c', controller.createMemberCarePackage);

router.put('/u', controller.updateMemberCarePackage);

export default router;
