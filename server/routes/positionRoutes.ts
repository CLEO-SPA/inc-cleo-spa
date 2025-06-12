import express from 'express';
const router = express.Router();
import roleMiddleware from '../middlewares/roleMiddleware.js';
import isAuthenticated from '../middlewares/authMiddleware.js';
import positionController from '../controllers/positionController.js';

// =========================
// Public routes
// =========================
// None for positions - all require authentication

// =========================
// Private routes
// =========================
router.use(isAuthenticated);

// Dropdown route (accessible to all authenticated users)
router.get('/dropdown', positionController.getAllPositionsForDropdown);

// Count route (for analytics/dashboard)
router.get('/count', positionController.getPositionCount);

// Get single position by ID 
router.get('/:id', positionController.getPositionById);

// Get all positions (paginated) 
router.get('/', positionController.getAllPositions);

// Admin-only routes
router.post(
  '/create',
  positionController.createPosition
);

router.put(
    "/:id",
    roleMiddleware.hasRole(['super_admin', 'data_admin']),
    positionController.updatePosition
)

router.delete(
  '/:id',
  roleMiddleware.hasRole(['super_admin', 'data_admin']),
  positionController.deletePosition
);

router.patch(
  '/:id/toggle',
  roleMiddleware.hasRole(['super_admin', 'data_admin']),
  positionController.togglePositionStatus
);

export default router;