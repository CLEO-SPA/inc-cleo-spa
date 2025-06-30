import express from 'express';
const router = express.Router();

import voucherController from '../controllers/voucherController.js';

// console.log("✅ Voucher routes file is loaded");

router.get('/', voucherController.getVoucherTemplatesDetailsHandler);
router.get('/m', voucherController.getMemberVoucherDetailsHandler);
router.get('/vm', voucherController.getVoucherTemplateNamesHandler);
router.post('/transfer', voucherController.transferVoucherDetailsHandler);

// Testing purposes
// http://localhost:3000/api/v/cFoc?memberId=51&voucher_id=32
// router.get("/cFOC", voucherController.checkIfFreeOfChargeIsUsedHandler);

// router.get("/FOCgone", voucherController.removeFOCFromVoucherHandler);

export default router;
