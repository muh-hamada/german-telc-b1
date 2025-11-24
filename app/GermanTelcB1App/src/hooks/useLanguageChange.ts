/**
 * useLanguageChange Hook
 * 
 * Custom hook to handle language changes with RTL/LTR manual restart prompts
 */

import { useState } from 'react';
import { Alert, I18nManager } from 'react-native';
import i18n from '../utils/i18n';
import { checkRTLChange, isRTLLanguage } from '../utils/i18n';
import { useCustomTranslation } from './useCustomTranslation';
import RNRestart from 'react-native-restart-newarch';

interface UseLanguageChangeReturn {
  isRestartModalVisible: boolean;
  isGoingToRTL: boolean;
  handleLanguageChange: (languageCode: string) => Promise<void>;
  handleCloseModal: () => void;
}

export const useLanguageChange = (): UseLanguageChangeReturn => {
  const { t } = useCustomTranslation();
  const [isRestartModalVisible, setIsRestartModalVisible] = useState(false);
  const [isGoingToRTL, setIsGoingToRTL] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageChange = async (languageCode: string): Promise<void> => {
    // Prevent multiple simultaneous language changes
    if (isChanging) {
      console.log('[useLanguageChange] Already changing language, ignoring request');
      return;
    }

    // Check if already on this language
    if (i18n.language === languageCode) {
      console.log('[useLanguageChange] Already on language:', languageCode);
      return;
    }

    try {
      setIsChanging(true);
      console.log('[useLanguageChange] Starting language change to:', languageCode);
      console.log('[useLanguageChange] Current i18n language:', i18n.language);
      console.log('[useLanguageChange] Current I18nManager.isRTL:', require('react-native').I18nManager.isRTL);
      
      const needsRestart = checkRTLChange(languageCode);
      console.log('[useLanguageChange] needsRestart:', needsRestart);
      
      // Change the language in i18n (saves to AsyncStorage)
      await i18n.changeLanguage(languageCode);
      console.log('[useLanguageChange] Language changed to:', i18n.language);

      if (needsRestart) {
        // IMPORTANT: Update I18nManager BEFORE showing restart modal
        // This ensures the app is in the correct RTL state immediately
        const shouldBeRTL = isRTLLanguage(languageCode);
        console.log('[useLanguageChange] Setting I18nManager.forceRTL to:', shouldBeRTL);
        I18nManager.allowRTL(shouldBeRTL);
        I18nManager.forceRTL(shouldBeRTL);
        console.log('[useLanguageChange] I18nManager.isRTL is now:', I18nManager.isRTL);
        
        // Show modal asking user to close and reopen the app
        const goingToRTL = languageCode === 'ar';
        console.log('[useLanguageChange] Showing restart modal, isGoingToRTL:', goingToRTL);
        setIsGoingToRTL(goingToRTL);
        setIsRestartModalVisible(true);
      } else {
        console.log('[useLanguageChange] No restart needed');
      }
    } catch (error) {
      console.error('[useLanguageChange] Error changing language:', error);
      Alert.alert(t('common.error'), t('profile.alerts.languageChangeFailed'));
    } finally {
      setIsChanging(false);
    }
  };

  const handleCloseModal = () => {
    setIsRestartModalVisible(false);
    RNRestart.restart();
  };

  return {
    isRestartModalVisible,
    isGoingToRTL,
    handleLanguageChange,
    handleCloseModal,
  };
};
