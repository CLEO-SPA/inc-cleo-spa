import express from 'express';
import paymentController from '../controllers/paymentMethodController.js';

const router = express.Router();
router.get('/', paymentController.getAllPaymentMethods);
router.get('/visible', paymentController.getPaymentMethodsForPaymentPage);
router.get('/:id', paymentController.getPaymentMethodById);
router.post('/', paymentController.createPaymentMethod);
router.put('/:id', paymentController.updatePaymentMethod);
router.delete('/:id', paymentController.deletePaymentMethod);

export default router;
