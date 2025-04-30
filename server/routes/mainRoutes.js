import express from 'express';
const router = express.Router();

import authRoutes from './authRoutes.js';
import sessionRoutes from './sessionRoutes.js';

router.use('/auth', authRoutes);
router.use('/session', sessionRoutes);

export default router;
