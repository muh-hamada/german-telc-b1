/**
 * useLanguageChange Hook
 * 
 * Custom hook to handle language changes with RTL/LTR restart logic
 */

import { useState } from 'react';
import { Alert } from 'react-native';
import RNRestart from 'react-native-restart';
import i18n from '../utils/i18n';
import { checkRTLChange } from '../utils/i18n';
import { useCustomTranslation } from './useCustomTranslation';

interface UseLanguageChangeReturn {
  isRestartModalVisible: boolean;
  isGoingToRTL: boolean;
  handleLanguageChange: (languageCode: string) => Promise<void>;
  handleRestartConfirm: () => void;
  handleRestartCancel: () => void;
}

export const useLanguageChange = (): UseLanguageChangeReturn => {
  const { t } = useCustomTranslation();
  const [isRestartModalVisible, setIsRestartModalVisible] = useState(false);
  const [isGoingToRTL, setIsGoingToRTL] = useState(false);

  const handleLanguageChange = async (languageCode: string): Promise<void> => {
    try {
      const needsRestart = checkRTLChange(languageCode);
      await i18n.changeLanguage(languageCode);

      if (needsRestart) {
        // Show restart modal
        setIsGoingToRTL(languageCode === 'ar');
        setIsRestartModalVisible(true);
      }
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(t('common.error'), t('profile.alerts.languageChangeFailed'));
    }
  };

  const handleRestartConfirm = () => {
    setIsRestartModalVisible(false);
    // Give a small delay to ensure language is saved and modal closes
    setTimeout(() => {
      RNRestart.restart();
    }, 100);
  };

  const handleRestartCancel = () => {
    setIsRestartModalVisible(false);
  };

  return {
    isRestartModalVisible,
    isGoingToRTL,
    handleLanguageChange,
    handleRestartConfirm,
    handleRestartCancel,
  };
};

