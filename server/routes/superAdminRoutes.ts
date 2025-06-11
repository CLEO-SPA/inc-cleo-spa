import express, { Request, Response } from 'express'; // Added Request, Response
const router = express.Router();

import { preUpload, postUpload } from '../store/multerStore.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';
import isAuthenticated from '../middlewares/authMiddleware.js';

import saController from '../controllers/superAdminController.js';

router.use(isAuthenticated, roleMiddleware.hasRole('super_admin'));

router.get('/seed/check/all', saController.getAllExistingTables);
router.get('/seed/pre/:table', saController.getPreDataController);
router.get('/seed/post/:table', saController.getPostDataController);
router.get('/seed/order', saController.getCurrentSeedingOrderController);
router.get('/seed/order/:tableName', saController.getOrdersForTableController);

router.post('/update/pre', preUpload.single('file'), (req: Request, res: Response) => {
  if (req.file) {
    res.status(200).json({ message: `File '${req.file.originalname}' uploaded successfully to 'pre' directory.` });
  } else {
    res.status(400).json({ message: 'File upload failed or no file was provided.' });
  }
});

router.post('/update/post', postUpload.single('file'), (req: Request, res: Response) => {
  if (req.file) {
    res.status(200).json({ message: `File '${req.file.originalname}' uploaded successfully to 'post' directory.` });
  } else {
    res.status(400).json({ message: 'File upload failed or no file was provided.' });
  }
});

router.post('/seed/pre/:table', saController.insertPreDataController);
router.post('/seed/post/:table', saController.insertPostDataController);

export default router;
