import express from 'express';
import timetableController from '../controllers/timetableController.js';

const router = express.Router();

// GET /api/et/timetables?month=2025-02&page=1&limit=20
router.get('/', timetableController.getActiveRestDays);

// GET /api/et/employee/:employeeId?month=2025-02  
router.get('/employee/:employeeId', timetableController.getActiveRestDaysByEmployee);

// GET /api/et/position/:positionId?month=2025-02
router.get('/position/:positionId', timetableController.getActiveRestDaysByPosition);

// =========================
// Private routes
// =========================
// router.use(isAuthenticated);

// GET /api/et/current-and-upcoming/:employeeId?currentDate=YYYY-MM-DD
router.get('/current-and-upcoming/:employeeId', timetableController.getCurrentAndUpcomingTimetables);

export default router;
