import express from 'express';
const router = express.Router();

import isAuthenticated from '../middlewares/authMiddleware.js';

import controller from '../controllers/stController.js';

// =========================
// Public routes
// =========================

// =========================
// Private routes
// =========================
router.use(isAuthenticated);

router.get('/list', controller.getSalesTransactionList);
router.get('/list/:id', controller.getSalesTransactionById);
router.get('/services', controller.searchServices);
router.get('/products', controller.searchProducts);
// router.all('/e', roleMiddleware.hasRole(['data_admin', 'super_admin']), controller.emulateCarePackage);
router.post('/services-products', controller.createServicesProductsTransaction);
router.post('/mcp', controller.createMcpTransaction);
router.post('/mv', controller.createMvTransaction);
router.post('/mcp-transfer', controller.createMcpTransferTransaction);
router.post('/mv-transfer', controller.createMvTransferTransaction);
router.post('/pp/:id', controller.processPartialPayment);

export default router;
