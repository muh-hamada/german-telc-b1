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
import type { StackScreenProps } from '@react-navigation/stack';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useAppTheme } from '../../contexts/ThemeContext';
import { spacing, typography, type ThemeColors } from '../../theme';
import { diagnosticService } from '../../services/diagnostic.service';
import { prepPlanService } from '../../services/prep-plan.service';
import { speakingService } from '../../services/speaking.service';
import { useAuth } from '../../contexts/AuthContext';
import { activeExamConfig } from '../../config/active-exam.config';
import { getEnabledSections, getPrepPlanConfig } from '../../config/prep-plan-level.config';
import { DiagnosticExam, DiagnosticAnswers } from '../../types/prep-plan.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import type { HomeStackNavigationProp, HomeStackParamList } from '../../types/navigation.types';

// Import existing exam UI components
import ReadingPart1UI from '../../components/exam-ui/ReadingPart1UI';
import ReadingPart1A1UI from '../../components/exam-ui/ReadingPart1A1UI';
import ListeningPart1UI from '../../components/exam-ui/ListeningPart1UI';
import ListeningPart1UIA1 from '../../components/exam-ui/ListeningPart1UIA1';
import LanguagePart1UI from '../../components/exam-ui/LanguagePart1UI';
import WritingUI from '../../components/exam-ui/WritingUI';
import WritingPart1UIA1 from '../../components/exam-ui/WritingPart1UIA1';
import WritingPart2UIA1 from '../../components/exam-ui/WritingPart2UIA1';
import { SpeakingDialogueComponent } from '../../components/speaking/SpeakingDialogueComponent';
import { dataService } from '../../services/data.service';
import { UserAnswer } from '../../types/exam.types';
import { SpeakingEvaluation } from '../../types/prep-plan.types';

type SectionName = 'reading' | 'listening' | 'grammar' | 'writing' | 'speaking';

type Props = StackScreenProps<HomeStackParamList, 'DiagnosticAssessment'>;

