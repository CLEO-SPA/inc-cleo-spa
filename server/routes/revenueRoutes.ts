import express from 'express';
const router = express.Router();

import isAuthenticated from '../middlewares/authMiddleware.js';

import controller from '../controllers/revenueController.js';

// =========================
// Public routes
// =========================

// =========================
// Private routes
// =========================
// router.use(isAuthenticated);

router.get('/mrr/mv', controller.getMVMonthlyReport);
router.get('/mrr/mcp', controller.getMCPMonthlyReport);
router.get('/mrr/adhoc', controller.getAdHocMonthlyReport);
router.get('/earliest', controller.getEarliestTransactionDate);

export default router;
