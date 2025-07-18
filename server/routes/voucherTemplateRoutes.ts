import express from 'express';
import controller from '../controllers/voucherTemplateController.js';

const router = express.Router();
import isAuthenticated from '../middlewares/authMiddleware.js';

// =========================
// Public routes
// =========================

// =========================
// Private routes
// =========================
router.use(isAuthenticated);

router.get('/', controller.getAllVoucherTemplates);
router.get('/dropdown', controller.getAllVoucherTemplatesForDropdown);
router.get('/:id', controller.getVoucherTemplateById);
router.post('/', controller.createVoucherTemplate);
router.put('/:id', controller.updateVoucherTemplate);
router.delete('/:id', controller.deleteVoucherTemplate);

export default router;
