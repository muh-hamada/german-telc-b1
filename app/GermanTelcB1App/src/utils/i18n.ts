import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { getExamVariables } from './exam-variables';

// Import base UI translation files
import en from '../locales/en.json';
import de from '../locales/de.json';
import ar from '../locales/ar.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import ru from '../locales/ru.json';

// RTL languages
const RTL_LANGUAGES = ['ar'];

export const LanguageNameToLanguageCodes = {
  'english': 'en',
  'german': 'de',
  'french': 'fr',
  'spanish': 'es',
  'russian': 'ru',
  'arabic': 'ar',
};

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
  const targetShouldBeRTL = isRTLLanguage(languageCode);
  const isCurrentlyRTL = I18nManager.isRTL;
  
  console.log('[checkRTLChange] targetLanguageCode:', languageCode);
  console.log('[checkRTLChange] targetShouldBeRTL:', targetShouldBeRTL);
  console.log('[checkRTLChange] I18nManager.isRTL (current native state):', isCurrentlyRTL);
  console.log('[checkRTLChange] needsChange:', targetShouldBeRTL !== isCurrentlyRTL);
  
  // Compare target language RTL requirement with current native UI state
  // This works correctly because we update I18nManager immediately after language change
  return targetShouldBeRTL !== isCurrentlyRTL;
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    fallbackLng: 'en',
    debug: __DEV__,
    
    resources: {
      en: { translation: en },
      de: { translation: de },
      ar: { translation: ar },
      es: { translation: es },
      fr: { translation: fr },
      ru: { translation: ru },
    },
    
    interpolation: {
      escapeValue: false,
      // Set default context for language and level variables
      defaultVariables: getExamVariables('en'),
    },
    
    react: {
      useSuspense: false,
    },
  });

// Update interpolation context when language changes
i18n.on('languageChanged', (lng: string) => {
  const examVars = getExamVariables(lng);
  i18n.options.interpolation = {
    ...i18n.options.interpolation,
    defaultVariables: examVars,
  };
});

// Log active exam configuration in development
if (__DEV__) {
  console.log(`[i18n] Loaded translations with inline variable support`);
  console.log(`[i18n] Default variables:`, getExamVariables('en'));
}

export default i18n;
