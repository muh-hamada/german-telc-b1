import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { useLanguageChange } from '../hooks/useLanguageChange';
import { RootStackParamList } from '../types/navigation.types';
import { spacing } from '../theme';
import Button from '../components/Button';
import LanguageSelector from '../components/LanguageSelector';
import RestartAppModal from '../components/RestartAppModal';
import i18n from '../utils/i18n';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

type OnboardingScreenProps = StackScreenProps<RootStackParamList, 'Onboarding'>;

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const { t } = useCustomTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const {
    isRestartModalVisible,
    isGoingToRTL,
    handleLanguageChange: handleLanguageChangeWithRestart,
    handleCloseModal,
  } = useLanguageChange();

  const handleLanguageChange = async (lang: string) => {
    setSelectedLanguage(lang);
    await handleLanguageChangeWithRestart(lang);
  };

  const handleGoPress = () => {
    logEvent(AnalyticsEvents.ONBOARDING_LANGUAGE_SELECTED, { language: selectedLanguage });
    navigation.navigate('OnboardingDisclaimer');
  };

  return (
    <SafeAreaView style={[styles.container]}>
      <LanguageSelector
        onLanguageSelect={handleLanguageChange}
      />
      <Button title={t('common.next')} onPress={handleGoPress} style={styles.goButton} />
      
      <RestartAppModal
        visible={isRestartModalVisible}
        isGoingToRTL={isGoingToRTL}
        onClose={handleCloseModal}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  goButton: {
    marginTop: spacing.margin.md,
    width: '80%',
  },
});

export default OnboardingScreen;
