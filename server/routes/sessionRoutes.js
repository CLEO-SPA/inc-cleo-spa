import express from 'express';
const router = express.Router();

import sessionController from '../controllers/sessionController.js';

router.post('/sdr', sessionController.setDateRange);
router.get('/gdr', sessionController.getDateRange);

export default router;
