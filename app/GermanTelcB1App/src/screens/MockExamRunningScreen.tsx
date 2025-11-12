import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import ExamStepper from '../components/ExamStepper';
import ReadingPart1Wrapper from '../components/exam-wrappers/ReadingPart1Wrapper';
import ReadingPart2Wrapper from '../components/exam-wrappers/ReadingPart2Wrapper';
import ReadingPart3Wrapper from '../components/exam-wrappers/ReadingPart3Wrapper';
import LanguagePart1Wrapper from '../components/exam-wrappers/LanguagePart1Wrapper';
import LanguagePart2Wrapper from '../components/exam-wrappers/LanguagePart2Wrapper';
import ListeningPart1Wrapper from '../components/exam-wrappers/ListeningPart1Wrapper';
import ListeningPart2Wrapper from '../components/exam-wrappers/ListeningPart2Wrapper';
import ListeningPart3Wrapper from '../components/exam-wrappers/ListeningPart3Wrapper';
import WritingWrapper from '../components/exam-wrappers/WritingWrapper';
import {
  type MockExamProgress,
} from '../types/mock-exam.types';
import {
  loadMockExamProgress,
  updateStepProgress,
  clearMockExamProgress,
  getTestIdForStep,
} from '../services/mock-exam.service';
import AdBanner from '../components/AdBanner';
import { HIDE_ADS } from '../config/development.config';
import { useTranslation } from 'react-i18next';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import { UserAnswer } from '../types/exam.types';

