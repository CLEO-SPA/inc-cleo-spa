import express from 'express';
import isAuthenticated from '../middlewares/authMiddleware.js';
import appointmentController from '../controllers/appointmentController.js';

const router = express.Router();

// =========================
// Private routes
// =========================
// router.use(isAuthenticated);

router.get('/', appointmentController.getAllAppointments);
router.get('/date/:date', appointmentController.getAppointmentsByDate);

// Get appointment timeslots by employee and appointment date
router.get('/employee/:employeeId/date/:date', appointmentController.getTimeslotsByEmployeeAndDate);

// Create bulk appointment
router.post('/create', appointmentController.createAppointment);

export default router;