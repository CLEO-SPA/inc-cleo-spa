import express from 'express';
import serviceController from '../controllers/serviceController.js';

const router = express.Router();

// Get all services
router.get('/',)

// get service by id
router.get('/:id', serviceController.getServiceById);

// get enabled service by id
router.get('/enabled-id/:id', serviceController.getEnabledServiceById);

// Get all enabled services
router.get('/all-enabled')

// Get services with pagination and filter
router.get('/all-page-filter')

// Get services by category
router.get('/all-by-cat/:category_id')

// for service dropdown
router.get('/dropdown', serviceController.getAllServicesForDropdown);





export default router;
