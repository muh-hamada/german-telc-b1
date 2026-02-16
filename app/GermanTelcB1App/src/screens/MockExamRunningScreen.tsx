import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import { activeExamConfig } from '../config/active-exam.config';
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
// DELE Spanish B1 Wrappers
import DeleReadingPart1Wrapper from '../components/exam-wrappers/DeleReadingPart1Wrapper';
import DeleReadingPart2Wrapper from '../components/exam-wrappers/DeleReadingPart2Wrapper';
import DeleReadingPart3Wrapper from '../components/exam-wrappers/DeleReadingPart3Wrapper';
import DeleListeningPart1Wrapper from '../components/exam-wrappers/DeleListeningPart1Wrapper';
import DeleListeningPart2Wrapper from '../components/exam-wrappers/DeleListeningPart2Wrapper';
import DeleListeningPart3Wrapper from '../components/exam-wrappers/DeleListeningPart3Wrapper';
import DeleListeningPart4Wrapper from '../components/exam-wrappers/DeleListeningPart4Wrapper';
import DeleListeningPart5Wrapper from '../components/exam-wrappers/DeleListeningPart5Wrapper';
import {
  type MockExamProgress,
} from '../types/mock-exam.types';
import {
  loadMockExamProgress,
  updateStepProgress,
  clearMockExamProgress,
  getTestIdForStep,
  navigateToStep,
} from '../services/mock-exam.service';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import { UserAnswer, ExamResult } from '../types/exam.types';
import AdBanner from '../components/AdBanner';
import ResultsModal from '../components/ResultsModal';
import DeleGrammarPart1Wrapper from '../components/exam-wrappers/DeleGrammarPart1Wrapper';
import DeleGrammarPart2Wrapper from '../components/exam-wrappers/DeleGrammarPart2Wrapper';
import WritingResultsModal from '../components/exam-ui/WritingResultsModal';
import { WritingAssessmentResult } from '../services/http.openai.service';
import { dataService } from '../services/data.service';
import WritingResultsModalA1 from '../components/exam-ui/WritingResultsModalA1';
import WritingPart1ResultsModalA1 from '../components/exam-ui/WritingPart1ResultsModalA1';
import { WritingAssessmentA1 } from '../services/http.openai.service';

