import express from "express";
import translationController from "../controllers/translationController.js"; // Corrected import

const router = express.Router();

router.post("/add", translationController.addTranslationHandler);
router.get("/all", translationController.getAllTranslationsHandler);
router.delete("/:id", translationController.deleteTranslationHandler)
router.put("/:id", translationController.updateTranslationHandler)


export default router;
