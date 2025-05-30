import express from 'express';
import memberController from '../controllers/memberController.js';

const router = express.Router();

router.get('/', memberController.getAllMembers);
router.post('/', memberController.createMember);
router.put('/', memberController.updateMember);
router.delete('/:id', memberController.deleteMember);

export default router;
