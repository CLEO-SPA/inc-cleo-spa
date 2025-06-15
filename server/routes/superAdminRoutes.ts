import express from 'express';
const router = express.Router();

import { preUpload, postUpload } from '../store/multerStore.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';
import isAuthenticated from '../middlewares/authMiddleware.js';

import saController from '../controllers/superAdminController.js';

router.use(isAuthenticated, roleMiddleware.hasRole('super_admin'));

router.get('/seed/check/all', saController.getAllExistingTables);
router.get('/seed/pre/:table', saController.getAllPreDataFilesController);
router.get('/seed/post/:table', saController.getAllPostDataFilesController);
router.get('/seed/pre/:table/:file', saController.getPreDataController);
router.get('/seed/post/:table/:file', saController.getPostDataController);
router.get('/seed/order', saController.getCurrentSeedingOrderController);
router.get('/seed/order/:tableName', saController.getOrdersForTableController);

router.post('/update/pre', preUpload.single('file'), saController.savePreDataController);
router.post('/update/post', postUpload.single('file'), saController.savePostDataController);

router.delete('/seed/:dataType/:table/:file', saController.deleteSeedDataFileController);

router.post('/seed/pre', saController.insertPreDataController);
router.post('/seed/post', saController.insertPostDataController);

export default router;
