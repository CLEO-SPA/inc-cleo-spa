import express from 'express';
const router = express.Router();

import roleMiddleware from '../middlewares/roleMiddleware.js';
import isAuthenticated from '../middlewares/authMiddleware.js';

import commissionController from '../controllers/commissionController.js';

// =========================
// Public routes
// =========================

// =========================
// Private routes
// =========================
// router.use(isAuthenticated);

// GET /api/com/commissionSettings - for commission rates for assigned employees
router.get('/commissionSettings', commissionController.getAllCommissionSettings);

// PUT /api/com/commissionSettings - update commission settings 
router.put('/commissionSettings', 
  commissionController.updateCommissionSettings  
);

// GET /api/com/employee/:employeeId/monthly?month=YYYY-MM
// This endpoint retrieves monthly commission data for a specific employee with daily breakdown
router.get('/employee/:employeeId/monthly', commissionController.getEmployeeMonthlyCommission);

// GET /api/com/employee/:employeeId/breakdown/:date
// This endpoint retrieves detailed commission breakdown for a specific employee and date
// Date format: YYYY-MM-DD (e.g., 2025-01-15)
router.get('/employee/:employeeId/breakdown/:date', commissionController.getEmployeeCommissionBreakdown);

export default router;
