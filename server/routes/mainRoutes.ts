import express from 'express';
const router = express.Router();

import simulationMiddleware from '../middlewares/simulationMiddleware.js';

// import superAdminRoutes from './superAdminRoutes.js';
import authRoutes from './authRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import translationRoutes from './translationRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import memberRoutes from './memberRoutes.js';
import carePackageRoutes from './cpRoutes.js';
import membershipTypeRoutes from './membershipTypeRoutes.js';
import memberCarePackageRoutes from './mcpRoutes.js';

import refundRoutes from './refundRoutes.js';

import voucherTemplateRoutes from './voucherTemplateRoutes.js';
import memberVoucherRoutes from './memberVoucherRoutes.js';
import dataExportRoutes from './dataExportRoutes.js';
import positionRoutes from './positionRoutes.js';
import paymentMethodRoutes from './paymentMethodRoutes.js';

import employeeRoutes from './employeeRoutes.js';
import timetableRoutes from './timetableRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import productRoutes from './productRoutes.js';
import revenueRoutes from './revenueRoutes.js';
import stRoutes from './stRoutes.js';
import voucherRoutes from './voucherRoute.js';


router.use(simulationMiddleware);

router.use('/auth', authRoutes);
router.use('/session', sessionRoutes);
router.use('/trans', translationRoutes)

router.use('/member', memberRoutes);
router.use('/mv', memberVoucherRoutes);
router.use('/service', serviceRoutes);
router.use('/cp', carePackageRoutes);
router.use('/membership-type', membershipTypeRoutes);
router.use('/mcp', memberCarePackageRoutes);
router.use('/voucher-template', voucherTemplateRoutes);
router.use('/de', dataExportRoutes);
router.use('/refund', refundRoutes);
router.use('/position', positionRoutes);
router.use('/de', dataExportRoutes);
router.use('/payment-method', paymentMethodRoutes);
router.use('/st', stRoutes);
router.use('/voucher', voucherRoutes);
router.use('/em', employeeRoutes);
router.use('/et', timetableRoutes);
router.use('/ab', appointmentRoutes);
router.use('/rr', revenueRoutes);
// router.use('/sa', superAdminRoutes);
router.use('/product', productRoutes);

export default router;