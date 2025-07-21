import express from 'express';

import isAuthenticated from '../middlewares/authMiddleware.js';

import serviceController from '../controllers/serviceController.js';

const router = express.Router();

// =========================
// Public routes
// =========================

// =========================
// Private routes
// =========================
router.use(isAuthenticated);
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
router.put('/service-status/:id', serviceController.changeServiceStatus);

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

// Get service categories with pagination and search filter
router.get('/service-cat/page-filter', serviceController.getServiceCategoriesPaginationFilter);

export default router;
