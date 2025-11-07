import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { activeExamConfig } from '../config/active-exam.config';

// Import base UI translation files
import en from '../locales/en.json';
import de from '../locales/de.json';
import ar from '../locales/ar.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import ru from '../locales/ru.json';

// Import exam-specific translations with static paths
// Metro bundler requires static import paths (no dynamic require with template literals)
import germanB1En from '../locales/exam-content/german-b1/en.json';
import germanB1De from '../locales/exam-content/german-b1/de.json';
import germanB1Ar from '../locales/exam-content/german-b1/ar.json';
import germanB1Es from '../locales/exam-content/german-b1/es.json';
import germanB1Fr from '../locales/exam-content/german-b1/fr.json';
import germanB1Ru from '../locales/exam-content/german-b1/ru.json';

// TODO: Add imports for other exams when they're created:
// import germanB2En from '../locales/exam-content/german-b2/en.json';
// import germanB2De from '../locales/exam-content/german-b2/de.json';
// ... (and other languages)
// import englishB1En from '../locales/exam-content/english-b1/en.json';
// import englishB1De from '../locales/exam-content/english-b1/de.json';
// ... (and other languages)

// Map exam IDs to their translations
const examTranslations: Record<string, Record<string, any>> = {
  'german-b1': {
    en: germanB1En,
    de: germanB1De,
    ar: germanB1Ar,
    es: germanB1Es,
    fr: germanB1Fr,
    ru: germanB1Ru,
  },
  // TODO: Add other exams here when ready:
  // 'german-b2': {
  //   en: germanB2En,
  //   de: germanB2De,
  //   ar: germanB2Ar,
  //   es: germanB2Es,
  //   fr: germanB2Fr,
  //   ru: germanB2Ru,
  // },
  // 'english-b1': {
  //   en: englishB1En,
  //   de: englishB1De,
  //   ar: englishB1Ar,
  //   es: englishB1Es,
  //   fr: englishB1Fr,
  //   ru: englishB1Ru,
  // },
};

// Get exam-specific translations for a language
const getExamTranslations = (lang: string): Record<string, any> => {
  const examId = activeExamConfig.id;
  const examLangTranslations = examTranslations[examId];
  
  if (!examLangTranslations) {
    console.warn(`[i18n] No exam translations found for exam: ${examId}`);
    return {};
  }
  
  return examLangTranslations[lang] || {};
};

// Load exam-specific translations for all languages
const examEn = getExamTranslations('en');
const examDe = getExamTranslations('de');
const examAr = getExamTranslations('ar');
const examEs = getExamTranslations('es');
const examFr = getExamTranslations('fr');
const examRu = getExamTranslations('ru');

// Deep merge function to merge nested objects
const deepMerge = (target: any, source: any): any => {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
};

const isObject = (item: any): boolean => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

// RTL languages
const RTL_LANGUAGES = ['ar'];

const LANGUAGE_DETECTOR = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem('user-language');
      if (savedLanguage) {
        callback(savedLanguage);
      } else {
        // Default to English if no language is saved
        callback('en');
      }
    } catch (error) {
      console.log('Error reading language from storage:', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem('user-language', lng);
    } catch (error) {
      console.log('Error saving language to storage:', error);
    }
  },
};

// Check if a language requires RTL
export const isRTLLanguage = (languageCode: string): boolean => {
  return RTL_LANGUAGES.includes(languageCode);
};

// Apply RTL layout on app initialization
export const applyRTLLayout = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('user-language');
    const shouldBeRTL = savedLanguage ? isRTLLanguage(savedLanguage) : false;
    
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  } catch (error) {
    console.log('Error applying RTL layout:', error);
  }
};

// Check if RTL needs to change and return true if restart is needed
export const checkRTLChange = (languageCode: string): boolean => {
  const shouldBeRTL = isRTLLanguage(languageCode);
  const isCurrentlyRTL = I18nManager.isRTL;
  
  return shouldBeRTL !== isCurrentlyRTL;
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    fallbackLng: 'en',
    debug: __DEV__,
    
    resources: {
      // Merge base UI translations with exam-specific translations
      // Exam-specific translations will override base translations if keys conflict
      en: { translation: deepMerge(en, examEn) },
      de: { translation: deepMerge(de, examDe) },
      ar: { translation: deepMerge(ar, examAr) },
      es: { translation: deepMerge(es, examEs) },
      fr: { translation: deepMerge(fr, examFr) },
      ru: { translation: deepMerge(ru, examRu) },
    },
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
  });

// Log active exam configuration in development
if (__DEV__) {
  console.log(`[i18n] Loaded translations for exam: ${activeExamConfig.displayName}`);
}

export default i18n;
