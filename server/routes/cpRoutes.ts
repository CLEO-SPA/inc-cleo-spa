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

router.get('/dropdown', controller.getCarePackagesForDropDown);
router.get('/pkg', controller.getAllCarePackages);
router.get('/pkg/:id', controller.getCarePackageById);
router.get('/pkgpc' , controller.getCarePackagePurchaseCount);

router.post('/create', controller.createCarePackage);

router.put('/u', controller.updateCarePackageById);

router.delete('/:id/del', roleMiddleware.hasRole(['data_admin', 'super_admin']), controller.deleteCarePackageById);

export default router;
