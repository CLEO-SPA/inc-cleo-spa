import { Request, Response } from "express";
import translationModel from "../models/translationModel.js";

const isChinese = (str: string): boolean =>
    /^[\u4e00-\u9fff\s.,!?'"()\-&$%#@*+<=>]*$/.test(str);

const isEnglish = (str: string): boolean =>
    /^[A-Za-z\s.,!?'"()\-&$%#@*+<=>]*$/.test(str);

const sanitizeInput = (input: string): string => {
    return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

const addTranslationHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        let {
            english,
            chinese,
            meaning_in_english,
            meaning_in_chinese,
            created_at,
        } = req.body;

        if (!english || !chinese || !meaning_in_english || !meaning_in_chinese) {
            res.status(400).json({
                error: "English, Chinese, Meaning in English, and Meaning in Chinese fields are required.",
            });
            return;
        }

        // Sanitize text fields
        english = sanitizeInput(english);
        chinese = sanitizeInput(chinese);
        meaning_in_english = sanitizeInput(meaning_in_english);
        meaning_in_chinese = sanitizeInput(meaning_in_chinese);

        // Validate language fields
        if (!isEnglish(english)) {
            res.status(400).json({ error: "English field must contain only English characters." });
            return;
        }

        if (!isChinese(chinese)) {
            res.status(400).json({ error: "Chinese field must contain only Chinese characters." });
            return;
        }

        // Optional: Validate created_at format
        if (created_at && isNaN(Date.parse(created_at))) {
            res.status(400).json({ error: "Invalid created_at format. Use ISO 8601 datetime format." });
            return;
        }

        // Call the model with created_at
        const newTranslation = await translationModel.addTranslation(
            english,
            chinese,
            meaning_in_english,
            meaning_in_chinese,
            created_at // <-- Pass it along
        );

        if ("error" in newTranslation) {
            res.status(400).json({ error: newTranslation.error });
            return;
        }

        res.status(201).json({
            message: "Translation added successfully",
            data: newTranslation,
        });
    } catch (error) {
        console.error("Error adding translation:", error);
        res.status(500).json({ error: "Failed to add translation" });
    }
};


const getAllTranslationsHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const translations = await translationModel.getAllTranslations();

        if (!translations || translations.length === 0) {
            res.status(404).json({ message: "No translations found." });
            return;
        }

        res.status(200).json(translations);
    } catch (error) {
        console.error("Error fetching all translations:", error);
        res.status(500).json({ error: "Failed to retrieve all translations" });
    }
};


const deleteTranslationHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            res.status(400).json({ error: "Invalid or missing translation ID." });
            return;
        }

        const result = await translationModel.deleteTranslation(Number(id));

        if ("error" in result) {
            res.status(404).json({ error: result.error });
            return;
        }

        res.status(200).json({ message: result.message });
    } catch (error) {
        console.error("Error deleting translation:", error);
        res.status(500).json({ error: "Failed to delete translation" });
    }
};

const updateTranslationHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        let { chinese, meaning_in_english, meaning_in_chinese, updated_at } = req.body;

        if (!id || isNaN(Number(id))) {
            res.status(400).json({ error: "Invalid or missing translation ID." });
            return;
        }

        const updates: Record<string, string> = {};

        if (chinese !== undefined) {
            chinese = sanitizeInput(chinese);
            if (!isChinese(chinese)) {
                res.status(400).json({ error: "Chinese field must contain only Chinese characters." });
                return;
            }
            updates.chinese = chinese;
        }

        if (meaning_in_english !== undefined) {
            meaning_in_english = sanitizeInput(meaning_in_english);
            if (!isEnglish(meaning_in_english)) {
                res.status(400).json({ error: "Meaning in English must contain only English characters." });
                return;
            }
            updates.meaning_in_english = meaning_in_english;
        }

        if (meaning_in_chinese !== undefined) {
            meaning_in_chinese = sanitizeInput(meaning_in_chinese);
            if (!isChinese(meaning_in_chinese)) {
                res.status(400).json({ error: "Meaning in Chinese must contain only Chinese characters." });
                return;
            }
            updates.meaning_in_chinese = meaning_in_chinese;
        }

        if (updated_at !== undefined) {
            if (isNaN(Date.parse(updated_at))) {
                res.status(400).json({ error: "Invalid updated_at format. Use ISO 8601 datetime format." });
                return;
            }
            updates.updated_at = updated_at;
        }

        if (Object.keys(updates).length === 0) {
            res.status(400).json({ error: "No valid fields provided for update." });
            return;
        }

        const result = await translationModel.updateTranslation(
            Number(id),
            updates.chinese,
            updates.meaning_in_english,
            updates.meaning_in_chinese,
            updates.updated_at
        );

        if ("error" in result) {
            res.status(404).json({ error: result.error });
            return;
        }

        res.status(200).json({
            message: "Translation updated successfully.",
            data: result,
        });
    } catch (error) {
        console.error("Error updating translation:", error);
        res.status(500).json({ error: "Failed to update translation" });
    }
};



export default {
    addTranslationHandler,
    deleteTranslationHandler,
    updateTranslationHandler,
    getAllTranslationsHandler
};

