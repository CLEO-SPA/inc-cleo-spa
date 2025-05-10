import express from 'express';
const router = express.Router();

import superAdminRoutes from './superAdminRoutes.js';
import authRoutes from './authRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import employeeRoutes from './employeeRoutes.js';

router.use('/auth', authRoutes);
router.use('/session', sessionRoutes);
router.use('/employee', employeeRoutes);

router.use('/sa', superAdminRoutes);

export default router;
