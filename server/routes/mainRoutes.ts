import express from 'express';
const router = express.Router();

import simulationMiddleware from '../middlewares/simulationMiddleware.js';

// import superAdminRoutes from './superAdminRoutes.js';
// import authRoutes from './authRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import voucherRoutes from './voucherRoute.js';
import employeeRoutes from './employeeRoutes.js';
import memberRoutes from './memberRoute.js';

router.use(simulationMiddleware);

// router.use('/auth', authRoutes);
router.use('/session', sessionRoutes);

router.use("/voucher", voucherRoutes)

router.use('/member', memberRoutes);
// router.use('/employee', employeeRoutes);
router.use('/em', employeeRoutes);

// router.use('/sa', superAdminRoutes);

export default router;
