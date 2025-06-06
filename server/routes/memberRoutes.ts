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

// router.get('/', memberController.getAllMembers);
// router.get('/:id', memberController.getMemberById); 
// router.post('/', memberController.createMember);
// router.put('/:id', memberController.updateMember);
// router.delete('/:id', memberController.deleteMember);

router.get('/dropdown', memberController.getAllMembersForDropdown);

export default router;


