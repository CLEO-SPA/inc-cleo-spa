import express from 'express';
const router = express.Router();

import isAuthenticated from '../middlewares/authMiddleware.js';

import controller from '../controllers/voucherTemplateController.js';

// =========================
// Public routes
// =========================

// =========================
// Private routes
// =========================
router.use(isAuthenticated);

router.get('/details', controller.getVoucherTemplatesDetailsHandler);
router.get('/vm', controller.getVoucherTemplateNamesHandler);
router.get('/', controller.getAllVoucherTemplates);
router.get('/dropdown', controller.getAllVoucherTemplatesForDropdown);
router.get('/:id', controller.getVoucherTemplateById);
router.post('/', controller.createVoucherTemplate);
router.put('/:id', controller.updateVoucherTemplate);
router.delete('/:id', controller.deleteVoucherTemplate);

export default router;