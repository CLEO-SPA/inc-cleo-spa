import { createContext, useContext, useEffect } from "react";
import useTranslationStore from "@/stores/useTranslationStore"; // adjust path accordingly

const TranslationContext = createContext();

const normalizeKey = (key) =>
    key.trim().replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

// Helper: remove existing Chinese in brackets if any
const extractOriginalEnglish = (text) => {
    return text.replace(/\s*\(.*?\)\s*$/, "").trim();
};

const TranslationProvider = ({ children }) => {
    const { translations, loading, fetchTranslations } = useTranslationStore();

    // Fetch translations on mount
    useEffect(() => {
        fetchTranslations();
    }, [fetchTranslations]);

    // Translation lookup: returns "English (Chinese)" or just "English" if no translation
    const t = (key) => {
        if (!key) return key;

        const normalizedKey = normalizeKey(key);
        const existingTranslation = translations.find(
            (item) => item.english.toLowerCase() === normalizedKey
        );

        if (existingTranslation) {
            return `${key} (${existingTranslation.chinese})`;
        }

        return key;
    };

    useEffect(() => {
        if (!loading && translations.length > 0) {
            // Translate only text nodes inside element (preserving icons and other elements)
            const translateElement = (el) => {
                for (const node of el.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const originalText = node.textContent;
                        const englishOnly = extractOriginalEnglish(originalText).trim();

                        if (!englishOnly) continue;

                        const translated = t(englishOnly);
                        if (translated !== originalText) {
                            node.textContent = translated;
                        }
                    }
                }
            };

            // Translate attributes (e.g. placeholder, data-slot)
            const translateAttribute = (el, attr) => {
                const original = el.getAttribute(attr);
                if (!original) return;

                const englishOnly = extractOriginalEnglish(original);
                const translated = t(englishOnly);

                if (translated !== original) {
                    el.setAttribute(attr, translated);
                }
            };

            // Elements whose text nodes should be translated
            const elements = document.querySelectorAll(
                "h1, h2, h3, h4, h5, h6, p, span, label, button, th, a, strong, em, b, i, u, small, s, cite, q, mark, del, ins, sub, sup, div, section, article, aside, header, footer, main, nav, li, dt, dd, caption, option, legend, pre, blockquote, code, var, kbd, samp, output, summary"
            );

            elements.forEach(translateElement);

            // Attributes to translate on elements
            const attributesToTranslate = ["placeholder", "data-slot"];
            attributesToTranslate.forEach((attr) => {
                const elementsWithAttr = document.querySelectorAll(`[${attr}]`);
                elementsWithAttr.forEach((el) => translateAttribute(el, attr));
            });
        }
    }, [loading, translations]);

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