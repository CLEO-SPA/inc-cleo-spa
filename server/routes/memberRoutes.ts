import express from 'express';
import memberController from '../controllers/memberController.js';

const router = express.Router();

router.get('/', memberController.getAllMembers);
router.get('/:id', memberController.getMemberById); 
router.post('/', memberController.createMember);
router.put('/:id', memberController.updateMember);
router.delete('/:id', memberController.deleteMember);

export default router;
