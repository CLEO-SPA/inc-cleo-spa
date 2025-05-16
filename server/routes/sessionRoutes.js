import express from 'express';
const router = express.Router();

import roleMiddleware from '../middlewares/roleMiddleware.js';
import simMiddleware from '../middlewares/simulationMiddleware.js';

import sessionController from '../controllers/sessionController.js';

// =========================
// Public routes
// =========================

// =========================
// Private routes
// =========================
router.post('/sdr', simMiddleware, sessionController.setDateRange);
router.get('/gdr', sessionController.getDateRange);

router.get('/sim', sessionController.getSimulation);
router.post('/sim', roleMiddleware.hasRole('data_admin'), sessionController.toggleSimulation);
router.put('/updsim', roleMiddleware.hasRole('data_admin'), sessionController.updateSimulation);

export default router;
