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

// API: /api/refunds/-
router.get('/all', controller.viewAllRefundSaleTransactionRecords);
// Fetch all service transactions. Includes optional filters for member_id, member_name, receipt_no, start_date_utc, and end_date_utc
router.get('/service-transactions', controller.getServiceTransactionsForRefund);
router.post('/service', controller.processRefundService);

/////////////////////////////

//Process a refund for member care packages
router.post(
  '/mcp',
  controller.validateMCPExists,
  controller.verifyRefundableServices,
  controller.processFullRefund
);

//Return the info for member care package services
router.get('/mcp-status/:id', controller.fetchMCPStatus);

//Search for a member via name (searchbar)
router.get('/members/search', controller.searchMembers);

//Get MCP info
router.get('/members/get-mcps/:memberId', controller.getMemberCarePackages);

// Search for member care packages
router.get('/mcp/search', controller.searchMemberCarePackages);

export default router;