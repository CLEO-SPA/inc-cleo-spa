import express from 'express';
const router = express.Router();

import isAuthenticated from '../middlewares/authMiddleware.js';
import timetableController from '../controllers/timetableController.js';

// =========================
// Private routes
// =========================
router.use(isAuthenticated);

// GET /api/et/current-and-upcoming/:employeeId?currentDate=YYYY-MM-DD
router.get('/current-and-upcoming/:employeeId', timetableController.getCurrentAndUpcomingTimetables);

// POST /api/et/create-employee-timetable
router.post('/create-employee-timetable', timetableController.createTimetable);

// GET /api/et/timetables?month=2025-02&page=1&limit=20
router.get('/timetables', timetableController.getActiveRestDays);

// GET /api/et/timetableId
router.get('/:timetableId', timetableController.getTimetableById);

// PUT /api/et/update-employee-timetable/:timetableId
router.put('/update-employee-timetable/:timetableId', timetableController.updateTimetable);

// GET /api/et/employee/:employeeId?month=2025-02
router.get('/employee/:employeeId', timetableController.getActiveRestDaysByEmployee);

// GET /api/et/position/:positionId?month=2025-02
router.get('/position/:positionId', timetableController.getActiveRestDaysByPosition);

export default router;
