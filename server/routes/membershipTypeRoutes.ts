import express from 'express';
const router = express.Router();

// import { hashPassword } from '../middlewares/bcryptMiddleware.js';
// import roleMiddleware from '../middlewares/roleMiddleware.js';
// import isAuthenticated from '../middlewares/authMiddleware.js';

import membershipType from '../controllers/membershipTypeController.js';

// =========================
// Public routes
// =========================
router.get('/get', membershipType.getAllMembershipType);

router.post('/create', membershipType.createMembershipType);

router.put('/update', membershipType.updateMembershipType);

router.put('/delete/:id', membershipType.deleteMembershipType);
// =========================
// Private routes
// =========================
// router.use(isAuthenticated);

export default router;
