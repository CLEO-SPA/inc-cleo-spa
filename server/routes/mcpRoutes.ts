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

router.get('/pkgs', controller.getAllMemberCarePackages);

router.post('/c', controller.createMemberCarePackage);

export default router;
