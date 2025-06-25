import express from 'express';
import isAuthenticated from '../middlewares/authMiddleware.js';
import appointmentController from '../controllers/appointmentController.js';

const router = express.Router();

// =========================
// Private routes
// =========================
router.use(isAuthenticated);

router.get('/', appointmentController.getAllAppointments);
router.get('/date/:date', appointmentController.getAppointmentsByDate);
router.get('/id/:id', appointmentController.getAppointmentById);

/////////////////////////////////////////////////////////////
// Get appointment timeslots by employee and appointment date
/////////////////////////////////////////////////////////////

// GET /timeslots?employeeId=11&date=2025-06-12&excludeAppointmentId=1
router.get('/timeslots', appointmentController.getAvailableTimeslots);

// GET /timeslots/end-times?employeeId=11&date=2025-06-12&startTime=10:00&excludeAppointmentId=1
router.get('/timeslots/end-times', appointmentController.getEndTimesForStartTime);


// Create bulk appointment
router.post('/create', appointmentController.validateEmployeeAndMember, appointmentController.createAppointment);

// Update single appointment
router.put('/update', appointmentController.validateEmployeeAndMember, appointmentController.updateAppointment);

export default router;