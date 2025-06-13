import express from 'express';
import serviceController from '../controllers/serviceController.js';

const router = express.Router();

// Get all services
router.get('/',serviceController.getAllServices);

// Get services with pagination and filter
router.get('/all-page-filter', serviceController.getServicesPaginationFilter);

// get enabled service by id
router.get('/enabled-id/:id', serviceController.getEnabledServiceById);

// Get services by category
router.get('/all-by-cat/:category_id', serviceController.getServicesByCategory)

// for service dropdown
router.get('/dropdown', serviceController.getAllServicesForDropdown);

// create a new service
router.post('/create-service', serviceController.validateServiceData, serviceController.createService)

// update service
router.put('/update-service/:id', serviceController.validateServiceData, serviceController.updateService)

// update service sequence
router.put('/reorder-service', serviceController.reorderService);

// SERVICE CATEGORIES ROUTES
//  get all service categories
router.get('/service-cat', serviceController.getServiceCategories)

// get service by id
router.get('/:id', serviceController.getServiceById);

export default router;
