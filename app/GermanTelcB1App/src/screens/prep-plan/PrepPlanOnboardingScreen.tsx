/**
 * Prep Plan Onboarding Screen
 * 
 * Multi-step onboarding flow to collect user's study configuration:
 * 1. Welcome
 * 2. Exam date selection
 * 3. Study hours and days
 * 4. Preferred study time
 * 5. Summary and confirmation
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import { HomeStackNavigationProp, HomeStackParamList } from '../../types/navigation.types';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useAppTheme } from '../../contexts/ThemeContext';
import { spacing, typography, type ThemeColors } from '../../theme';
import { PrepPlanConfig } from '../../types/prep-plan.types';
import { prepPlanService } from '../../services/prep-plan.service';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { activeExamConfig } from '../../config/active-exam.config';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DatePicker from 'react-native-date-picker';

type OnboardingStep = 'welcome' | 'config' | 'assessment' | 'results' | 'complete';
type ConfigSubStep = 'exam-date' | 'study-schedule' | 'study-time' | 'summary';

type Props = StackScreenProps<HomeStackParamList, 'PrepPlanOnboarding'>;

const PrepPlanOnboardingScreen: React.FC<Props> = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Onboarding state
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [configSubStep, setConfigSubStep] = useState<ConfigSubStep>('exam-date');
  const [examDate, setExamDate] = useState<Date>(getDefaultExamDate());
  const [dailyStudyHours, setDailyStudyHours] = useState<number>(1.5);
  const [studyDaysPerWeek, setStudyDaysPerWeek] = useState<number>(5);
  const [studyDays, setStudyDays] = useState<boolean[]>([true, true, true, true, true, false, false]); // Mon-Sun
  const [preferredStudyTime, setPreferredStudyTime] = useState<'morning' | 'afternoon' | 'evening' | 'flexible'>('flexible');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing progress if any
  useEffect(() => {
    loadExistingProgress();
    logEvent(AnalyticsEvents.SCREEN_VIEW, { screen: 'PrepPlanOnboarding' });
  }, []);

  /**
   * Get default exam date (8 weeks from now)
   */
  function getDefaultExamDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 56); // 8 weeks
    return date;
  }

  /**
   * Load existing onboarding progress
   */
  const loadExistingProgress = async () => {
    try {
      const progress = await prepPlanService.getOnboardingProgress();
      if (progress && progress.config) {
        logEvent(AnalyticsEvents.PREP_PLAN_ONBOARDING_RESUMED, { step: progress.step });
        const config = progress.config;
        setExamDate(new Date(config.examDate));
        setDailyStudyHours(config.dailyStudyHours);
        setStudyDaysPerWeek(config.studyDaysPerWeek);
        setStudyDays(config.studyDays);
        if (config.preferredStudyTime) {
          setPreferredStudyTime(config.preferredStudyTime);
        }

        // Resume from where they left off
        if (progress.step === 'welcome') {
          setCurrentStep('config');
          setConfigSubStep('exam-date');
        } else if (progress.step === 'config') {
          setCurrentStep('config');
          setConfigSubStep('exam-date');
        } else if (progress.step === 'assessment') {
          // If user is on assessment step, they should be in DiagnosticAssessment screen
          // Navigate them there
          console.log('[PrepPlanOnboarding] User has assessment in progress, navigating to DiagnosticAssessment');
          navigation.replace('DiagnosticAssessment', {});
        } else if (progress.step === 'results' && progress.assessmentId) {
          // If user has completed assessment, navigate to results
          console.log('[PrepPlanOnboarding] User has completed assessment, navigating to results');
          navigation.replace('AssessmentResults', { assessmentId: progress.assessmentId });
        } else {
          // Default to welcome step
          setCurrentStep('welcome');
        }
      } else {
        logEvent(AnalyticsEvents.PREP_PLAN_ONBOARDING_STARTED);
      }
    } catch (error) {
      console.error('[PrepPlanOnboarding] Error loading progress:', error);
    }
  };

  /**
   * Save progress to allow resuming
   */
  const saveProgress = async (step: OnboardingStep) => {
    try {
      const config: PrepPlanConfig = {
        examDate,
        dailyStudyHours,
        studyDaysPerWeek,
        studyDays,
        preferredStudyTime,
        notificationsEnabled: true,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };

      await prepPlanService.saveOnboardingProgress({
        step,
        config,
        lastUpdated: Date.now(),
        isComplete: false,
      });
    } catch (error) {
      console.error('[PrepPlanOnboarding] Error saving progress:', error);
    }
  };

  /**
   * Calculate statistics for summary
   */
  const calculateStats = () => {
    const today = new Date();
    const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const weeksUntilExam = Math.ceil(daysUntilExam / 7);
    const totalStudyDays = Math.floor((daysUntilExam / 7) * studyDaysPerWeek);
    const totalStudyHours = totalStudyDays * dailyStudyHours;

    return {
      daysUntilExam,
      weeksUntilExam,
      totalStudyDays,
      totalStudyHours: Math.round(totalStudyHours),
    };
  };

  /**
   * Handle next button press
   */
  const handleNext = async () => {
    if (currentStep === 'welcome') {
      setCurrentStep('config');
      setConfigSubStep('exam-date');
      await saveProgress('config');
      return;
    }

    if (currentStep === 'config') {
      const configSteps: ConfigSubStep[] = ['exam-date', 'study-schedule', 'study-time', 'summary'];
      const currentIndex = configSteps.indexOf(configSubStep);
      
      if (currentIndex < configSteps.length - 1) {
        const nextSubStep = configSteps[currentIndex + 1];
        setConfigSubStep(nextSubStep);
        await saveProgress('config');
      } else {
        // On summary, proceed to assessment
        await handleStartAssessment();
      }
    }
  };

  /**
   * Handle back button
   */
  const handleBack = () => {
    if (currentStep === 'welcome') {
      navigation.goBack();
      return;
    }

    if (currentStep === 'config') {
      const configSteps: ConfigSubStep[] = ['exam-date', 'study-schedule', 'study-time', 'summary'];
      const currentIndex = configSteps.indexOf(configSubStep);
      
      if (currentIndex > 0) {
        const prevSubStep = configSteps[currentIndex - 1];
        setConfigSubStep(prevSubStep);
      } else {
        // Go back to welcome
        setCurrentStep('welcome');
      }
    }
  };

  /**
   * Handle start assessment
   */
  const handleStartAssessment = async () => {
    setIsSaving(true);
    try {
      // Save final config
      await saveProgress('assessment');
      
      logEvent(AnalyticsEvents.PREP_PLAN_CONFIG_SAVED, {
        daysUntilExam: calculateStats().daysUntilExam,
        studyHoursPerDay: dailyStudyHours,
        studyDaysPerWeek,
      });

      // Navigate to assessment
      logEvent(AnalyticsEvents.PREP_PLAN_DIAGNOSTIC_STARTED);
      navigation.navigate('DiagnosticAssessment', { examId: activeExamConfig.id });
    } catch (error) {
      console.error('[PrepPlanOnboarding] Error starting assessment:', error);
      Alert.alert(
        t('common.error'),
        t('prepPlan.onboarding.errors.saveFailed')
      );
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Toggle study day
   */
  const toggleStudyDay = (dayIndex: number) => {
    const newStudyDays = [...studyDays];
    newStudyDays[dayIndex] = !newStudyDays[dayIndex];
    
    // Update count
    const count = newStudyDays.filter(Boolean).length;
    setStudyDays(newStudyDays);
    setStudyDaysPerWeek(count);
  };

  /**
   * Render step content
   */
  const renderStepContent = () => {
    if (currentStep === 'welcome') {
      return renderWelcomeStep();
    }

    if (currentStep === 'config') {
      switch (configSubStep) {
        case 'exam-date':
          return renderExamDateStep();
        case 'study-schedule':
          return renderStudyScheduleStep();
        case 'study-time':
          return renderStudyTimeStep();
        case 'summary':
          return renderSummaryStep();
        default:
          return null;
      }
    }

    return null;
  };

  /**
   * Welcome Step
   */
  const renderWelcomeStep = () => (
    <View style={styles.stepContent}>
      <Icon name="event-available" size={80} color={colors.primary[500]} style={styles.icon} />
      <Text style={styles.title}>{t('prepPlan.onboarding.welcome.title')}</Text>
      <Text style={styles.subtitle}>{t('prepPlan.onboarding.welcome.subtitle')}</Text>
      
      <View style={styles.stepsList}>
        {[1, 2, 3].map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{step}</Text>
            </View>
            <Text style={styles.stepText}>
              {t(`prepPlan.onboarding.welcome.step${step}`)}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.timeEstimate}>{t('prepPlan.onboarding.welcome.timeEstimate')}</Text>
    </View>
  );

  /**
   * Exam Date Step
   */
  const renderExamDateStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>{t('prepPlan.onboarding.examDate.title')}</Text>
      <Text style={styles.subtitle}>{t('prepPlan.onboarding.examDate.subtitle')}</Text>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setIsDatePickerOpen(true)}
      >
        <Icon name="calendar-today" size={24} color={colors.primary[500]} />
        <Text style={styles.dateButtonText}>
          {examDate.toLocaleDateString(undefined, { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          {t('prepPlan.onboarding.examDate.daysUntilExamWithIcon', { days: calculateStats().daysUntilExam })}
        </Text>
        <Text style={styles.infoText}>
          {t('prepPlan.onboarding.examDate.weeksUntilExamWithIcon', { weeks: calculateStats().weeksUntilExam })}
        </Text>
      </View>

      <DatePicker
        modal
        open={isDatePickerOpen}
        date={examDate}
        mode="date"
        minimumDate={new Date()}
        onConfirm={(date) => {
          setIsDatePickerOpen(false);
          setExamDate(date);
        }}
        onCancel={() => {
          setIsDatePickerOpen(false);
        }}
      />
    </View>
  );

  /**
   * Study Schedule Step
   */
  const renderStudyScheduleStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>{t('prepPlan.onboarding.schedule.title')}</Text>
      <Text style={styles.subtitle}>{t('prepPlan.onboarding.schedule.subtitle')}</Text>

      {/* Daily Study Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('prepPlan.onboarding.schedule.dailyHours')}
        </Text>
        <View style={styles.hoursGrid}>
          {[0.5, 1, 1.5, 2, 3, 4].map((hours) => (
            <TouchableOpacity
              key={hours}
              style={[
                styles.hourButton,
                dailyStudyHours === hours && styles.hourButtonSelected
              ]}
              onPress={() => setDailyStudyHours(hours)}
            >
              <Text style={[
                styles.hourButtonText,
                dailyStudyHours === hours && styles.hourButtonTextSelected
              ]}>
                {t('common.units.hoursValue', { count: hours })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Study Days */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('prepPlan.onboarding.schedule.studyDays')} ({studyDaysPerWeek}/7)
        </Text>
        <View style={styles.daysGrid}>
          {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day, index) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayButton,
                studyDays[index] && styles.dayButtonSelected
              ]}
              onPress={() => toggleStudyDay(index)}
            >
              <Text style={[
                styles.dayButtonText,
                studyDays[index] && styles.dayButtonTextSelected
              ]}>
                {t(`common.days.${day}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  /**
   * Study Time Preference Step
   */
  const renderStudyTimeStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>{t('prepPlan.onboarding.studyTime.title')}</Text>
      <Text style={styles.subtitle}>{t('prepPlan.onboarding.studyTime.subtitle')}</Text>

      <View style={styles.timeOptions}>
        {['morning', 'afternoon', 'evening', 'flexible'].map((time) => (
          <TouchableOpacity
            key={time}
            style={[
              styles.timeOption,
              preferredStudyTime === time && styles.timeOptionSelected
            ]}
            onPress={() => setPreferredStudyTime(time as any)}
          >
            <Icon 
              name={getTimeIcon(time)} 
              size={40} 
              color={preferredStudyTime === time ? colors.background.primary : colors.primary[500]} 
            />
            <Text style={[
              styles.timeOptionText,
              preferredStudyTime === time && styles.timeOptionTextSelected
            ]}>
              {t(`prepPlan.onboarding.studyTime.${time}`)}
            </Text>
            <Text style={[
              styles.timeOptionSubtext,
              preferredStudyTime === time && styles.timeOptionSubtextSelected
            ]}>
              {t(`prepPlan.onboarding.studyTime.${time}Desc`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  /**
   * Summary Step
   */
  const renderSummaryStep = () => {
    const stats = calculateStats();
    
    return (
      <View style={styles.stepContent}>
        <Text style={styles.title}>{t('prepPlan.onboarding.summary.title')}</Text>
        <Text style={styles.subtitle}>{t('prepPlan.onboarding.summary.subtitle')}</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('prepPlan.onboarding.summary.examDate')}</Text>
            <Text style={styles.summaryValue}>
              {examDate.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('prepPlan.onboarding.summary.daysUntilExam')}</Text>
            <Text style={styles.summaryValue}>{t('prepPlan.onboarding.summary.daysValue', { count: stats.daysUntilExam })}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('prepPlan.onboarding.summary.totalWeeks')}</Text>
            <Text style={styles.summaryValue}>{t('prepPlan.onboarding.summary.weeksValue', { count: stats.weeksUntilExam })}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('prepPlan.onboarding.summary.studyHoursPerDay')}</Text>
            <Text style={styles.summaryValue}>{t('prepPlan.onboarding.summary.hoursValue', { count: dailyStudyHours })}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('prepPlan.onboarding.summary.studyDaysPerWeek')}</Text>
            <Text style={styles.summaryValue}>{t('prepPlan.onboarding.summary.daysValue', { count: studyDaysPerWeek })}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryLastRow]}>
            <Text style={styles.summaryLabel}>{t('prepPlan.onboarding.summary.totalStudyHours')}</Text>
            <Text style={[styles.summaryValue, styles.summaryValueHighlight]}>
              {t('prepPlan.onboarding.summary.totalHoursValue', { count: stats.totalStudyHours })}
            </Text>
          </View>
        </View>

        <View style={styles.nextStepCard}>
          <Icon name="assignment-turned-in" size={32} color={colors.primary[500]} />
          <Text style={styles.nextStepTitle}>{t('prepPlan.onboarding.summary.nextStep')}</Text>
          <Text style={styles.nextStepText}>{t('prepPlan.onboarding.summary.nextStepDesc')}</Text>
        </View>
      </View>
    );
  };

  /**
   * Get icon for time preference
   */
  const getTimeIcon = (time: string): string => {
    switch (time) {
      case 'morning': return 'wb-sunny';
      case 'afternoon': return 'wb-cloudy';
      case 'evening': return 'nights-stay';
      case 'flexible': return 'access-time';
      default: return 'clock-outline';
    }
  };

  /**
   * Get progress percentage
   */
  const getProgress = (): number => {
    if (currentStep === 'welcome') {
      return 20;
    }
    if (currentStep === 'config') {
      const configSteps = ['exam-date', 'study-schedule', 'study-time', 'summary'];
      const currentIndex = configSteps.indexOf(configSubStep);
      // Welcome = 20%, Config steps = 20-100% (80% divided by 4 steps = 20% each)
      return 20 + ((currentIndex + 1) / configSteps.length) * 80;
    }
    return 100;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${getProgress()}%` }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('prepPlan.onboarding.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStepContent()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, isSaving && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={isSaving}
        >
          <Text style={styles.buttonText}>
            {currentStep === 'config' && configSubStep === 'summary'
              ? t('prepPlan.onboarding.startAssessment')
              : t('common.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.secondary,
    },
    progressBarContainer: {
      height: 4,
      backgroundColor: colors.border.medium,
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.primary[500],
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.padding.lg,
      paddingVertical: spacing.padding.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.medium,
    },
    backButton: {
      padding: spacing.padding.sm,
    },
    headerTitle: {
      ...typography.textStyles.h3,
      color: colors.text.primary,
    },
    headerSpacer: {
      width: 40,
    },
    scrollView: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    scrollContent: {
      padding: spacing.padding.lg,
    },
    stepContent: {
      alignItems: 'center',
    },
    icon: {
      marginBottom: spacing.margin.lg,
    },
    title: {
      ...typography.textStyles.h2,
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: spacing.margin.sm,
    },
    subtitle: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing.margin.xl,
    },
    stepsList: {
      width: '100%',
      marginTop: spacing.margin.lg,
    },
    stepItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.margin.lg,
    },
    stepNumber: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary[500],
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.margin.md,
    },
    stepNumberText: {
      ...typography.textStyles.h3,
      color: colors.background.primary,
    },
    stepText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      flex: 1,
    },
    timeEstimate: {
      ...typography.textStyles.caption,
      color: colors.text.secondary,
      marginTop: spacing.margin.xl,
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.secondary,
      padding: spacing.padding.lg,
      borderRadius: 12,
      width: '100%',
      marginBottom: spacing.margin.lg,
    },
    dateButtonText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      marginLeft: spacing.margin.md,
      flex: 1,
    },
    infoCard: {
      backgroundColor: colors.background.secondary,
      padding: spacing.padding.lg,
      borderRadius: 12,
      width: '100%',
    },
    infoText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      marginBottom: spacing.margin.sm,
    },
    section: {
      width: '100%',
      marginBottom: spacing.margin.xl,
    },
    sectionTitle: {
      ...typography.textStyles.h3,
      color: colors.text.primary,
      marginBottom: spacing.margin.md,
    },
    hoursGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.margin.sm,
      justifyContent: 'space-between',
    },
    hourButton: {
      width: '31%',
      padding: spacing.padding.md,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border.medium,
      alignItems: 'center',
      // marginBottom: spacing.margin.sm,
    },
    hourButtonSelected: {
      borderColor: colors.primary[500],
      backgroundColor: colors.primary[500],
    },
    hourButtonText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      fontWeight: '600',
    },
    hourButtonTextSelected: {
      color: colors.background.primary,
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    dayButton: {
      width: '13%',
      aspectRatio: 1,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border.medium,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.margin.sm,
    },
    dayButtonSelected: {
      borderColor: colors.primary[500],
      backgroundColor: colors.primary[500],
    },
    dayButtonText: {
      ...typography.textStyles.caption,
      color: colors.text.primary,
      fontWeight: '600',
      fontSize: 10,
    },
    dayButtonTextSelected: {
      color: colors.background.primary,
    },
    timeOptions: {
      width: '100%',
      gap: spacing.margin.sm,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    timeOption: {
      backgroundColor: colors.background.secondary,
      padding: spacing.padding.lg,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border.medium,
      width: '48%',
    },
    timeOptionSelected: {
      borderColor: colors.primary[500],
      backgroundColor: colors.primary[500],
    },
    timeOptionText: {
      ...typography.textStyles.h3,
      color: colors.text.primary,
      marginTop: spacing.margin.sm,
    },
    timeOptionTextSelected: {
      color: colors.background.primary,
    },
    timeOptionSubtext: {
      ...typography.textStyles.caption,
      color: colors.text.secondary,
      marginTop: spacing.margin.xs,
    },
    timeOptionSubtextSelected: {
      color: colors.background.primary,
      opacity: 0.9,
    },
    summaryCard: {
      backgroundColor: colors.background.secondary,
      padding: spacing.padding.lg,
      borderRadius: 12,
      width: '100%',
      marginBottom: spacing.margin.lg,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.margin.sm,
      paddingBottom: spacing.padding.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.medium,
    },
    summaryLastRow: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    summaryLabel: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
    },
    summaryValue: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      fontWeight: '600',
    },
    summaryValueHighlight: {
      color: colors.primary[500],
      fontSize: 18,
    },
    nextStepCard: {
      backgroundColor: colors.background.secondary,
      padding: spacing.padding.lg,
      borderRadius: 12,
      width: '100%',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.primary[500],
    },
    nextStepTitle: {
      ...typography.textStyles.h3,
      color: colors.text.primary,
      marginTop: spacing.margin.sm,
    },
    nextStepText: {
      ...typography.textStyles.caption,
      color: colors.text.secondary,
      textAlign: 'center',
      marginTop: spacing.margin.xs,
    },
    footer: {
      padding: spacing.padding.lg,
      paddingBottom: 0,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      backgroundColor: colors.background.secondary,
    },
    button: {
      padding: spacing.padding.md,
      borderRadius: 12,
      alignItems: 'center',
    },
    buttonPrimary: {
      backgroundColor: colors.primary[500],
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      ...typography.textStyles.button,
      color: colors.background.primary,
    },
  });

export default PrepPlanOnboardingScreen;
