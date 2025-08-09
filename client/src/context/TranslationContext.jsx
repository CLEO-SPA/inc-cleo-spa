import { createContext, useContext, useEffect, useRef } from 'react';
import useTranslationStore from '@/stores/useTranslationStore';

const TranslationContext = createContext();

const normalizeKey = (key) =>
  key
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase();

// Helper: remove existing Chinese in brackets if any
const extractOriginalEnglish = (text) => {
  return text.replace(/\s*\(.*?\)\s*$/, '').trim();
};

const TranslationProvider = ({ children }) => {
  const { translations, loading, fetchTranslations } = useTranslationStore();
  const translationAppliedRef = useRef(new Set());
  const observerRef = useRef(null);

  // Fetch translations on mount
  useEffect(() => {
    fetchTranslations();
  }, [fetchTranslations]);

  // Translation lookup: returns "English (Chinese)" or just "English" if no translation
  const t = (key) => {
    if (!key) return key;

    const normalizedKey = normalizeKey(key);
    const existingTranslation = translations.find((item) => item.english.toLowerCase() === normalizedKey);

    if (existingTranslation) {
      return `${key} (${existingTranslation.chinese})`;
    }

    return key;
  };

  // Function to apply translations to DOM elements
  const applyTranslations = (rootElement = document) => {
    if (loading || translations.length === 0) return;

    // Translate only text nodes inside elements
    const translateElement = (el) => {
      // Skip if already translated
      const elementId = el.outerHTML;
      if (translationAppliedRef.current.has(elementId)) return;

      let hasChanges = false;
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          const originalText = node.textContent;
          const englishOnly = extractOriginalEnglish(originalText).trim();

          if (!englishOnly) continue;

          const translated = t(englishOnly);
          if (translated !== originalText) {
            node.textContent = translated;
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        translationAppliedRef.current.add(elementId);
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
    const elements = rootElement.querySelectorAll(
      'h1, h2, h3, h4, h5, h6, p, span, label, button, th, a, strong, em, b, i, u, small, s, cite, q, mark, del, ins, sub, sup, div, section, article, aside, header, footer, main, nav, li, dt, dd, caption, option, legend, pre, blockquote, code, var, kbd, samp, output, summary'
    );

    elements.forEach(translateElement);

    // Attributes to translate on elements
    const attributesToTranslate = ['placeholder', 'data-slot', 'aria-label'];
    attributesToTranslate.forEach((attr) => {
      const elementsWithAttr = rootElement.querySelectorAll(`[${attr}]`);
      elementsWithAttr.forEach((el) => translateAttribute(el, attr));
    });
  };

  // Initial translation application
  useEffect(() => {
    if (!loading && translations.length > 0) {
      // Clear the cache when translations change
      translationAppliedRef.current.clear();
      applyTranslations();
    }
  }, [loading, translations]);

  // Set up MutationObserver to handle dynamic content
  useEffect(() => {
    if (loading || translations.length === 0) return;

    // Clean up existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new MutationObserver((mutations) => {
      let shouldTranslate = false;

      mutations.forEach((mutation) => {
        // Check for added nodes
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              shouldTranslate = true;
            }
          });
        }
        // Check for text content changes
        if (mutation.type === 'characterData') {
          shouldTranslate = true;
        }
      });

      if (shouldTranslate) {
        // Debounce translation application
        setTimeout(() => {
          applyTranslations();
        }, 100);
      }
    });

    // Start observing
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Cleanup on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
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
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

export { TranslationProvider, useTranslation };
