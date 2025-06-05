import express from 'express';
const router = express.Router();

import simulationMiddleware from '../middlewares/simulationMiddleware.js';

import superAdminRoutes from './superAdminRoutes.js';
import authRoutes from './authRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import memberRoutes from './memberRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';

router.use(simulationMiddleware);

router.use('/auth', authRoutes);
router.use('/session', sessionRoutes);
router.use('/employee', employeeRoutes);
router.use('/member', memberRoutes);

// =========================
// appintment routes
// =========================
router.use('/ab', appointmentRoutes);

router.use('/sa', superAdminRoutes);


export default router;
