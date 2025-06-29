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
//router.use(isAuthenticated);

// API: /api/refund/-
// ------------------------------
// Service Refund
// ------------------------------
router.get('/service/all', controller.viewAllRefundSaleTransactionRecords);
// Fetch all service transactions. Includes optional filters for member_id, member_name, receipt_no, start_date_utc, and end_date_utc
router.get('/service-transactions', controller.getServiceTransactionsForRefund);
router.post('/service', controller.processRefundService);
// Fetch a specific sale transaction item by its ID
router.get('/service-item/:id', controller.getSaleTransactionItemById);


// ------------------------------
// Member Care Package Refund
// ------------------------------
//Process a refund for member care packages
router.post(
  '/mcp',
  controller.validateMCPExists,
  controller.verifyRefundableServices,  // Replaces checkRemainingServices
  controller.processFullRefund
);

//Return the service info of a member care package
router.get('/mcp-status/:id', controller.fetchMCPStatus);

//Search for a member via name (searchbar)
router.get('/members/search', controller.searchMembers);

//Get MCP info
router.get('/members/get-mcps/:memberId', controller.getMemberCarePackages);

// Search for member care packages
router.get('/mcp/search', controller.searchMemberCarePackages);

// ------------------------------
// Member Voucher Refund
// ------------------------------
router.post('/member-voucher', controller.processRefundMemberVoucher);
router.get('/member-voucher/member/:memberId', controller.getEligibleMemberVoucherForRefund);
router.get('/member-voucher/:voucherId', controller.getMemberVoucherById);

// ------------------------------
// Refund & Credit Note Listing
// ------------------------------
router.get('/records', controller.getAllRefundRecords);
router.get('/records/:id', controller.getRefundRecordDetails);

export default router;