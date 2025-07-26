import express from 'express';
const router = express.Router();

import isAuthenticated from '../middlewares/authMiddleware.js';

import dataExport from '../controllers/dataExportController.js';

// =========================
// Public routes
// =========================
router.use(isAuthenticated);

router.get('/get-member-details', dataExport.getMemberDetails);

router.get('/get-minimum-time-since-used-member-voucher', dataExport.getUnusedVoucher);

// =========================
// Private routes
// =========================

export default router;