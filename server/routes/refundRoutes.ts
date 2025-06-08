import express from 'express';
const router = express.Router();

import isAuthenticated from '../middlewares/authMiddleware.js';

import controller from '../controllers/refundController.js';

// =========================
// Public routes
// =========================

// =========================
// Private routes
// =========================
router.use(isAuthenticated);

// - /api/refunds/all
router.get('/all', controller.viewAllRefundSaleTransactionRecords);

export default router;