import express from 'express';
import memberController from '../controllers/memberController.js';

const router = express.Router();

router.get('/', memberController.getAllMembers);
router.get('/search', memberController.searchMemberByNameOrPhone);
router.get('/:id', memberController.getMemberById); 
router.post('/', memberController.createMember);
router.put('/:id', memberController.updateMember);
router.delete('/:id', memberController.deleteMember);
router.get('/:memberId/member-vouchers', memberController.getMemberVouchers);
router.get('/:memberId/member-care-packages', memberController.getMemberCarePackages);

export default router;
