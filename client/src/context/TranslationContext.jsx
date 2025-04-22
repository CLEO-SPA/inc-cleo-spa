// TranslationContext.jsx

import { createContext, useContext, useState } from "react";
import { api } from "../interceptors/axios.js";

const TranslationContext = createContext();

const TranslationProvider = ({ children }) => {
    const [translations, setTranslations] = useState([]);
    const [loading, setLoading] = useState(true); // Handle loading state

    // Function to fetch translations dynamically
    const fetchTranslation = async (key) => {
        try {
            const response = await api.get(`/trans/all?english=${encodeURIComponent(key)}`);
            const chineseTranslation = response.data[0]?.chinese || key; // Return translation or fallback to English

            // Save to state for caching
            setTranslations((prev) => [
                ...prev,
                { english: key, chinese: chineseTranslation }
            ]);

            return chineseTranslation;
        } catch (error) {
            console.error("Error fetching translation:", error);
            return key; // Return original text if error occurs
        }
    };

    // Function to fetch all translations
    const fetchTranslations = async () => {
        try {
            const response = await api.get("/trans/all"); // Adjust the API as necessary
            const fetchedTranslations = response.data;
            setTranslations(fetchedTranslations);
        } catch (error) {
            console.error("Error fetching all translations:", error);
        }
    };

    const t = (key) => {
        if (!key) return key;

        const normalizedKey = key.replace(/([a-z])([A-Z])/g, "$1 $2");

        const existingTranslation = translations.find(
            (item) => item.english.toLowerCase() === normalizedKey.toLowerCase()
        );

        if (existingTranslation) {
            return `${normalizedKey} (${existingTranslation.chinese})`; // Format: English (Chinese)
        }

        fetchTranslation(normalizedKey).then((translatedText) => {
            setTranslations((prev) => [...prev, { english: normalizedKey, chinese: translatedText }]);
        });

        return `${normalizedKey} (${normalizedKey})`; // Temporarily show English while fetching
    };

    return (
        <TranslationContext.Provider value={{ t, translations, loading, fetchTranslations }}>
            {children}
        </TranslationContext.Provider>
    );
};

// Custom hook for easy access
const useTranslation = () => {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error("useTranslation must be used within a TranslationProvider");
    }
    return context;
};

export { TranslationProvider, useTranslation };
