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
router.get('/pkgs', controller.getAllCarePackages);
router.get('/:id', controller.getCarePackageById);

router.all('/e', roleMiddleware.hasRole(['data_admin', 'super_admin']), controller.emulateCarePackage);

router.post('/c', controller.createCarePackage);

router.put('/:id', roleMiddleware.hasRole(['data_admin', 'super_admin']), controller.updateCarePackageById);

router.delete('/:id', roleMiddleware.hasRole('super_admin'), controller.deleteCarePackageById);

export default router;
