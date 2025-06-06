import express from 'express';
const router = express.Router();

import timetableController from '../controllers/timetableController.js';

// =========================
// Private routes
// =========================
// router.use(isAuthenticated);

// GET /api/et/current-and-upcoming/:employeeId?currentDate=YYYY-MM-DD
router.get('/current-and-upcoming/:employeeId', timetableController.getCurrentAndUpcomingTimetables);

export default router;
