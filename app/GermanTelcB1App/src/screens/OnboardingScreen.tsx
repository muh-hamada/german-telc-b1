import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { useLanguageChange } from '../hooks/useLanguageChange';
import { useRemoteConfig } from '../contexts/RemoteConfigContext';
import { RootStackParamList } from '../types/navigation.types';
import { spacing, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
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
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { globalConfig } = useRemoteConfig();

  // Preload onboarding images for better UX
  useEffect(() => {
    const prefetchImages = async () => {
      const images = globalConfig?.onboardingImages || [];
      if (images.length > 0) {
        console.log('[OnboardingScreen] Prefetching onboarding images...');
        try {
          await Promise.all(
            images.map((url) => 
              Image.prefetch(url).catch((error) => {
                console.warn('[OnboardingScreen] Failed to prefetch image:', url, error);
              })
            )
          );
          console.log('[OnboardingScreen] Successfully prefetched all onboarding images');
        } catch (error) {
          console.error('[OnboardingScreen] Error prefetching images:', error);
        }
      }
    };

    prefetchImages();
  }, [globalConfig?.onboardingImages]);

  const handleLanguageChange = async (lang: string) => {
    setSelectedLanguage(lang);
    await handleLanguageChangeWithRestart(lang);
  };

  const handleGoPress = () => {
    logEvent(AnalyticsEvents.ONBOARDING_LANGUAGE_SELECTED, { language: selectedLanguage });
    navigation.navigate('OnboardingWelcome');
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.primary,
  },
  goButton: {
    marginTop: spacing.margin.md,
    width: '80%',
  },
});

export default OnboardingScreen;
