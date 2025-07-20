import express from 'express';
const router = express.Router();

import roleMiddleware from '../middlewares/roleMiddleware.js';
import isAuthenticated from '../middlewares/authMiddleware.js';

import commisionController from '../controllers/commissionController.js';

// =========================
// Public routes
// =========================

// =========================
// Private routes
// =========================
router.use(isAuthenticated);

// GET /api/com/commissionSettings - for commission rates for assigned employees
router.get('/commissionSettings', commisionController.getAllCommissionSettings);

export default router;
