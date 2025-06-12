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
router.get('/all', controller.getAllSaleTransaction);

// router.all('/e', roleMiddleware.hasRole(['data_admin', 'super_admin']), controller.emulateCarePackage);


export default router;
