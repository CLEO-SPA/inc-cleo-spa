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
router.get('/all-by-cat/:category_id', serviceController.getServicesByCategory);

// for service dropdown
router.get('/dropdown', serviceController.getAllServicesForDropdown);

// create a new service
router.post('/create-service', serviceController.validateServiceData, serviceController.createService);

// update service
router.put('/update-service/:id', serviceController.validateServiceData, serviceController.updateService);

// update service sequence
router.put('/reorder-service', serviceController.reorderService);

// update service status
// disable service
router.put('/disable-service/:id', serviceController.disableService);

// enable service
router.put('/enable-service/:id', serviceController.enableService);

// SERVICE CATEGORIES ROUTES
//  get all service categories
router.get('/service-cat', serviceController.getServiceCategories);
//  create a new service category
router.post('/create-service-cat', serviceController.createServiceCategory);
//  update service category by id
router.put('/update-service-cat/:catId', serviceController.updateServiceCategory);
//  reorder service category sequence number
router.put('/reorder-service-cat', serviceController.reorderServiceCategory);

// get service by id
router.get('/:id', serviceController.getServiceById);

// get sales history by service id, selected month and year
router.get('/sales-history/:serviceId', serviceController.getSalesHistoryByServiceId);

export default router;
