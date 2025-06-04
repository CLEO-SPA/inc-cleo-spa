import express from 'express';
const router = express.Router();

import simulationMiddleware from '../middlewares/simulationMiddleware.js';

import authRoutes from './authRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import memberRoutes from './memberRoutes.js';
import carePackageRoutes from './cpRoutes.js';
import membershipTypeRoutes from './membershipTypeRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import voucherTemplateRoutes from './voucherTemplateRoutes.js';
// router.use(simulationMiddleware);

router.use('/auth', authRoutes);
router.use('/session', sessionRoutes);
router.use('/service', serviceRoutes);
router.use('/member', memberRoutes);
router.use('/cp', carePackageRoutes);
router.use('/membership-type', membershipTypeRoutes);
router.use('/employee', employeeRoutes);
router.use('/voucher-template', voucherTemplateRoutes);
// router.use('/sa', superAdminRoutes);

export default router;
