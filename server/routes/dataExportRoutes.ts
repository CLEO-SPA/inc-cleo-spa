import express from 'express';
const router = express.Router();

// import { hashPassword } from '../middlewares/bcryptMiddleware.js';
// import roleMiddleware from '../middlewares/roleMiddleware.js';
// import isAuthenticated from '../middlewares/authMiddleware.js';

import dataExport from '../controllers/dataExportController.js';

// =========================
// Public routes
// =========================
router.get('/get-member-details', dataExport.getMemberDetails);

router.get('/get-minimum-time-since-used-member-voucher', dataExport.getUnusedVoucher);

router.get('/get-minimum-time-since-used-member-care-package', dataExport.getUnusedCarePackage);

// =========================
// Private routes
// =========================
// router.use(isAuthenticated);

export default router;