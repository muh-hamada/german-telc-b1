import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackScreenProps } from '@react-navigation/stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../types/navigation.types';
import { colors, spacing, typography } from '../theme';
import Button from '../components/Button';
import LanguageSelector from '../components/LanguageSelector';
import i18n from '../utils/i18n';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

type OnboardingScreenProps = StackScreenProps<RootStackParamList, 'Onboarding'>;

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setSelectedLanguage(lang);
    logEvent(AnalyticsEvents.ONBOARDING_LANGUAGE_SELECTED, { language: lang });
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
