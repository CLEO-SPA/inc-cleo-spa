// Example usage in a routes file
import express from 'express';
import roleMiddleware from '../middlewares/roleMiddleware.js';
import someController from '../controllers/someController.js';

const router = express.Router();

// Routes that require 'admin' role
router.get('/admin-only', 
  roleMiddleware.hasRole('admin'), 
  someController.adminOnlyFunction
);

// Routes that require either 'manager' OR 'supervisor' role
router.post('/manager-or-supervisor', 
  roleMiddleware.hasRole(['manager', 'supervisor']), 
  someController.managerFunction
);

export default router;