import express from 'express';
const router = express.Router();

import simulationMiddleware from '../middlewares/simulationMiddleware.js';

// import superAdminRoutes from './superAdminRoutes.js';
import authRoutes from './authRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import memberRoutes from './memberRoutes.js';
import carePackageRoutes from './cpRoutes.js';
import membershipTypeRoutes from './membershipTypeRoutes.js';
import memberCarePackageRoutes from './mcpRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import positionRoutes from './positionRoutes.js';

router.use(simulationMiddleware);

router.use('/auth', authRoutes);
router.use('/session', sessionRoutes);
router.use('/member', memberRoutes);
router.use('/cp', carePackageRoutes);
router.use('/membership-type', membershipTypeRoutes);
router.use('/mcp', memberCarePackageRoutes);
router.use('/service', serviceRoutes);
router.use('/employee', employeeRoutes);
router.use('/position', positionRoutes);
// router.use('/sa', superAdminRoutes);

export default router;
