import express from 'express';
import serviceController from '../controllers/serviceController.js';

const router = express.Router();

// Get all services
router.get('/', serviceController.getAllServices);

// Get services with pagination and filter
router.get('/all-page-filter', serviceController.getServicesPaginationFilter);

// get enabled service by id
router.get('/enabled-id/:id', serviceController.getEnabledServiceById);

// Get services by category
// router.get('/all-by-cat/:category_id')

// TODO: add service prices for dropdown
// for service dropdown
router.get('/dropdown', serviceController.getAllServicesForDropdown);

// SERVICE CATEGORIES ROUTES
//  get all service categories
router.get('/service-cat', serviceController.getServiceCategories)

// get service by id
router.get('/:id', serviceController.getServiceById);

// create a new service
router.post('/create-service', serviceController.validateServiceData, serviceController.createService)

export default router;
