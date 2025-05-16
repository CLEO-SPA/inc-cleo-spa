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
router.post(
  '/sim',
  // roleMiddleware.hasRole('data_admin'),
  sessionController.toggleSimulation
);

export default router;