const MockExamRunningScreen: React.FC = () => {
  const navigation = useNavigation();
  const [examProgress, setExamProgress] = useState<MockExamProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStepResult, setSelectedStepResult] = useState<ExamResult | null>(null);
  const [isResultsModalVisible, setIsResultsModalVisible] = useState(false);
  const [selectedWritingAssessment, setSelectedWritingAssessment] = useState<WritingAssessmentResult | null>(null);
  const [selectedWritingExam, setSelectedWritingExam] = useState<any>(null);
  const [isWritingResultsModalVisible, setIsWritingResultsModalVisible] = useState(false);
  // A1 Writing modals
  const [selectedWritingAssessmentA1, setSelectedWritingAssessmentA1] = useState<any>(null);
  const [selectedWritingExamA1, setSelectedWritingExamA1] = useState<any>(null);
  const [isWritingPart1ResultsModalA1Visible, setIsWritingPart1ResultsModalA1Visible] = useState(false);
  const [isWritingPart2ResultsModalA1Visible, setIsWritingPart2ResultsModalA1Visible] = useState(false);
  const [writingPart1ResultsA1, setWritingPart1ResultsA1] = useState<{
    score: number;
    totalQuestions: number;
    results: Array<{
      questionNumber: number;
      fieldLabel: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    }>;
  } | null>(null);
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isA1 = activeExamConfig.level === 'A1';
  const isA2 = activeExamConfig.level === 'A2';
  const isDele = activeExamConfig.id === 'dele-spanish-b1';
  const scoreMultiplier = activeExamConfig.provider === 'dele' ? 1 : 3;

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

  const handleCompleteStep = async (correctCount: number, answers: UserAnswer[]) => {
    try {
      let score = correctCount;
      const currentStep = examProgress.steps.find(step => step.id === examProgress.currentStepId);
      if (currentStep) {
        if (isDele && currentStep.sectionNumber === 4) { // Writing Section for DELE
          score = correctCount / 2; // The max points is 12.5 and the evaluation is out of 25
        } else if (isA1 && currentStep.sectionNumber === 4) { // Writing Section for A1
          score = correctCount; // Writing Part 1 and Part 2 are evaluated with the same score
        } else if (currentStep.sectionNumber === 4) { // Writing Section for B1/B2
          score = correctCount; // The max points is 12.5 and the evaluation is out of 25
        } else {
          // If the step has maxPoints defined, scale the score accordingly
          if (currentStep.maxPoints) {
            const pointsPerQuestion = currentStep.maxPoints / answers.length;
            // Calculate scaled score to the first decimal place
            score = Math.round(correctCount * pointsPerQuestion * 10) / 10;
          }
        }
      }

      console.log('[MockExamRunningScreen] User completed step:', examProgress.currentStepId, 'Score:', score, answers);
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

  const handleGoBack = () => {
    // Check if we can go back, otherwise navigate to Main
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
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
            handleGoBack();
          },
        },
      ]
    );
  };

  const handleStepPress = async (stepId: string) => {
    if (!__DEV__) return; // Only allow in development mode

    try {
      console.log('[DEV] Navigating to step:', stepId);
      await navigateToStep(stepId);

      // Reload progress from storage to get updated state
      const updatedProgress = await loadMockExamProgress();
      if (updatedProgress) {
        setExamProgress(updatedProgress);
      }
    } catch (error) {
      console.error('[DEV] Error navigating to step:', error);
      Alert.alert('Dev Mode', `Failed to navigate to step: ${error}`);
    }
  };

  const handleViewStepResults = async (stepId: string) => {
    if (!examProgress) return;

    const step = examProgress.steps.find(s => s.id === stepId);
    if (!step?.answers || step.answers.length === 0) {
      Alert.alert(t('common.error'), t('mockExam.noResultsAvailable'));
      return;
    }

    // Check if this is a writing step
    const isWritingStep = stepId.includes('writing');
    const isB1OrB2Level = activeExamConfig.level === 'B1' || activeExamConfig.level === 'B2';

    // Handle B1/B2 writing results
    if (isWritingStep && isB1OrB2Level && step.answers.length > 0) {
      // For writing steps, try to extract the WritingAssessment from answers
      const firstAnswer = step.answers[0];

      // Check if we have assessment data stored
      if (firstAnswer.assessment) {
        setSelectedWritingAssessment(firstAnswer.assessment as WritingAssessmentResult);

        // Load the exam data for this writing step
        try {
          const testId = getTestIdForStep(stepId, examProgress.selectedTests);
          let loadedExam;

          if (isDele) {
            if (stepId === 'writing-1') {
              loadedExam = await dataService.getDeleWritingPart1ExamById(testId);
            } else if (stepId === 'writing-2') {
              loadedExam = await dataService.getDeleWritingPart2ExamById(testId);
            }
          } else {
            loadedExam = await dataService.getWritingExam(testId);
          }

          if (loadedExam) {
            setSelectedWritingExam(loadedExam);
            setIsWritingResultsModalVisible(true);
            return;
          }
        } catch (error) {
          console.error('Error loading writing exam data:', error);
        }
      }
    }

    // Handle A1/A2 writing results (same format: writing-part1 form fill + writing-part2 short message)
    if (isWritingStep && (isA1 || isA2) && step.answers.length > 0) {
      const firstAnswer = step.answers[0];

      // Check if we have assessment data stored (Part 2 - WritingPart2UIA1)
      if (firstAnswer.assessment) {

        // Load the exam data for this writing step
        try {
          const testId = getTestIdForStep(stepId, examProgress.selectedTests);
          let loadedExam;

          if (stepId === 'writing-part1') {
            loadedExam = await dataService.getWritingPart1Exam(String(testId));

            if (loadedExam) {
              setSelectedWritingExamA1(loadedExam);
              setIsWritingPart1ResultsModalA1Visible(true);
              setWritingPart1ResultsA1(firstAnswer.assessment);

              return
            }
          }

          if (stepId === 'writing-part2') {
            loadedExam = await dataService.getWritingPart2Exam(String(testId));

            if (loadedExam) {
              setSelectedWritingExamA1(loadedExam);
              setIsWritingPart2ResultsModalA1Visible(true);
              setSelectedWritingAssessmentA1(firstAnswer.assessment);
              return
            }
          }
        } catch (error) {
          console.error('Error loading A1 writing exam data:', error);
        }
      }
    }

    // Calculate correct answers count
    const correctAnswers = step.answers.filter(a => a.isCorrect).length;

    // Create an ExamResult object from the step data
    const examResult: ExamResult = {
      examId: `${examProgress.examId}-${stepId}`,
      score: step.score || 0,
      maxScore: step.maxPoints,
      percentage: step.maxPoints > 0 ? Math.round(((step.score || 0) / step.maxPoints) * 100) : 0,
      correctAnswers,
      totalQuestions: step.answers.length,
      answers: step.answers,
      timestamp: step.endTime || Date.now(),
    };

    setSelectedStepResult(examResult);
    setIsResultsModalVisible(true);
  };

  const renderStepContent = () => {
    console.log('[MockExamRunningScreen] renderStepContent: currentStep', currentStep);
    if (!currentStep) return null;

    // Get testId for current step
    const testId = getTestIdForStep(currentStep.id, examProgress.selectedTests);

    // Check if it's a speaking section (German: section 5, DELE: section 5)
    const speakingSectionNumber = 5; // BUG: check this for Telc exams, I only checked DELE
    if (currentStep.sectionNumber === speakingSectionNumber) {
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

    // DELE Spanish B1 Exam Structure
    if (isDele) {
      // Section 1: Reading (Comprensión de Lectura)
      if (currentStep.id === 'reading-1') {
        return <DeleReadingPart1Wrapper testId={testId} onComplete={handleCompleteStep} />;
      }
      if (currentStep.id === 'reading-2') {
        return <DeleReadingPart2Wrapper testId={testId} onComplete={handleCompleteStep} />;
      }
      if (currentStep.id === 'reading-3') {
        return <DeleReadingPart3Wrapper testId={testId} onComplete={handleCompleteStep} />;
      }

      if (currentStep.id === 'grammar-1') {
        return <DeleGrammarPart1Wrapper testId={testId} onComplete={handleCompleteStep} />;
      }
      if (currentStep.id === 'grammar-2') {
        return <DeleGrammarPart2Wrapper testId={testId} onComplete={handleCompleteStep} />;
      }

      // Section 2: Writing (Expresión e Interacción Escritas)
      if (currentStep.id === 'writing-1' || currentStep.id === 'writing-2') {
        return <WritingWrapper testId={testId} stepId={currentStep.id} onComplete={handleCompleteStep} />;
      }

      // Section 3: Listening (Comprensión Auditiva)
      if (currentStep.id === 'listening-1') {
        return <DeleListeningPart1Wrapper testId={testId} onComplete={handleCompleteStep} />;
      }
      if (currentStep.id === 'listening-2') {
        return <DeleListeningPart2Wrapper testId={testId} onComplete={handleCompleteStep} />;
      }
      if (currentStep.id === 'listening-3') {
        return <DeleListeningPart3Wrapper testId={testId} onComplete={handleCompleteStep} />;
      }
      if (currentStep.id === 'listening-4') {
        return <DeleListeningPart4Wrapper testId={testId} onComplete={handleCompleteStep} />;
      }
      if (currentStep.id === 'listening-5') {
        return <DeleListeningPart5Wrapper testId={testId} onComplete={handleCompleteStep} />;
      }

      return null;
    }

    // German/English Telc/Goethe Exam Structure
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

    // Section 2: Language (Sprachbausteine) - B1/B2 only (not in A1 or A2)
    if (!isA1 && !isA2 && currentStep.id === 'language-1') {
      return <LanguagePart1Wrapper testId={testId} onComplete={handleCompleteStep} />;
    }
    if (!isA1 && !isA2 && currentStep.id === 'language-2') {
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
    // A1 has writing-part1 and writing-part2, B1/B2 have just 'writing'
    if (currentStep.id === 'writing' || currentStep.id === 'writing-part1' || currentStep.id === 'writing-part2') {
      return <WritingWrapper testId={testId} stepId={currentStep.id} onComplete={handleCompleteStep} />;
    }

    return null;
  };


  const renderResults = () => {
    let writtenScore, oralScore, writtenMaxPoints, oralMaxPoints;
    let passingWrittenPoints, passingOralPoints, passingTotalPoints;

    if (isDele) {
      // DELE B1: Group 1 (Reading + Writing) and Group 2 (Listening + Speaking)
      // Group 1: Reading (section 1) + Writing (section 2) = 50 points
      writtenScore = examProgress.steps
        .filter(step => [1, 2, 4].includes(step.sectionNumber))
        .reduce((acc, step) => acc + (step.score || 0), 0);

      // Group 2: Listening (section 3) = 25 points
      // We skip speaking section (section 4) in mock exam
      oralScore = examProgress.steps
        .filter(step => step.sectionNumber === 3)
        .reduce((acc, step) => acc + (step.score || 0), 0);

      writtenMaxPoints = 50; // Reading (25) + Writing (25)
      oralMaxPoints = 25; // Listening (25) + Speaking (0, skipped in mock exam)

      passingWrittenPoints = 30; // 60% of 50
      passingOralPoints = 15; // 60% of 25
      passingTotalPoints = 45; // 60% of 75
    } else {
      // German/English Telc: Sections 1-4 are written, section 5 is oral
      writtenScore = examProgress.steps
        .filter(step => step.sectionNumber <= 4)
        .reduce((acc, step) => acc + (step.score || 0), 0);

      oralScore = examProgress.steps
        .filter(step => step.sectionNumber === 5)
        .reduce((acc, step) => acc + (step.score || 0), 0);

      oralMaxPoints = (isA1 || isA2) ? 15 : 75;
      writtenMaxPoints = examProgress.totalMaxPoints; // For Telc, we calculate total max points = the written max points

      passingWrittenPoints = (isA1 || isA2) ? 27 : 135; // 60% of written max
      passingOralPoints = (isA1 || isA2) ? 9 : 45; // 60% of oral max
      passingTotalPoints = passingWrittenPoints // Exclude oral passing points for total
    }

    const writtenPercentage = (writtenScore / writtenMaxPoints) * 100;
    const oralPercentage = (oralScore / oralMaxPoints) * 100;

    const totalPercentage = (examProgress.totalScore / examProgress.totalMaxPoints) * 100;

    const passedWritten = writtenScore >= passingWrittenPoints;
    const passedOral = isDele ? oralScore >= passingOralPoints : true; // Telc oral is skipped

    // When oral exam is skipped, only need to pass written portion
    // When oral exam is taken, need to pass total (which includes both written and oral)
    const passedOverall = (examProgress.totalScore >= passingTotalPoints && passedWritten && passedOral);

    return (
      <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
        <Text style={styles.resultsTitle}>{t('mockExam.examResultsTitle')}</Text>

        {/* Overall Result */}
        <View style={styles.resultCard}>
          <Text style={[
            styles.resultCardTitle,
            passedOverall ? styles.resultCardTitlePass : styles.resultCardTitleFail
          ]}>
            {passedOverall ? '✅ ' : '❌ '}
            {passedOverall ? t('mockExam.passed') : t('mockExam.failed')}
          </Text>
          <Text style={[
            styles.resultScore,
            passedOverall ? styles.resultScorePass : styles.resultScoreFail
          ]}>
            {examProgress.totalScore.toFixed(1)} / {examProgress.totalMaxPoints} ({totalPercentage.toFixed(1)}%)
          </Text>
          <Text style={styles.resultRequirement}>
            {t('mockExam.requirementText', { percentage: '60' })}
          </Text>
        </View>

        {/* Written Component */}
        <View style={styles.componentCard}>
          <Text style={styles.componentTitle}>
            {isDele ? t('mockExam.deleReadingWriting') : t('mockExam.writtenExam')}
          </Text>
          <Text style={styles.componentScore}>
            {writtenScore.toFixed(1)} / {writtenMaxPoints} ({writtenPercentage.toFixed(1)}%)
          </Text>
          <Text style={[
            styles.componentStatus,
            passedWritten ? styles.componentStatusPass : styles.componentStatusFail
          ]}>
            {passedWritten ? `✓ ${t('mockExam.passed')} (≥60%)` : `✗ ${t('mockExam.failed')} (<60%)`}
          </Text>
        </View>

        {/* Show Oral Component Only for DELE */}
        {isDele && (
          <View style={styles.componentCard}>
            <Text style={styles.componentTitle}>
              {isDele ? t('mockExam.deleListeningSpeaking') : t('mockExam.oralExam')}
            </Text>
            <Text style={styles.componentScore}>
              {oralScore.toFixed(1)} / {oralMaxPoints} ({oralPercentage.toFixed(1)}%)
            </Text>
            <Text style={[
              styles.componentStatus,
              passedOral ? styles.componentStatusPass : styles.componentStatusFail
            ]}>
              {passedOral ? `✓ ${t('mockExam.passed')} (≥60%)` : `✗ ${t('mockExam.failed')} (<60%)`}
            </Text>
          </View>
        )}

        {/* Detailed Step Breakdown */}
        <View style={styles.stepBreakdownSection}>
          <Text style={styles.stepBreakdownTitle}>{t('mockExam.detailedBreakdown')}</Text>

          {examProgress.steps.map((step, index) => {
            const stepPercentage = step.maxPoints > 0
              ? ((step.score || 0) / step.maxPoints) * 100
              : 0;
            const speakingSectionNumber = isDele ? 5 : 5; // BUG: Telc has different levels, check needed
            const isSkipped = step.sectionNumber === speakingSectionNumber && (step.score || 0) === 0;

            return (
              <View key={step.id} style={styles.stepBreakdownCard}>
                <View style={styles.stepBreakdownContent}>
                  <View style={styles.stepBreakdownHeader}>
                    <Text style={styles.stepBreakdownNumber}>{index + 1}</Text>
                    <View style={styles.stepBreakdownInfo}>
                      <Text style={styles.stepBreakdownPartName}>{step.partName}</Text>
                      <Text style={styles.stepBreakdownSectionName}>{step.sectionName}</Text>
                    </View>
                  </View>
                  <View style={styles.stepBreakdownScores}>
                    {isSkipped ? (
                      <Text style={styles.stepBreakdownSkipped}>{t('mockExam.skipped')}</Text>
                    ) : (
                      <>
                        <Text style={styles.stepBreakdownScore}>
                          {step.score || 0} / {step.maxPoints}
                        </Text>
                        <Text style={[
                          styles.stepBreakdownPercentage,
                          stepPercentage >= 60 ? styles.stepBreakdownPercentagePass : styles.stepBreakdownPercentageFail
                        ]}>
                          {stepPercentage.toFixed(1)}%
                        </Text>
                      </>
                    )}
                  </View>
                </View>
                {/* View Results Button - Only show if step has answers and is not skipped */}
                {!isSkipped && step.answers && step.answers.length > 0 && (
                  <TouchableOpacity
                    style={styles.viewResultsButton}
                    onPress={() => handleViewStepResults(step.id)}
                  >
                    <Text style={styles.viewResultsButtonText}>{t('mockExam.viewAnswers')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

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
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderResults()}

        {/* Persistent Banner at Bottom */}
        <SafeAreaView edges={['bottom']} style={styles.bannerContainer}>
          <AdBanner screen="mock-exam-results" />
        </SafeAreaView>

        {/* Results Modal */}
        <ResultsModal
          visible={isResultsModalVisible}
          result={selectedStepResult}
          onClose={() => setIsResultsModalVisible(false)}
          examTitle={examProgress.examId}
        />

        {/* Writing Results Modal */}
        {selectedWritingAssessment && selectedWritingExam && (
          <WritingResultsModal
            isOpen={isWritingResultsModalVisible}
            onClose={() => {
              setIsWritingResultsModalVisible(false);
              setSelectedWritingAssessment(null);
              setSelectedWritingExam(null);
            }}
            assessment={selectedWritingAssessment}
            isUsingCachedResult={false}
            modalAnswer={selectedWritingExam?.modalAnswer}
            scoreMultiplier={scoreMultiplier}
          />
        )}

        {/* A1 Writing Part 2 Results Modal */}
        {selectedWritingAssessmentA1 && selectedWritingExamA1 && (
          <WritingResultsModalA1
            isOpen={isWritingPart2ResultsModalA1Visible}
            onClose={() => {
              setIsWritingPart2ResultsModalA1Visible(false);
              setSelectedWritingAssessmentA1(null);
              setSelectedWritingExamA1(null);
            }}
            assessment={selectedWritingAssessmentA1}
            isUsingCachedResult={false}
            lastEvaluatedAnswer=""
            modalAnswer={selectedWritingExamA1?.modalAnswer}
          />
        )}

        {/* A1 Writing Part 1 Results Modal */}
        {writingPart1ResultsA1 && (
          <WritingPart1ResultsModalA1
            isOpen={isWritingPart1ResultsModalA1Visible}
            onClose={() => {
              setIsWritingPart1ResultsModalA1Visible(false);
              setWritingPart1ResultsA1(null);
            }}
            onRetry={() => {
              setIsWritingPart1ResultsModalA1Visible(false);
              setWritingPart1ResultsA1(null);
            }}
            score={writingPart1ResultsA1.score}
            totalQuestions={writingPart1ResultsA1.totalQuestions}
            results={writingPart1ResultsA1.results}
            isMockExam={true}
          />
        )}

      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Fixed Stepper at Top */}
      <ExamStepper
        steps={examProgress.steps}
        currentStepId={examProgress.currentStepId}
        onStepPress={__DEV__ ? handleStepPress : undefined}
      />

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

      {/* Persistent Banner at Bottom */}
      <SafeAreaView edges={['bottom']} style={styles.bannerContainer}>
        <AdBanner screen="mock-exam-running" />
      </SafeAreaView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
    flexDirection: 'row',
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
    textAlign: 'left',
  },
  stepHeaderPart: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'left',
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
    flexDirection: 'row',
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
    marginBottom: spacing.margin.lg,
  },
  resultCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.xl,
    borderRadius: spacing.borderRadius.lg,
    marginBottom: spacing.margin.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: colors.secondary[200],
  },
  resultCardTitle: {
    ...typography.textStyles.h2,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.md,
  },
  resultCardTitlePass: {
    color: colors.success[600],
  },
  resultCardTitleFail: {
    color: colors.error[600],
  },
  resultScore: {
    ...typography.textStyles.h2,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.xs,
  },
  resultScorePass: {
    color: colors.success[700],
  },
  resultScoreFail: {
    color: colors.error[700],
  },
  resultPercentage: {
    ...typography.textStyles.h3,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.margin.sm,
  },
  resultPercentagePass: {
    color: colors.success[600],
  },
  resultPercentageFail: {
    color: colors.error[600],
  },
  resultRequirement: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.margin.xs,
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
  stepBreakdownSection: {
    marginTop: spacing.margin.lg,
    marginBottom: spacing.margin.lg,
  },
  stepBreakdownTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.sm,
  },
  stepBreakdownCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[400],
  },
  stepBreakdownContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.margin.xs,
  },
  stepBreakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepBreakdownNumber: {
    ...typography.textStyles.body,
    color: colors.background.secondary,
    backgroundColor: colors.primary[500],
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: typography.fontWeight.bold,
    marginRight: spacing.margin.sm,
  },
  stepBreakdownInfo: {
    flex: 1,
  },
  stepBreakdownPartName: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 2,
  },
  stepBreakdownSectionName: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
  stepBreakdownScores: {
    alignItems: 'flex-end',
  },
  stepBreakdownScore: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  stepBreakdownPercentage: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
  },
  stepBreakdownPercentagePass: {
    color: colors.success[600],
  },
  stepBreakdownPercentageFail: {
    color: colors.error[600],
  },
  stepBreakdownSkipped: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  viewResultsButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.xs,
    paddingHorizontal: spacing.padding.sm,
    borderRadius: spacing.borderRadius.sm,
    marginTop: spacing.margin.xs,
  },
  viewResultsButtonText: {
    ...typography.textStyles.bodySmall,
    color: colors.background.secondary,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
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
  bannerContainer: {
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.secondary[100],
  },
});

export default MockExamRunningScreen;
