import express from 'express';
const router = express.Router();

// import isAuthenticated from '../middlewares/authMiddleware.js';

import controller from '../controllers/stController.js';

// =========================
// Public routes
// =========================

// =========================
// Private routes
// =========================
// router.use(isAuthenticated);
router.get('/list', controller.getSalesTransactionList);
router.get('/list/:id', controller.getSalesTransactionById);
router.get('/services', controller.searchServices);
router.get('/products', controller.searchProducts);
// router.all('/e', roleMiddleware.hasRole(['data_admin', 'super_admin']), controller.emulateCarePackage);


export default router;
