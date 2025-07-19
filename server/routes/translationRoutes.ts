import express from 'express';

import isAuthenticated from '../middlewares/authMiddleware.js';

import translationController from '../controllers/translationController.js';

const router = express.Router();

// =========================
// Public routes
// =========================

// =========================
// Private routes
// =========================
router.use(isAuthenticated);

router.post('/add', translationController.addTranslationHandler);
router.get('/all', translationController.getAllTranslationsHandler);
router.delete('/:id', translationController.deleteTranslationHandler);
router.put('/:id', translationController.updateTranslationHandler);

export default router;
