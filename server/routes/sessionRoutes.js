import express from 'express';
import validator from 'validator';
const router = express.Router();

import sessionController from '../controllers/sessionController.js';

router.post('/set-date-range', sessionController.setDateRange);

export default router;