const DiagnosticAssessmentScreen: React.FC<Props> = () => {
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
  const [speakingAudioPaths, setSpeakingAudioPaths] = useState<string[]>([]); // Store audio paths for batch upload

  const examLevel = activeExamConfig.level;
  const levelConfig = getPrepPlanConfig(examLevel);
  const enabledSections = getEnabledSections(examLevel);
  const currentSection = enabledSections[currentSectionIndex];

  // Load diagnostic exam on mount
  useEffect(() => {
    loadDiagnosticExam();
  }, []);

  // Save progress whenever section or answers change
  useEffect(() => {
    if (diagnosticExam && currentSectionIndex >= 0) {
      saveDiagnosticProgress();
    }
  }, [currentSectionIndex, answers, diagnosticExam]);

  // Add back button handler to save progress before leaving
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // If assessment is not complete, save progress
      if (diagnosticExam && currentSectionIndex < enabledSections.length) {
        saveDiagnosticProgress();
      }
    });

    return unsubscribe;
  }, [navigation, diagnosticExam, currentSectionIndex, answers]);

  const loadDiagnosticExam = async () => {
    try {
      setIsLoading(true);
      
      // Check for saved progress first
      const savedProgress = await prepPlanService.getDiagnosticProgress();
      
      if (savedProgress) {
        // Resume from saved progress
        console.log('[DiagnosticAssessment] Resuming from saved progress');
        
        // Show confirmation dialog to user
        Alert.alert(
          t('prepPlan.diagnostic.resumeTitle'),
          t('prepPlan.diagnostic.resumeMessage'),
          [
            {
              text: t('prepPlan.diagnostic.startOver'),
              style: 'destructive',
              onPress: async () => {
                // Clear saved progress and start fresh
                await prepPlanService.clearDiagnosticProgress();
                await generateNewDiagnostic();
              },
            },
            {
              text: t('prepPlan.diagnostic.resume'),
              onPress: async () => {
                // Load saved exam and continue
                const exam = await diagnosticService.generateDiagnosticExam();
                exam.examId = savedProgress.examId; // Use the same exam ID
                
                setDiagnosticExam(exam);
                setAnswers(savedProgress.answers);
                setCurrentSectionIndex(savedProgress.currentSectionIndex);
                
                // Load the current section data
                await loadSectionData(savedProgress.currentSectionIndex);
              },
            },
          ]
        );
      } else {
        // No saved progress, generate new diagnostic
        await generateNewDiagnostic();
      }
    } catch (error) {
      console.error('[DiagnosticAssessment] Error loading exam:', error);
      Alert.alert(t('common.error'), t('prepPlan.diagnostic.loadError'));
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewDiagnostic = async () => {
    const exam = await diagnosticService.generateDiagnosticExam();
    setDiagnosticExam(exam);
    setAnswers(prev => ({ ...prev, examId: exam.examId }));
    
    logEvent(AnalyticsEvents.PREP_PLAN_DIAGNOSTIC_STARTED, {
      examLevel,
      examId: exam.examId,
    });
    
    // Load first section data
    await loadSectionData(0);
  };

  const saveDiagnosticProgress = async () => {
    if (!diagnosticExam) return;
    
    try {
      await prepPlanService.saveDiagnosticProgress({
        examId: diagnosticExam.examId,
        currentSectionIndex,
        answers,
        startTime,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error('[DiagnosticAssessment] Error saving progress:', error);
      // Don't show error to user, just log it
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
          const grammarExamId = diagnosticExam?.sections.grammar?.[0] || 1;
          data = await dataService.getGrammarPart1Exam(grammarExamId);
          break;
        case 'writing':
          if (examLevel === 'A1') {
            // A1 has two writing parts - for diagnostic, we just use the single writing ID for both
            const writingExamId = typeof diagnosticExam?.sections.writing === 'number' 
              ? diagnosticExam.sections.writing 
              : 1;
            
            if (section.partNumber === 1) {
              data = await dataService.getWritingPart1Exam(writingExamId);
            } else {
              data = await dataService.getWritingPart2Exam(writingExamId);
            }
          } else {
            // B1/B2
            Alert.alert('diagnosticExam', JSON.stringify(diagnosticExam));
            const writingExamId = typeof diagnosticExam?.sections.writing === 'number'
              ? diagnosticExam.sections.writing
              : 1;
            data = await dataService.getWritingExam(writingExamId);
          }
          break;
        case 'speaking':
          // For speaking, use the dialogue from the exam
          if (diagnosticExam?.sections.speaking) {
            data = diagnosticExam.sections.speaking;
          } else {
            setSectionData({ placeholder: true });
            return;
          }
          break;
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

      // Clear diagnostic progress since assessment is complete
      await prepPlanService.clearDiagnosticProgress();

      // Update onboarding progress to results step
      const onboardingProgress = await prepPlanService.getOnboardingProgress();
      if (onboardingProgress) {
        await prepPlanService.saveOnboardingProgress({
          ...onboardingProgress,
          step: 'results',
          assessmentId: assessment.assessmentId,
          lastUpdated: Date.now(),
        });
      }

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

    // Check for placeholder data
    if (sectionData.placeholder) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            {t('prepPlan.diagnostic.sectionComingSoon', { section: currentSection.displayName })}
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

    const sectionName = currentSection.sectionName;
    const partNumber = currentSection.partNumber;

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
      
      case 'writing':
        // Use appropriate writing UI based on exam level
        if (examLevel === 'A1') {
          // A1 has two writing parts
          if (partNumber === 1) {
            return (
              <WritingPart1UIA1
                exam={sectionData}
                onComplete={handleSectionComplete}
              />
            );
          } else {
            // Part 2
            return (
              <WritingPart2UIA1
                exam={sectionData}
                onComplete={handleSectionComplete}
                isMockExam={true}
              />
            );
          }
        } else {
          // B1/B2 use WritingUI
          return (
            <WritingUI
              exam={sectionData}
              onComplete={handleSectionComplete}
              isMockExam={true}
            />
          );
        }
      
      case 'speaking':
        // Speaking assessment with dialogue component
        if (sectionData && sectionData.turns && sectionData.turns.length > 0) {
          return (
            <SpeakingDialogueComponent
              dialogue={sectionData.turns}
              level={examLevel as 'A1' | 'B1' | 'B2'}
              onTurnComplete={async (turnIndex, audioPath, transcription) => {
                // Store audio path for later batch upload
                setSpeakingAudioPaths(prev => {
                  const updated = [...prev];
                  updated[turnIndex] = audioPath;
                  return updated;
                });
                console.log('[DiagnosticAssessment] Turn audio stored:', { turnIndex, audioPath });
              }}
              onComplete={async (evaluation: SpeakingEvaluation) => {
                if (!user) return;
                
                try {
                  console.log('[DiagnosticAssessment] Uploading', speakingAudioPaths.length, 'audio files...');
                  
                  // Upload all audio files to Firebase Storage
                  const audioUrls: string[] = [];
                  for (let i = 0; i < speakingAudioPaths.length; i++) {
                    const audioPath = speakingAudioPaths[i];
                    if (audioPath) {
                      const audioUrl = await speakingService.uploadAudio(
                        audioPath,
                        user.uid,
                        sectionData.dialogueId,
                        i
                      );
                      audioUrls.push(audioUrl);
                    }
                  }
                  
                  console.log('[DiagnosticAssessment] All audio uploaded, URLs:', audioUrls);
                  
                  // Update answers with speaking data
                  const updatedAnswers = {
                    ...answers,
                    answers: {
                      ...answers.answers,
                      speaking: {
                        dialogueId: sectionData.dialogueId,
                        audioUrls,
                        transcriptions: [], // Will be generated during evaluation
                      },
                    },
                  };
                  setAnswers(updatedAnswers);
                  
                  // Complete the section (score will be calculated during evaluation)
                  await handleSectionComplete(evaluation.totalScore, []);
                } catch (error) {
                  console.error('[DiagnosticAssessment] Error uploading audio:', error);
                  Alert.alert(
                    t('common.error'),
                    t('prepPlan.diagnostic.speaking.uploadError')
                  );
                }
              }}
            />
          );
        } else {
          // Fallback if dialogue not loaded
          return (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>
                {t('prepPlan.diagnostic.speaking.loadError')}
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
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitle}>
            {currentSection && t(`prepPlan.diagnostic.sections.${currentSection.sectionName}`)}
          </Text>
          <Text style={styles.sectionNumber}>
            {t('prepPlan.diagnostic.sectionProgress', {
              current: currentSectionIndex + 1,
              total: enabledSections.length,
            })}
          </Text>
        </View>
      </View>

      {/* Section Content */}
      <View style={styles.content}>
        {renderSectionContent()}
      </View>

      {/* <TouchableOpacity style={styles.skipButton} onPress={() => setCurrentSectionIndex(currentSectionIndex + 1)}>
        <Text style={styles.skipButtonText}>{t('common.next')}</Text>
      </TouchableOpacity> */}
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
    paddingHorizontal: spacing.padding.lg,
    paddingVertical: spacing.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  subtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    flex: 1,
  },
  sectionNumber: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  progressContainer: {
    marginTop: spacing.margin.xs,
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

