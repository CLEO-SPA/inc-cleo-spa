import express from 'express';
const router = express.Router();

// import { hashPassword } from '../middlewares/bcryptMiddleware.js';
// import roleMiddleware from '../middlewares/roleMiddleware.js';
import isAuthenticated from '../middlewares/authMiddleware.js';

import membershipType from '../controllers/membershipTypeController.js';

// =========================
// Public routes
// =========================

// =========================
// Private routes
// =========================

router.use(isAuthenticated);

router.get('/get', membershipType.getAllMembershipType);

router.post('/create', membershipType.createMembershipType);

router.put('/:id/update', membershipType.updateMembershipType);

router.delete('/:id/delete', membershipType.deleteMembershipType);

export default router;
