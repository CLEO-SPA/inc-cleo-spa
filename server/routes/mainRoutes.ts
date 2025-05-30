import express from 'express';
const router = express.Router();

import simulationMiddleware from '../middlewares/simulationMiddleware.js';

import authRoutes from './authRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import carePackageRoutes from './cpRoutes.js';
// import employeeRoutes from './employeeRoutes.js';

router.use(simulationMiddleware);

router.use('/auth', authRoutes);
router.use('/session', sessionRoutes);
router.use('/cp', carePackageRoutes);
// router.use('/employee', employeeRoutes);

// router.use('/sa', superAdminRoutes);

export default router;
