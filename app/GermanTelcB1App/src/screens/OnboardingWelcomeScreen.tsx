import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, Modal, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import { usePremium } from '../contexts/PremiumContext';
import { useRemoteConfig } from '../contexts/RemoteConfigContext';
import { RootStackParamList } from '../types/navigation.types';
import OnboardingProgressIndicator from '../components/OnboardingProgressIndicator';
import OnboardingStepContent from '../components/OnboardingStepContent';
import Button from '../components/Button';
import PremiumContent from '../components/PremiumContent';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OnboardingWelcomeScreenProps = StackScreenProps<RootStackParamList, 'OnboardingWelcome'>;

const TOTAL_STEPS = 5;

const OnboardingWelcomeScreen: React.FC<OnboardingWelcomeScreenProps> = ({ navigation }) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { purchasePremium, isPurchasing, restorePurchases } = usePremium();
  const { globalConfig } = useRemoteConfig();
  
  // Get onboarding images from remote config
  const onboardingImages = globalConfig?.onboardingImages || [];

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1);
      logEvent(AnalyticsEvents.ONBOARDING_STEP_COMPLETED, { step: currentStep + 1 });
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep === 0) {
      // On first step, go back to language selection
      navigation.goBack();
    } else {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep, navigation]);

  const handleStartExam = useCallback(async () => {
    logEvent(AnalyticsEvents.ONBOARDING_START_EXAM_CLICKED);

    await AsyncStorage.setItem('hasLaunched', 'true');

    // Show premium upsell modal
    setShowPremiumModal(true);
  }, []);

  const handleViewSections = useCallback(async () => {
    logEvent(AnalyticsEvents.ONBOARDING_VIEW_SECTIONS_CLICKED);

    await AsyncStorage.setItem('hasLaunched', 'true');

    // Navigate to main app
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  }, [navigation]);

  const handlePremiumModalClose = useCallback(() => {
    setShowPremiumModal(false);
    // After modal closed, navigate to main app
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  }, [navigation]);

  const handlePurchasePress = useCallback(async () => {
    try {
      const success = await purchasePremium();
      if (success) {
        // After successful purchase, close modal and go to main app
        setShowPremiumModal(false);
        navigation.reset({
          index: 0,
          routes: [{ name: 'MockExamRunning' }],
        });
      }
    } catch (error) {
      console.error('[OnboardingWelcome] Purchase error:', error);
    }
  }, [purchasePremium, navigation]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // Step 1 – Welcome & Purpose
        return (
          <OnboardingStepContent
            title={t('onboarding.welcome.title')}
            text={t('onboarding.welcome.text')}
            imageUrl={onboardingImages[0]}
          />
        );
      case 1:
        // Step 2 – Full Exam Coverage
        return (
          <OnboardingStepContent
            title={t('onboarding.coverage.title')}
            text={t('onboarding.coverage.text')}
            imageUrl={onboardingImages[1]}
          />
        );
      case 2:
        // Step 3 – Writing: AI Evaluation
        return (
          <OnboardingStepContent
            title={t('onboarding.writing.title')}
            text={t('onboarding.writing.text')}
            imageUrl={onboardingImages[2]}
          />
        );
      case 3:
        // Step 4 – Speaking: Practice & AI Analysis
        return (
          <OnboardingStepContent
            title={t('onboarding.speaking.title')}
            text={t('onboarding.speaking.text')}
            imageUrl={onboardingImages[3]}
          />
        );
      case 4:
        // Step 5 – Ready to Start (CTA)
        return (
          <OnboardingStepContent
            title={t('onboarding.ready.title')}
            text={t('onboarding.ready.text')}
            imageUrl={onboardingImages[4]}
          />
        );
      default:
        return null;
    }
  };

  const renderButtons = () => {
    if (currentStep === TOTAL_STEPS - 1) {
      // Last step - show two CTA buttons on same row
      return (
        <View style={[styles.ctaButtonsContainer]}>
          <TouchableOpacity onPress={handleViewSections} style={styles.secondaryTextButton}>
            <Text style={styles.secondaryButtonText}>
              {t('onboarding.buttons.viewSections')}
            </Text>
          </TouchableOpacity>
          <Button
            title={t('onboarding.buttons.startExam')}
            onPress={handleStartExam}
            style={styles.primaryButton}
            textStyle={styles.primaryButtonText}
            variant="primary"
            size="large"
          />
        </View>
      );
    }

    // Regular navigation buttons
    return (
      <View style={styles.navigationButtonsContainer}>
        <TouchableOpacity onPress={handleBack} style={styles.backTextButton}>
          <Text style={styles.backButtonText}>{t('onboarding.buttons.back')}</Text>
        </TouchableOpacity>
        <Button
          title={t('onboarding.buttons.next')}
          onPress={handleNext}
          variant="primary"
          size="medium"
          style={styles.nextButton}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <OnboardingProgressIndicator totalSteps={TOTAL_STEPS} currentStep={currentStep} />
      
      <View style={styles.contentContainer}>
        {renderStepContent()}
      </View>

      <View style={styles.buttonsWrapper}>
        {renderButtons()}
      </View>

      {/* Premium Modal */}
      <Modal
        visible={showPremiumModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handlePremiumModalClose}
      >
        <PremiumContent
          onPurchase={handlePurchasePress}
          onClose={handlePremiumModalClose}
          onRestore={restorePurchases}
          isPurchasing={isPurchasing}
          isRestoring={false}
          showCloseButton={true}
          showRestoreButton={true}
          isModal={true}
        />
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    contentContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    buttonsWrapper: {
      paddingHorizontal: spacing.padding.xl,
      paddingBottom: spacing.padding.xl,
      paddingTop: spacing.padding.md,
      backgroundColor: colors.background.primary,
    },
    navigationButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.margin.lg,
      alignItems: 'center',
    },
    backTextButton: {
      paddingVertical: spacing.padding.sm,
    },
    backButtonText: {
      fontSize: 15,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    nextButton: {
      width: '70%',
      borderRadius: 20,
      // minHeight: 56,
    },
    ctaButtonsContainer: {
      flexDirection: 'row',
      gap: spacing.margin.md,
      alignItems: 'center',
    },
    primaryButton: {
      flex: 1,
      borderRadius: 28,
      minHeight: 56,
    },
    primaryButtonText: {
      textAlign: 'center',
    },
    secondaryTextButton: {
      flex: 1,
      paddingVertical: spacing.padding.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontSize: 15,
      color: colors.text.secondary,
      textAlign: 'center',
    },
  });

export default OnboardingWelcomeScreen;

