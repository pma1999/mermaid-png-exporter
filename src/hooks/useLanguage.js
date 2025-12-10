import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';

/**
 * Hook to access language context
 * @returns {{ language: 'en' | 'es', setLanguage: Function, t: Function, getTranslations: Function }}
 */
export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
