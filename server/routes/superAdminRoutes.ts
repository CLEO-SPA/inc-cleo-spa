import express from 'express';
const router = express.Router();

import { preUpload, postUpload } from '../store/multerStore.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';
import isAuthenticated from '../middlewares/authMiddleware.js';

import saController from '../controllers/superAdminController.js';

router.use(isAuthenticated, roleMiddleware.hasRole('super_admin'));

router.get('/seed/check/all', saController.getAllExistingTables);
router.get('/seed/pre/:table', saController.getPreDataController);
router.get('/seed/post/:table', saController.getPostDataController);

router.post('/seed/pre/:table', saController.insertPreDataController);
router.post('/seed/post/:table', saController.insertPostDataController);

router.put('/seed/pre/update/:file', preUpload.single('file'));
router.put('/seed/post/update/:file', postUpload.single('file'));

export default router;
