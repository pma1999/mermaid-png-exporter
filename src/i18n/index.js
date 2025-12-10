import { en } from './en';
import { es } from './es';

export const translations = { en, es };

export const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
    { code: 'es', label: 'ES', flag: '🇪🇸', name: 'Español' }
];

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object to search
 * @param {string} path - Dot-notation path (e.g., 'header.subtitle')
 * @returns {string} - Value or path if not found
 */
export function getNestedValue(obj, path) {
    const value = path.split('.').reduce((acc, part) => acc?.[part], obj);
    return value !== undefined ? value : path;
}

/**
 * Detect user's preferred language from browser settings
 * @returns {'en' | 'es'} - Detected language code
 */
export function detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    // Check if starts with 'es' (handles es, es-ES, es-MX, etc.)
    if (browserLang.toLowerCase().startsWith('es')) {
        return 'es';
    }
    return 'en';
}
