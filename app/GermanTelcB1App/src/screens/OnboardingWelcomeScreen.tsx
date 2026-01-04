import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, StyleSheet, Modal, Text, TouchableOpacity, Alert } from 'react-native';
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
import { createInitialMockExamProgress, saveMockExamProgress } from '../services/mock-exam.service';

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

  // Track screen view on mount
  useEffect(() => {
    logEvent(AnalyticsEvents.ONBOARDING_WELCOME_SCREEN_VIEWED, {
      timestamp: Date.now(),
    });
  }, []);

  // Track step views
  useEffect(() => {
    logEvent(AnalyticsEvents.ONBOARDING_STEP_VIEWED, {
      step: currentStep + 1,
      stepName: getStepName(currentStep),
      totalSteps: TOTAL_STEPS,
    });
  }, [currentStep]);

  // Track when user leaves the screen (abandons flow)
  useEffect(() => {
    return () => {
      // Only log abandonment if user hasn't completed onboarding
      AsyncStorage.getItem('hasLaunched').then((hasLaunched) => {
        if (!hasLaunched) {
          logEvent(AnalyticsEvents.ONBOARDING_FLOW_ABANDONED, {
            lastStep: currentStep + 1,
            lastStepName: getStepName(currentStep),
          });
        }
      });
    };
  }, [currentStep]);

  const getStepName = (step: number): string => {
    const stepNames = ['welcome', 'coverage', 'writing', 'speaking', 'ready'];
    return stepNames[step] || 'unknown';
  };

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      logEvent(AnalyticsEvents.ONBOARDING_NEXT_CLICKED, {
        fromStep: currentStep + 1,
        fromStepName: getStepName(currentStep),
        toStep: currentStep + 2,
        toStepName: getStepName(currentStep + 1),
      });
      
      logEvent(AnalyticsEvents.ONBOARDING_STEP_COMPLETED, {
        step: currentStep + 1,
        stepName: getStepName(currentStep),
      });
      
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep === 0) {
      // On first step, go back to language selection
      logEvent(AnalyticsEvents.ONBOARDING_BACK_CLICKED, {
        fromStep: 1,
        fromStepName: 'welcome',
        destination: 'language_selection',
      });
      navigation.goBack();
    } else {
      logEvent(AnalyticsEvents.ONBOARDING_BACK_CLICKED, {
        fromStep: currentStep + 1,
        fromStepName: getStepName(currentStep),
        toStep: currentStep,
        toStepName: getStepName(currentStep - 1),
      });
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep, navigation]);

  const handleStartExam = useCallback(async () => {
    logEvent(AnalyticsEvents.ONBOARDING_START_EXAM_CLICKED, {
      step: TOTAL_STEPS,
      stepName: 'ready',
    });

    await AsyncStorage.setItem('hasLaunched', 'true');

    // Show premium upsell modal
    setShowPremiumModal(true);
    
    logEvent(AnalyticsEvents.ONBOARDING_PREMIUM_MODAL_SHOWN, {
      source: 'start_exam_button',
    });
  }, []);

  const handleViewSections = useCallback(async () => {
    logEvent(AnalyticsEvents.ONBOARDING_LATER_CLICKED, {
      step: TOTAL_STEPS,
      stepName: 'ready',
    });
    
    logEvent(AnalyticsEvents.ONBOARDING_VIEW_SECTIONS_CLICKED, {
      step: TOTAL_STEPS,
      stepName: 'ready',
    });

    await AsyncStorage.setItem('hasLaunched', 'true');
    
    logEvent(AnalyticsEvents.ONBOARDING_COMPLETED, {
      completedSteps: TOTAL_STEPS,
      action: 'view_sections',
      timestamp: Date.now(),
    });

    // Navigate to main app
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  }, [navigation]);

  const handlePremiumModalClose = useCallback(() => {
    logEvent(AnalyticsEvents.ONBOARDING_PREMIUM_MODAL_CLOSED, {
      source: 'close_button',
      hadPurchase: false,
    });
    
    setShowPremiumModal(false);
    
    logEvent(AnalyticsEvents.ONBOARDING_COMPLETED, {
      completedSteps: TOTAL_STEPS,
      action: 'dismiss_premium',
      timestamp: Date.now(),
    });
    
    // After modal closed, navigate to main app
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  }, [navigation]);

  const handlePurchasePress = useCallback(async () => {
    logEvent(AnalyticsEvents.ONBOARDING_PREMIUM_PURCHASE_CLICKED, {
      source: 'onboarding_modal',
    });
    
    try {
      const success = await purchasePremium('OnboardingWelcomeScreen');
      if (success) {
        logEvent(AnalyticsEvents.ONBOARDING_PREMIUM_PURCHASE_SUCCESS, {
          source: 'onboarding_modal',
        });
        
        logEvent(AnalyticsEvents.ONBOARDING_COMPLETED, {
          completedSteps: TOTAL_STEPS,
          action: 'purchased_premium',
          timestamp: Date.now(),
        });
        
        try {
          // Create and save initial progress
          const initialProgress = await createInitialMockExamProgress();
          await saveMockExamProgress(initialProgress);
          navigation.navigate('MockExamRunning');
        } catch (error) {
          console.error('Error starting exam:', error);
          Alert.alert(t('common.error'), t('mockExam.couldNotStartExam'));
        }

        // After successful purchase, close modal and go to main app
        setShowPremiumModal(false);
        navigation.reset({
          index: 0,
          routes: [{ name: 'MockExamRunning' }],
        });
      }
    } catch (error) {
      console.error('[OnboardingWelcome] Purchase error:', error);
      logEvent(AnalyticsEvents.ONBOARDING_PREMIUM_PURCHASE_FAILED, {
        source: 'onboarding_modal',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [purchasePremium, navigation, t]);

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
              {t('onboarding.buttons.later')}
            </Text>
          </TouchableOpacity>
          <Button
            title={t('onboarding.buttons.startExam')}
            onPress={handleStartExam}
            style={styles.primaryButton}
            textStyle={styles.primaryButtonText}
            variant="primary"
            size="medium"
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
          sourceScreen="OnboardingWelcomeScreen"
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
    },
    ctaButtonsContainer: {
      flexDirection: 'row',
      gap: spacing.margin.md,
      alignItems: 'center',
    },
    primaryButton: {
      flex: 1,
      borderRadius: 20,
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

