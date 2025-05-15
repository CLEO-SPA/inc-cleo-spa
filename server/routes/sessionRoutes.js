import express from 'express';
const router = express.Router();

import sessionController from '../controllers/sessionController.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';
import simMiddleware from '../middlewares/simulationMiddleware.js';

router.post('/sdr', simMiddleware, sessionController.setDateRange);
router.post('/sim', roleMiddleware.hasRole('data_admin'), sessionController.toggleSimulation);
router.post('/updsim', roleMiddleware.hasRole('data_admin'), sessionController.updateSimulation);
router.get('/sim', sessionController.getSimulation);
router.get('/gdr', sessionController.getDateRange);

export default router;
