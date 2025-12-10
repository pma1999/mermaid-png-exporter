import { createContext, useState, useCallback, useEffect } from 'react';
import { translations, getNestedValue, detectBrowserLanguage } from '../i18n';

const STORAGE_KEY = 'mermaid-exporter-language';

export const LanguageContext = createContext(null);

/**
 * Language Provider Component
 * Provides language state and translation function to the app
 */
export function LanguageProvider({ children }) {
    // Initialize language: localStorage > browser detection > fallback to 'en'
    const [language, setLanguageState] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && (stored === 'en' || stored === 'es')) {
            return stored;
        }
        return detectBrowserLanguage();
    });

    // Persist language changes to localStorage
    const setLanguage = useCallback((lang) => {
        if (lang === 'en' || lang === 'es') {
            setLanguageState(lang);
            localStorage.setItem(STORAGE_KEY, lang);
        }
    }, []);

    // Update document lang attribute when language changes
    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    // Translation function with dot notation support
    const t = useCallback((key) => {
        return getNestedValue(translations[language], key);
    }, [language]);

    // Get current translations object (useful for examples)
    const getTranslations = useCallback(() => {
        return translations[language];
    }, [language]);

    const value = {
        language,
        setLanguage,
        t,
        getTranslations
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}
