import { pool, getProdPool as prodPool } from '../config/database.js';

interface Translation {
    id: number;
    english: string;
    chinese: string;
    meaning_in_english: string;
    meaning_in_chinese: string;
    created_at: string;
    updated_at: string;
}

const addTranslation = async (
    english: string,
    chinese: string,
    meaningInEnglish: string,
    meaningInChinese: string
): Promise<Translation | { error: string }> => {
    try {
        const existingCheck = await pool().query(
            "SELECT * FROM translations WHERE english = $1",
            [english]
        );

        if (existingCheck.rows.length > 0) {
            return { error: `Translation for "${english}" already exists.` };
        }

        const result = await pool().query(
            `INSERT INTO translations (
        english, chinese, meaning_in_english, meaning_in_chinese, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *`,
            [english, chinese, meaningInEnglish, meaningInChinese]
        );

        return result.rows[0];
    } catch (error) {
        console.error("Error adding translation:", error);
        throw new Error("Failed to add translation");
    }
};

const deleteTranslation = async (id: number): Promise<{ message?: string; error?: string }> => {
    try {
        const existing = await pool().query("SELECT * FROM translations WHERE id = $1", [id]);

        if (existing.rows.length === 0) {
            return { error: "Translation not found." };
        }

        await pool().query("DELETE FROM translations WHERE id = $1", [id]);

        return { message: "Translation deleted successfully." };
    } catch (error) {
        console.error("Error deleting translation:", error);
        throw new Error("Failed to delete translation");
    }
};

const getAllTranslations = async (): Promise<Translation[]> => {
    try {
        const query = "SELECT * FROM translations";
        const result = await pool().query(query);

        console.log("Fetched translations:", result.rows);
        return result.rows;
    } catch (error) {
        console.error("Error fetching all translations:", error);
        throw new Error("Failed to fetch all translations");
    }
};


const updateTranslation = async (
    id: number,
    newChinese?: string,
    newEnglishMeaning?: string,
    newChineseMeaning?: string
): Promise<Translation | { error: string }> => {
    try {
        const existing = await pool().query("SELECT * FROM translations WHERE id = $1", [id]);

        if (existing.rows.length === 0) {
            return { error: "Translation not found." };
        }

        const updateData: Record<string, any> = { updated_at: new Date() };
        if (newChinese !== undefined) updateData.chinese = newChinese;
        if (newEnglishMeaning !== undefined) updateData.meaning_in_english = newEnglishMeaning;
        if (newChineseMeaning !== undefined) updateData.meaning_in_chinese = newChineseMeaning;

        const fields = Object.keys(updateData);
        const values = Object.values(updateData);
        const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(", ");

        const result = await pool().query(
            `UPDATE translations SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
            [...values, id]
        );

        return result.rows[0];
    } catch (error) {
        console.error("Error updating translation:", error);
        throw new Error("Failed to update translation");
    }
};

export default {
    addTranslation,
    getAllTranslations,
    deleteTranslation,
    updateTranslation,
};
