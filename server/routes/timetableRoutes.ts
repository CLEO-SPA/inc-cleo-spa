import express from 'express';
import timetableController from '../controllers/timetableController.js';

const router = express.Router();

// GET /api/tt/timetables?month=2025-02&page=1&limit=20
router.get('/', timetableController.getActiveRestDays);

// GET /api/tt/employee/:employeeId?month=2025-02  
router.get('/employee/:employeeId', timetableController.getActiveRestDaysByEmployee);

// GET /api/tt/position/:positionId?month=2025-02
router.get('/position/:positionId', timetableController.getActiveRestDaysByPosition);

export default router;