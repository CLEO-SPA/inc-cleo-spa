import express from 'express';
import serviceController from '../controllers/serviceController.js';

const router = express.Router();

router.get('/dropdown', serviceController.getAllServicesForDropdown);
router.get('/enabled-id/:id', serviceController.getEnabledServiceById);

export default router;
