import express from 'express';
const router = express.Router();

import simulationMiddleware from '../middlewares/simulationMiddleware.js';

// import superAdminRoutes from './superAdminRoutes.js';
import authRoutes from './authRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import memberRoutes from './memberRoutes.js';
import carePackageRoutes from './cpRoutes.js';
import membershipTypeRoutes from './membershipTypeRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import voucherTemplateRoutes from './voucherTemplateRoutes.js';
import memberCarePackageRoutes from './mcpRoutes.js';
import memberVoucherRoutes from './memberVoucherRoutes.js';
import dataExportRoutes from './dataExportRoutes.js';
import positionRoutes from './positionRoutes.js';
import paymentMethodRoutes from './paymentMethodRoutes.js';

router.use(simulationMiddleware);

router.use('/auth', authRoutes);
router.use('/session', sessionRoutes);
router.use('/mv', memberVoucherRoutes);
router.use('/service', serviceRoutes);
router.use('/member', memberRoutes);
router.use('/cp', carePackageRoutes);
router.use('/membership-type', membershipTypeRoutes);
router.use('/mcp', memberCarePackageRoutes);
router.use('/em', employeeRoutes);
router.use('/voucher-template', voucherTemplateRoutes);
router.use('/position', positionRoutes);
router.use('/de', dataExportRoutes);
router.use('/payment-method', paymentMethodRoutes);
// router.use('/sa', superAdminRoutes);

export default router;
