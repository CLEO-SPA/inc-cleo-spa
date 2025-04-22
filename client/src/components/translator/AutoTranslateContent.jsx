import { useEffect } from "react";
import { useTranslation } from "@/context/TranslationContext";

const AutoTranslateContent = () => {
    const { t } = useTranslation();

    useEffect(() => {
        const translatePage = async () => {
            // Select elements only inside a specific container (e.g., "#content")
            const container = document.getElementById("content");
            if (!container) return;

            const elements = container.querySelectorAll(
                "h1, h2, h3, h4, h5, h6, p, label, span, button, a, li, strong, em"
            );

            for (const element of elements) {
                if (element && element.innerText) {
                    const translatedText = await t(element.innerText);
                    if (translatedText !== element.innerText) {
                        element.innerText = translatedText;
                    }
                }
            }
        };

        translatePage();

        const observer = new MutationObserver(translatePage);
        const container = document.getElementById("content");
        if (container) {
            observer.observe(container, { childList: true, subtree: true });
        }

        return () => observer.disconnect();
    }, [t]);

    return null;
};

export default AutoTranslateContent;
