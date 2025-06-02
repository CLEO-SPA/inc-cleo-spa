import express from 'express';
const router = express.Router();

import simulationMiddleware from '../middlewares/simulationMiddleware.js';

// import superAdminRoutes from './superAdminRoutes.js';
import authRoutes from './authRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import membershipTypeRoutes from './membershipTypeRoutes.js';
// import employeeRoutes from './employeeRoutes.js';

router.use(simulationMiddleware);

router.use('/auth', authRoutes);
router.use('/session', sessionRoutes);
// router.use('/employee', employeeRoutes);
router.use('/membership-type', membershipTypeRoutes);

// router.use('/sa', superAdminRoutes);

export default router;
