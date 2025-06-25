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

// API: /api/refunds/-
// Service Refund
router.get('/all', controller.viewAllRefundSaleTransactionRecords);
// Fetch all service transactions. Includes optional filters for member_id, member_name, receipt_no, start_date_utc, and end_date_utc
router.get('/service-transactions', controller.getServiceTransactionsForRefund);
router.post('/service', controller.processRefundService);

// Member Voucher Refund
router.post('/member-voucher', controller.processRefundMemberVoucher);
router.get('/member-voucher/:memberId', controller.getEligibleMemberVoucherForRefund);


export default router;