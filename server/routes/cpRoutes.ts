import express from 'express';
const router = express.Router();

import roleMiddleware from '../middlewares/roleMiddleware.js';
import isAuthenticated from '../middlewares/authMiddleware.js';

import controller from '../controllers/cpController.js';

// =========================
// Public routes
// =========================

// =========================
// Private routes
// =========================
router.use(isAuthenticated);

router.all('/e', roleMiddleware.hasRole(['data_admin', 'super_admin']), controller.emulateCarePackage);

router.get('/pkg', controller.getAllCarePackages);
router.get('/pkg/:id', controller.getCarePackageById);

router.post('/c', controller.createCarePackage);

router.put('/u', controller.updateCarePackageById);

router.delete('/:id', roleMiddleware.hasRole(['data_admin', 'super_admin']), controller.deleteCarePackageById);

export default router;
