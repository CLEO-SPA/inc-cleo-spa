import { createContext, useContext, useEffect } from "react";
import useTranslationStore from "@/stores/useTranslationStore"; // adjust path accordingly

const TranslationContext = createContext();

const normalizeKey = (key) =>
    key.trim().replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

const TranslationProvider = ({ children }) => {
    const {
        translations,
        loading,
        fetchTranslations,
    } = useTranslationStore();

    // Fetch all translations on mount
    useEffect(() => {
        fetchTranslations();
    }, [fetchTranslations]);

    // Translation lookup function
    const t = (key) => {
        if (!key) return key;

        const normalizedKey = normalizeKey(key);

        const existingTranslation = translations.find(
            (item) => item.english.toLowerCase() === normalizedKey
        );

        if (existingTranslation) {
            return `${key} (${existingTranslation.chinese})`;
        }


        return `${key} (${key})`; // fallback while loading
    };

    return (
        <TranslationContext.Provider value={{ t, translations, loading, fetchTranslations }}>
            {children}
        </TranslationContext.Provider>
    );
};

const useTranslation = () => {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error("useTranslation must be used within a TranslationProvider");
    }
    return context;
};

export { TranslationProvider, useTranslation };
