import express from 'express';
const router = express.Router();

import roleMiddleware from '../middlewares/roleMiddleware.js';
import isAuthenticated from '../middlewares/authMiddleware.js';

import commissionController from '../controllers/commissionController.js';

// =========================
// Public routes
// =========================

// =========================
// Private routes
// =========================
router.use(isAuthenticated);

// GET /api/com/commissionSettings - for commission rates for assigned employees
router.get('/commissionSettings', commissionController.getAllCommissionSettings);

// PUT /api/com/commissionSettings - update commission settings 
router.put('/commissionSettings', 
  commissionController.updateCommissionSettings  
);

export default router;
