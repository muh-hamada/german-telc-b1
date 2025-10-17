import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation.types';
import { colors, spacing, typography } from '../theme';
import Button from '../components/Button';
import LanguageSelector from '../components/LanguageSelector';
import i18n from '../utils/i18n';

type OnboardingScreenProps = StackScreenProps<RootStackParamList, 'Onboarding'>;

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setSelectedLanguage(lang);
  };

  const handleGoPress = () => {
    navigation.replace('Main');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>{t('onboarding.welcome')}</Text>
      <LanguageSelector
        onLanguageSelect={handleLanguageChange}
      />
      <Button title={t('common.go')} onPress={handleGoPress} style={styles.goButton} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
  },
  welcomeText: {
    ...typography.textStyles.h1,
    color: colors.primary[500],
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  goButton: {
    marginTop: spacing.xl,
    width: '80%',
  },
});

export default OnboardingScreen;
