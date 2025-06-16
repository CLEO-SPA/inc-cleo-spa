import express from 'express';
const router = express.Router();

import isAuthenticated from '../middlewares/authMiddleware.js';

import controller from '../controllers/memberVoucherController.js';

// =========================
// Public routes
// =========================

// =========================
// Private routes
// =========================
router.use(isAuthenticated);

router.get('/v', controller.getAllMemberVouchers);

router.get('/:id/mn', controller.getMemberNameByMemberVoucherId);

router.get('/:id/s', controller.getAllServicesOfMemberVoucherById);

router.get('/:id/t', controller.getAllTransactionLogsOfMemberVoucherById);

router.post('/:id/t/create', controller.checkCurrentBalance, controller.checkPaidCurrentBalance ,controller.createTransactionLogsByMemberVoucherId);

router.put('/:id/t/update', controller.updateTransactionLogsAndCurrentBalanceByLogId);

router.delete('/:id/t/:transaction_log_id/delete', controller.deleteTransactionLogsByLogId);

export default router;
