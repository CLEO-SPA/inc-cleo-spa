import express, { Router } from "express";
import memberController from "../controllers/memberController.js";

const router: Router = express.Router();


router.get('/', memberController.getAllMembers);
router.get('/search', memberController.searchMemberByNameOrPhone);
router.get('/:id', memberController.getMemberById);

router.delete('/:id', memberController.deleteMember);
router.get('/:memberId/member-vouchers', memberController.getMemberVouchers);
router.get('/:memberId/member-care-packages', memberController.getMemberCarePackages);

router.get("/all", memberController.getAllMembers);

export default router;
