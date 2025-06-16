import express from 'express';
const router = express.Router();

import roleMiddleware from '../middlewares/roleMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';

import sessionController from '../controllers/sessionController.js';

// =========================
// Public routes
// =========================

// =========================
// Private routes
// =========================
router.use(authMiddleware);
router.post('/sdr', sessionController.setDateRange);
router.get('/gdr', sessionController.getDateRange);

router.get('/sim', sessionController.getSimulation);
router.post('/sim', roleMiddleware.hasRole(['super_admin', 'data_admin']), sessionController.toggleSimulation);

// SSE event
router.get('/events', sessionController.streamSimEvent);
router.get('/test-sse', sessionController.testSSE);

// Misc
router.get('/status', sessionController.getAllStatus);
router.get('/status/:id', sessionController.getStatusNameById);

export default router;
