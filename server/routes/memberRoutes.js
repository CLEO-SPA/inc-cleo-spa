import express from 'express';
const router = express.Router();

import isAuthenticated from '../middlewares/authMiddleware.js';

import memberController from '../controllers/memberController.js';

// =========================
// Public routes
// =========================

// =========================
// Private routes
// =========================
router.use(isAuthenticated);

router.get('/dropdown', memberController.getAllMembersForDropdown);

export default router;
