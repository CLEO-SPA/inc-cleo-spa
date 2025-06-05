import express from 'express';
const router = express.Router();
import isAuthenticated from '../middlewares/authMiddleware.js';
import appointmentController from '../controllers/appointmentController.js';

// =========================
// Private routes
// =========================
// router.use(isAuthenticated);

router.get('/', appointmentController.getAllAppointments);
router.get('/date/:date', appointmentController.getAppointmentsByDate);

export default router;