const MockExamRunningScreen: React.FC = () => {
  const navigation = useNavigation();
  const [examProgress, setExamProgress] = useState<MockExamProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  
  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const progress = await loadMockExamProgress();
      if (!progress) {
        Alert.alert(t('common.error'), t('mockExam.examNotFound'));
        navigation.goBack();
        return;
      }
      setExamProgress(progress);
    } catch (error) {
      console.error('Error loading progress:', error);
      Alert.alert(t('common.error'), t('mockExam.couldNotLoadProgress'));
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !examProgress) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>{t('mockExam.examLoading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStep = examProgress.steps.find(
    step => step.id === examProgress.currentStepId
  );
  const currentStepIndex = examProgress.steps.findIndex(
    step => step.id === examProgress.currentStepId
  );

  const handleCompleteStep = async (score: number, answers: UserAnswer[]) => {
    try {
      // Update progress in storage
      await updateStepProgress(examProgress.currentStepId, score, true, answers);
      
      // Reload progress from storage to get updated state
      const updatedProgress = await loadMockExamProgress();
      if (updatedProgress) {
        setExamProgress(updatedProgress);
      }
    } catch (error) {
      console.error('Error completing step:', error);
      Alert.alert(t('common.error'), t('mockExam.couldNotSaveProgress'));
    }
  };

  const handleExitExam = () => {
    logEvent(AnalyticsEvents.MOCK_EXAM_EXIT_PROMPT_SHOWN);
    Alert.alert(
      t('mockExam.exitExamTitle'),
      t('mockExam.exitExamMessage'),
      [
        { text: t('mockExam.stay'), style: 'default', onPress: () => logEvent(AnalyticsEvents.MOCK_EXAM_EXIT_CANCELLED) },
        {
          text: t('mockExam.exitExamButton'),
          style: 'destructive',
          onPress: () => {
            logEvent(AnalyticsEvents.MOCK_EXAM_EXIT_CONFIRMED);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const renderStepContent = () => {
    if (!currentStep) return null;

    // Get testId for current step
    const testId = getTestIdForStep(currentStep.id, examProgress.selectedTests);

    // Check if it's a speaking section
    if (currentStep.sectionNumber === 5) {
      return (
        <View style={styles.speakingMessageContainer}>
          <Text style={styles.speakingTitle}>🗣️ {t('mockExam.speakingTitle')}</Text>
          <Text style={styles.speakingSubtitle}>{currentStep.partName}</Text>

          <View style={styles.speakingCard}>
            <Text style={styles.speakingCardTitle}>
              ℹ️ {t('mockExam.speakingCardTitle')}
            </Text>
            <Text style={styles.speakingCardText}>
              Die mündliche Prüfung kann nicht automatisch bewertet werden, da sie eine 
              Interaktion zwischen zwei Kandidaten oder mit einem Prüfer erfordert.
            </Text>
            <Text style={styles.speakingCardText}>
              {'\n'}Wir empfehlen Ihnen dringend, den{' '}
              <Text style={styles.speakingCardBold}>Übungsbereich</Text> zu nutzen, um 
              die mündliche Prüfung zu üben. Dort finden Sie alle drei Teile mit detaillierten 
              Anweisungen.
            </Text>
            <Text style={styles.speakingCardText}>
              {'\n'}Üben Sie mit einem Freund, Sprachpartner oder Tutor, um sich optimal 
              vorzubereiten!
            </Text>
          </View>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => handleCompleteStep(0, [])}
          >
            <Text style={styles.skipButtonText}>{t('mockExam.skipAndContinue')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Section 1: Reading (Leseverstehen)
    if (currentStep.id === 'reading-1') {
      return <ReadingPart1Wrapper testId={testId} onComplete={handleCompleteStep} />;
    }
    if (currentStep.id === 'reading-2') {
      return <ReadingPart2Wrapper testId={testId} onComplete={handleCompleteStep} />;
    }
    if (currentStep.id === 'reading-3') {
      return <ReadingPart3Wrapper testId={testId} onComplete={handleCompleteStep} />;
    }

    // Section 2: Language (Sprachbausteine)
    if (currentStep.id === 'language-1') {
      return <LanguagePart1Wrapper testId={testId} onComplete={handleCompleteStep} />;
    }
    if (currentStep.id === 'language-2') {
      return <LanguagePart2Wrapper testId={testId} onComplete={handleCompleteStep} />;
    }

    // Section 3: Listening (Hörverstehen)
    if (currentStep.id === 'listening-1') {
      return <ListeningPart1Wrapper testId={testId} onComplete={handleCompleteStep} />;
    }
    if (currentStep.id === 'listening-2') {
      return <ListeningPart2Wrapper testId={testId} onComplete={handleCompleteStep} />;
    }
    if (currentStep.id === 'listening-3') {
      return <ListeningPart3Wrapper testId={testId} onComplete={handleCompleteStep} />;
    }

    // Section 4: Writing (Schriftlicher Ausdruck)
    if (currentStep.id === 'writing') {
      return <WritingWrapper testId={testId} onComplete={handleCompleteStep} />;
    }

    return null;
  };


  const renderResults = () => {
    const writtenScore = examProgress.steps
      .filter(step => step.sectionNumber <= 4)
      .reduce((acc, step) => acc + (step.score || 0), 0);

    const oralScore = examProgress.steps
      .filter(step => step.sectionNumber === 5)
      .reduce((acc, step) => acc + (step.score || 0), 0);

    const writtenMaxPoints = 225;
    const oralMaxPoints = 75;

    const writtenPercentage = (writtenScore / writtenMaxPoints) * 100;
    const oralPercentage = oralScore > 0 ? (oralScore / oralMaxPoints) * 100 : 0;
    const totalPercentage = (examProgress.totalScore / examProgress.totalMaxPoints) * 100;

    const passedWritten = writtenScore >= 135;
    const passedOral = oralScore >= 45 || oralScore === 0; // Skip oral if not taken
    const passedOverall = examProgress.totalScore >= 180 && passedWritten;

    return (
      <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
        <Text style={styles.resultsTitle}>🎉 Prüfung abgeschlossen!</Text>

        {/* Overall Result */}
        <View style={[
          styles.resultCard,
          passedOverall ? styles.resultCardPass : styles.resultCardFail
        ]}>
          <Text style={styles.resultCardTitle}>
            {passedOverall ? `✅ ${t('mockExam.passed')} (≥180%)` : `❌ ${t('mockExam.failed')} (<180%)`}
          </Text>
          <Text style={styles.resultScore}>
            {examProgress.totalScore} / {examProgress.totalMaxPoints}
          </Text>
          <Text style={styles.resultPercentage}>{totalPercentage.toFixed(1)}%</Text>
        </View>

        {/* Written Component */}
        <View style={styles.componentCard}>
          <Text style={styles.componentTitle}>{t('mockExam.writtenExam')}</Text>
          <Text style={styles.componentScore}>
            {writtenScore} / {writtenMaxPoints} ({writtenPercentage.toFixed(1)}%)
          </Text>
          <Text style={[
            styles.componentStatus,
            passedWritten ? styles.componentStatusPass : styles.componentStatusFail
          ]}>
            {passedWritten ? `✓ ${t('mockExam.passed')} (≥135%)` : `✗ ${t('mockExam.failed')} (<135%)`}
          </Text>
        </View>

        {/* Oral Component (if taken) */}
        {oralScore > 0 && (
          <View style={styles.componentCard}>
            <Text style={styles.componentTitle}>{t('mockExam.oralExam')}</Text>
            <Text style={styles.componentScore}>
              {oralScore} / {oralMaxPoints} ({oralPercentage.toFixed(1)}%)
            </Text>
            <Text style={[
              styles.componentStatus,
              passedOral ? styles.componentStatusPass : styles.componentStatusFail
            ]}>
              {passedOral ? `✓ ${t('mockExam.passed')} (≥60%)` : `✗ ${t('mockExam.failed')} (<60%)`}
            </Text>
          </View>
        )}

        {/* Note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            {t('mockExam.examResultsNote')}
          </Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={async () => {
            await clearMockExamProgress();
            navigation.goBack();
          }}
        >
          <Text style={styles.primaryButtonText}>{t('mockExam.backToHome')}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  if (examProgress.isCompleted) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {renderResults()}
        {!HIDE_ADS && <AdBanner screen="mock-exam-results" />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Fixed Stepper at Top */}
      <ExamStepper steps={examProgress.steps} currentStepId={examProgress.currentStepId} />

      {/* Current Step Header */}
      <View style={styles.stepHeader}>
        <View style={styles.stepHeaderLeft}>
          <Text style={styles.stepHeaderSection}>
            {currentStep?.sectionName}
          </Text>
          <Text style={styles.stepHeaderPart}>{currentStep?.partName}</Text>
        </View>
        <TouchableOpacity onPress={handleExitExam} style={styles.exitButton}>
          <Text style={styles.exitButtonText}>✕ {t('mockExam.exitExamButton')}</Text>
        </TouchableOpacity>
      </View>

      {/* Step Content */}
      <View style={styles.contentContainer}>
        {renderStepContent()}
      </View>
      {!HIDE_ADS && <AdBanner screen="mock-exam-running" />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginTop: spacing.margin.md,
  },
  stepHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.padding.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  stepHeaderLeft: {
    flex: 1,
  },
  stepHeaderSection: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.margin.xs,
  },
  stepHeaderPart: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
  },
  exitButton: {
    paddingHorizontal: spacing.padding.md,
    paddingVertical: spacing.padding.sm,
  },
  exitButtonText: {
    ...typography.textStyles.body,
    color: colors.error[500],
    fontWeight: typography.fontWeight.bold,
  },
  contentContainer: {
    flex: 1,
  },
  speakingMessageContainer: {
    flex: 1,
    padding: spacing.padding.lg,
    justifyContent: 'center',
  },
  speakingTitle: {
    ...typography.textStyles.h2,
    color: colors.primary[600],
    textAlign: 'center',
    marginBottom: spacing.margin.xs,
  },
  speakingSubtitle: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.margin.xl,
  },
  speakingCard: {
    backgroundColor: colors.secondary[50],
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.lg,
    marginBottom: spacing.margin.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary[500],
  },
  speakingCardTitle: {
    ...typography.textStyles.h4,
    color: colors.secondary[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.sm,
  },
  speakingCardText: {
    ...typography.textStyles.body,
    color: colors.secondary[700],
    lineHeight: 22,
  },
  speakingCardBold: {
    fontWeight: typography.fontWeight.bold,
  },
  skipButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
  },
  skipButtonText: {
    ...typography.textStyles.body,
    color: colors.background.secondary,
    fontWeight: typography.fontWeight.bold,
  },
  placeholderContainer: {
    flex: 1,
  },
  placeholderContent: {
    padding: spacing.padding.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTitle: {
    ...typography.textStyles.h2,
    color: colors.primary[600],
    marginBottom: spacing.margin.xs,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.margin.xl,
    textAlign: 'center',
  },
  placeholderCard: {
    backgroundColor: colors.warning[50],
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.lg,
    marginBottom: spacing.margin.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning[500],
  },
  placeholderCardTitle: {
    ...typography.textStyles.h4,
    color: colors.warning[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.sm,
  },
  placeholderCardText: {
    ...typography.textStyles.body,
    color: colors.warning[700],
    lineHeight: 22,
    marginBottom: spacing.margin.md,
  },
  placeholderMeta: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-around',
    marginTop: spacing.margin.sm,
  },
  placeholderMetaText: {
    ...typography.textStyles.body,
    color: colors.warning[700],
    fontWeight: typography.fontWeight.semibold,
  },
  simulateButton: {
    backgroundColor: colors.secondary[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
  },
  simulateButtonText: {
    ...typography.textStyles.body,
    color: colors.background.secondary,
    fontWeight: typography.fontWeight.bold,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    padding: spacing.padding.lg,
    paddingBottom: spacing.padding.xl * 2,
  },
  resultsTitle: {
    ...typography.textStyles.h1,
    color: colors.primary[600],
    textAlign: 'center',
    marginBottom: spacing.margin.xl,
  },
  resultCard: {
    padding: spacing.padding.xl,
    borderRadius: spacing.borderRadius.lg,
    marginBottom: spacing.margin.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  resultCardPass: {
    backgroundColor: colors.success[500],
  },
  resultCardFail: {
    backgroundColor: colors.error[500],
  },
  resultCardTitle: {
    ...typography.textStyles.h2,
    color: colors.background.secondary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.md,
  },
  resultScore: {
    ...typography.textStyles.h1,
    color: colors.background.secondary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.xs,
  },
  resultPercentage: {
    ...typography.textStyles.h3,
    color: colors.background.secondary,
  },
  componentCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.lg,
    marginBottom: spacing.margin.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  componentTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  componentScore: {
    ...typography.textStyles.h4,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.xs,
  },
  componentStatus: {
    ...typography.textStyles.body,
  },
  componentStatusPass: {
    color: colors.success[600],
    fontWeight: typography.fontWeight.semibold,
  },
  componentStatusFail: {
    color: colors.error[600],
    fontWeight: typography.fontWeight.semibold,
  },
  noteCard: {
    backgroundColor: colors.primary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.xl,
  },
  noteText: {
    ...typography.textStyles.bodySmall,
    color: colors.primary[700],
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.textStyles.body,
    color: colors.background.secondary,
    fontWeight: typography.fontWeight.bold,
  },
});

export default MockExamRunningScreen;

