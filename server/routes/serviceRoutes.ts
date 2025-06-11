import express from 'express';
import serviceController from '../controllers/serviceController.js';

const router = express.Router();

// Get all services
router.get('/', serviceController.getAllServices);

// get enabled service by id
router.get('/enabled-id/:id', serviceController.getEnabledServiceById);

// Get services with pagination and filter
router.get('/all-page-filter', serviceController.getServicesPaginationFilter);

// Get services by category
// router.get('/all-by-cat/:category_id')

// for service dropdown
router.get('/dropdown', serviceController.getAllServicesForDropdown);

// get service by id
router.get('/:id', serviceController.getServiceById);

export default router;
