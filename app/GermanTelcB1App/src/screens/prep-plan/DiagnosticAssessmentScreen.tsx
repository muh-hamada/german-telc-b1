/**
 * Diagnostic Assessment Screen
 * 
 * Multi-section assessment to evaluate user's current level across all exam sections.
 * Includes: Reading, Listening, Grammar (B1/B2 only), Writing, and Speaking.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useAppTheme } from '../../contexts/ThemeContext';
import { spacing, typography, type ThemeColors } from '../../theme';
import { diagnosticService } from '../../services/diagnostic.service';
import { prepPlanService } from '../../services/prep-plan.service';
import { useAuth } from '../../contexts/AuthContext';
import { activeExamConfig } from '../../config/active-exam.config';
import { getEnabledSections, getPrepPlanConfig } from '../../config/prep-plan-level.config';
import { DiagnosticExam, DiagnosticAnswers } from '../../types/prep-plan.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import type { HomeStackNavigationProp } from '../../types/navigation.types';

// Import existing exam UI components
import ReadingPart1UI from '../../components/exam-ui/ReadingPart1UI';
import ReadingPart1A1UI from '../../components/exam-ui/ReadingPart1A1UI';
import ListeningPart1UI from '../../components/exam-ui/ListeningPart1UI';
import ListeningPart1UIA1 from '../../components/exam-ui/ListeningPart1UIA1';
import LanguagePart1UI from '../../components/exam-ui/LanguagePart1UI';
import { dataService } from '../../services/data.service';
import { UserAnswer } from '../../types/exam.types';

type SectionName = 'reading' | 'listening' | 'grammar' | 'writing' | 'speaking';

const DiagnosticAssessmentScreen: React.FC = () => {
  const { t } = useCustomTranslation();
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [isLoading, setIsLoading] = useState(true);
  const [diagnosticExam, setDiagnosticExam] = useState<DiagnosticExam | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<DiagnosticAnswers>({
    examId: '',
    userId: user?.uid || '',
    answers: {
      reading: {},
      listening: {},
      grammar: {},
      writing: { text: '', wordCount: 0 },
      speaking: { dialogueId: '', audioUrls: [], transcriptions: [] },
    },
    startedAt: Date.now(),
    submittedAt: 0,
  });
  const [startTime] = useState(Date.now());
  const [sectionData, setSectionData] = useState<any>(null);
  const [isLoadingSection, setIsLoadingSection] = useState(false);

  const examLevel = activeExamConfig.level;
  const levelConfig = getPrepPlanConfig(examLevel);
  const enabledSections = getEnabledSections(examLevel);
  const currentSection = enabledSections[currentSectionIndex];

  // Load diagnostic exam on mount
  useEffect(() => {
    loadDiagnosticExam();
  }, []);

  const loadDiagnosticExam = async () => {
    try {
      setIsLoading(true);
      const exam = await diagnosticService.generateDiagnosticExam();
      setDiagnosticExam(exam);
      setAnswers(prev => ({ ...prev, examId: exam.examId }));
      
      logEvent(AnalyticsEvents.PREP_PLAN_DIAGNOSTIC_STARTED, {
        examLevel,
        examId: exam.examId,
      });
      
      // Load first section data
      await loadSectionData(0);
    } catch (error) {
      console.error('[DiagnosticAssessment] Error loading exam:', error);
      Alert.alert(t('common.error'), t('prepPlan.diagnostic.loadError'));
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const loadSectionData = async (sectionIndex: number) => {
    if (sectionIndex >= enabledSections.length) return;
    
    const section = enabledSections[sectionIndex];
    setIsLoadingSection(true);
    
    try {
      let data = null;
      
      switch (section.sectionName) {
        case 'reading':
          if (examLevel === 'A1') {
            const examId = diagnosticExam?.sections.reading?.[0] || 1;
            data = await dataService.getReadingPart1A1ExamById(examId);
          } else {
            const examId = diagnosticExam?.sections.reading?.[0] || 1;
            data = await dataService.getReadingPart1ExamById(examId);
          }
          break;
        case 'listening':
          if (examLevel === 'A1') {
            const examId = diagnosticExam?.sections.listening?.[0] || 1;
            const listeningData = await dataService.getListeningPart1Content();
            data = listeningData.exams?.[examId - 1];
          } else {
            const examId = diagnosticExam?.sections.listening?.[0] || 1;
            const listeningData = await dataService.getListeningPart1Content();
            data = listeningData.exams?.[examId - 1];
          }
          break;
        case 'grammar':
          const examId = diagnosticExam?.sections.grammar?.[0] || 1;
          data = await dataService.getGrammarPart1Exam(examId);
          break;
        case 'writing':
          // For writing, we should show a placeholder or skip for now
          // since navigating away would interrupt the assessment flow
          setSectionData({ placeholder: true });
          return;
        case 'speaking':
          // For speaking, we should show a placeholder or skip for now
          // since navigating away would interrupt the assessment flow
          setSectionData({ placeholder: true });
          return;
      }
      
      setSectionData(data);
    } catch (error) {
      console.error('[DiagnosticAssessment] Error loading section data:', error);
      Alert.alert(t('common.error'), t('prepPlan.diagnostic.sectionLoadError'));
    } finally {
      setIsLoadingSection(false);
    }
  };

  const handleSectionComplete = async (score: number, sectionAnswers: UserAnswer[]) => {
    if (!diagnosticExam || !currentSection) return;

    // Store answers for current section
    const updatedAnswers = { ...answers };
    const sectionName = currentSection.sectionName as SectionName;
    
    if (sectionName === 'reading' || sectionName === 'listening' || sectionName === 'grammar') {
      updatedAnswers.answers[sectionName] = sectionAnswers.reduce((acc, answer) => {
        acc[answer.questionId] = answer.answer;
        return acc;
      }, {} as { [key: string]: any });
    }
    
    setAnswers(updatedAnswers);

    logEvent(AnalyticsEvents.PREP_PLAN_DIAGNOSTIC_SECTION_COMPLETED, {
      section: sectionName,
      score,
      maxScore: currentSection.assessmentMaxPoints,
    });

    // Move to next section or complete
    if (currentSectionIndex < enabledSections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      await loadSectionData(currentSectionIndex + 1);
    } else {
      // All sections complete - evaluate
      await completeAssessment(updatedAnswers);
    }
  };

  const completeAssessment = async (finalAnswers: DiagnosticAnswers) => {
    if (!diagnosticExam || !user) return;

    try {
      setIsLoading(true);
      finalAnswers.submittedAt = Date.now();
      
      // Evaluate diagnostic
      const assessment = await diagnosticService.evaluateDiagnostic(
        diagnosticExam,
        finalAnswers
      );

      // Save assessment to user's prep plan progress
      await prepPlanService.saveAssessment(user.uid, assessment);

      const timeSpent = Math.round((Date.now() - startTime) / 1000 / 60); // minutes
      
      logEvent(AnalyticsEvents.PREP_PLAN_DIAGNOSTIC_COMPLETED, {
        examLevel,
        overallScore: assessment.overallScore,
        overallPercentage: assessment.overallPercentage,
        timeSpentMinutes: timeSpent,
      });

      // Navigate to results
      navigation.navigate('AssessmentResults', { assessmentId: assessment.assessmentId });
    } catch (error) {
      console.error('[DiagnosticAssessment] Error completing assessment:', error);
      Alert.alert(t('common.error'), t('prepPlan.diagnostic.evaluationError'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderProgressBar = () => {
    const progress = (currentSectionIndex / enabledSections.length) * 100;
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {t('prepPlan.diagnostic.sectionProgress', {
              current: currentSectionIndex + 1,
              total: enabledSections.length,
            })}
          </Text>
          <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>
    );
  };

  const renderSectionContent = () => {
    if (!currentSection || !sectionData || isLoadingSection) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>{t('prepPlan.diagnostic.loadingSection')}</Text>
        </View>
      );
    }

    const sectionName = currentSection.sectionName;

    switch (sectionName) {
      case 'reading':
        if (examLevel === 'A1') {
          return (
            <ReadingPart1A1UI
              exam={sectionData}
              onComplete={handleSectionComplete}
            />
          );
        } else {
          return (
            <ReadingPart1UI
              exam={sectionData}
              onComplete={handleSectionComplete}
            />
          );
        }
      
      case 'listening':
        if (examLevel === 'A1') {
          return (
            <ListeningPart1UIA1
              exam={sectionData}
              sectionDetails={{ part: 1, title: 'Listening Part 1' }}
              onComplete={handleSectionComplete}
            />
          );
        } else {
          return (
            <ListeningPart1UI
              exam={sectionData}
              sectionDetails={{ part: 1, title: 'Listening Part 1' }}
              onComplete={handleSectionComplete}
            />
          );
        }
      
      case 'grammar':
        return (
          <LanguagePart1UI
            exam={sectionData}
            onComplete={handleSectionComplete}
          />
        );
      
      default:
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              {t('prepPlan.diagnostic.sectionComingSoon', { section: sectionName })}
            </Text>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => handleSectionComplete(0, [])}
            >
              <Text style={styles.skipButtonText}>{t('common.skip')}</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  if (isLoading && !diagnosticExam) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>{t('prepPlan.diagnostic.generating')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with progress */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('prepPlan.diagnostic.title')}</Text>
        <Text style={styles.subtitle}>
          {currentSection && t(`prepPlan.diagnostic.sections.${currentSection.sectionName}`)}
        </Text>
        {renderProgressBar()}
      </View>

      {/* Section Content */}
      <View style={styles.content}>
        {renderSectionContent()}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.padding.xl,
  },
  header: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.lg,
    paddingTop: spacing.padding.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.margin.md,
  },
  progressContainer: {
    marginTop: spacing.margin.md,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.margin.xs,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  progressPercentage: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: spacing.borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: spacing.borderRadius.full,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.padding.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.margin.md,
    textAlign: 'center',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.padding.xl,
  },
  placeholderText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.margin.lg,
  },
  skipButton: {
    backgroundColor: colors.secondary[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.xl,
    borderRadius: spacing.borderRadius.md,
  },
  skipButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.inverse,
  },
});

export default DiagnosticAssessmentScreen;

