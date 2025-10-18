import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackScreenProps } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../types/navigation.types';
import { colors, spacing, typography } from '../theme';
import Button from '../components/Button';
import LanguageSelector from '../components/LanguageSelector';
import i18n from '../utils/i18n';

type OnboardingScreenProps = StackScreenProps<RootStackParamList, 'Onboarding'>;

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const insets = useSafeAreaInsets();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setSelectedLanguage(lang);
  };

  const handleGoPress = async () => {
    try {
      await AsyncStorage.setItem('hasLaunched', 'true');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.log('Error saving launch state:', error);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.titleContainer}>
        <Text style={styles.welcomeText} numberOfLines={2}>
          {t('onboarding.welcome')}
        </Text>
      </View>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  titleContainer: {
    height: 80, // Fixed height to prevent layout shifts
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  welcomeText: {
    ...typography.textStyles.h3,
    color: colors.primary[500],
    textAlign: 'center',
  },
  goButton: {
    marginTop: spacing.xl,
    width: '80%',
  },
});

export default OnboardingScreen;
