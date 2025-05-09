import express from 'express';
const router = express.Router();

import sessionController from '../controllers/sessionController.js';

router.post('/sdr', sessionController.setDateRange);

export default router;
