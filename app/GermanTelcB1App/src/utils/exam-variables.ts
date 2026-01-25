/**
 * Exam Variables Helper
 * 
 * Provides translated language names and exam level for use in i18n interpolation.
 * This allows us to use {{language}} and {{level}} variables in translation strings.
 */

import { activeExamConfig } from '../config/active-exam.config';

/**
 * Language name translations for all supported UI languages
 * Maps exam language codes to their translated names in each UI language
 */
const LANGUAGE_TRANSLATIONS: Record<string, Record<string, string>> = {
  german: {
    en: 'German',
    de: 'Deutsch',
    ar: 'الألمانية',
    es: 'Alemán',
    fr: 'Allemand',
    ru: 'Немецкий',
  },
  english: {
    en: 'English',
    de: 'Englisch',
    ar: 'الإنجليزية',
    es: 'Inglés',
    fr: 'Anglais',
    ru: 'Английский',
  },
};

export const LANGUAGE_SHORT_CODES: Record<string, string> = {
  german: 'de',
  english: 'en',
  french: 'fr',
  spanish: 'es',
  russian: 'ru',
  arabic: 'ar',
};

/**
 * Get exam variables for use in i18n interpolation
 * 
 * @param uiLanguage - The current UI language code (e.g., 'en', 'de', 'ar')
 * @returns Object with language name and level for interpolation
 * 
 * @example
 * // When exam is German B1 and UI language is Arabic
 * getExamVariables('ar') // returns { language: 'الألمانية', level: 'B1', provider: 'Telc' }
 */
export const getExamVariables = (uiLanguage: string = 'en'): { language: string; level: string; provider: string } => {
  const examLanguage = activeExamConfig.language;
  const examLevel = activeExamConfig.level;
  const examProvider = activeExamConfig.provider;
  
  // Get the translated language name, fallback to English if not found
  const languageTranslations = LANGUAGE_TRANSLATIONS[examLanguage];
  const translatedLanguage = languageTranslations?.[uiLanguage] || languageTranslations?.en || examLanguage;
  const providerCapitalized = examProvider.charAt(0).toUpperCase() + examProvider.slice(1);
  
  return {
    language: translatedLanguage,
    level: examLevel,
    provider: providerCapitalized,
  };
};

/**
 * Get all exam variables including raw exam config values
 * Useful for advanced use cases where you need more than just language/level
 */
export const getAllExamVariables = (uiLanguage: string = 'en') => {
  return {
    ...getExamVariables(uiLanguage),
    examId: activeExamConfig.id,
    displayName: activeExamConfig.displayName,
  };
};

