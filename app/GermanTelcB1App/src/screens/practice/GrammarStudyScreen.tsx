import React, { useState, useEffect, act, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useNavigation } from '@react-navigation/native';
import { spacing, typography, type ThemeColors } from '../../theme';
import StorageService from '../../services/storage.service';
import GrammarStudyProgressModal from '../../components/GrammarStudyProgressModal';
import SupportAdScreen from '../../components/SupportAdScreen';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import MarkdownText from '../../components/MarkdownText';
import dataService from '../../services/data.service';
import { useTranslation } from 'react-i18next';
import { useStreak } from '../../contexts/StreakContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRemoteConfig } from '../../contexts/RemoteConfigContext';
import { usePremium } from '../../contexts/PremiumContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { QUESTIONS_PER_ACTIVITY } from '../../constants/streak.constants';
import { activeExamConfig } from '../../config/active-exam.config';

interface GrammarQuestion {
  choice: string;
  is_correct: boolean;
  explanation: {
    en: string;
    de: string;
    ar: string;
    fr: string;
    ru: string;
    es: string;
  };
}

interface Sentence {
  text: string;
  translations: {
    en: string;
    de: string;
    ar: string;
    fr: string;
    ru: string;
    es: string;
  };
  question: {
    rendered_sentence: string;
    type: string;
    options: GrammarQuestion[];
  };
}

interface QuestionGroup {
  name: string;
  sentences: Sentence[];
}

const GrammarStudyScreen: React.FC = () => {
  const { t } = useCustomTranslation();
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const { recordActivity } = useStreak();
  const { isStreaksEnabledForUser, getSupportAdInterval } = useRemoteConfig();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  const navigation = useNavigation();
  
  // Get support ad interval from remote config
  const SUPPORT_AD_INTERVAL = 2;

  // Flatten all questions from all groups
  const [allQuestions, setAllQuestions] = useState<Array<{ question: Sentence; groupName: string; questionIndex: number }>>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [randomizedOptions, setRandomizedOptions] = useState<Array<{ option: GrammarQuestion; letter: string }>>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Track questions answered in this session for streak activity
  const [sessionQuestionsAnswered, setSessionQuestionsAnswered] = useState(0);
  
  // Show support ad screen between questions
  const [showSupportAdModal, setShowSupportAdModal] = useState(false);

  useEffect(() => {
    const loadAndInitialize = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Fetch grammar study questions from Firebase
        console.log('[GrammarStudyScreen] Loading grammar study questions from Firebase...');
        const grammarQuestions = await dataService.getGrammarStudyQuestions();
        console.log('[GrammarStudyScreen] Grammar questions:', grammarQuestions);
        console.log('[GrammarStudyScreen] Loaded', grammarQuestions.length, 'question groups');
        
        // Initialize questions
        const flattened: Array<{ question: Sentence; groupName: string; questionIndex: number }> = [];
        
        grammarQuestions.forEach((group: QuestionGroup) => {
          group.sentences.forEach((sentence: Sentence, sentenceIndex: number) => {
            flattened.push({
              question: sentence,
              groupName: group.name,
              questionIndex: sentenceIndex + 1
            });
          });
        });
        
        setAllQuestions(flattened);
        const totalQuestions = flattened.length;
        
        // Load progress
        const progress = await StorageService.getGrammarStudyProgress();
        
        if (progress && progress.currentQuestionIndex > 0) {
          setCurrentQuestionIndex(progress.currentQuestionIndex);
          setCompletedQuestions(progress.completedQuestions);
          setShowProgressModal(true);
        }
        
        // Load persistent session counter
        const savedCounter = await StorageService.getGrammarStudySessionCounter();
        setSessionQuestionsAnswered(savedCounter);
        console.log('[GrammarStudyScreen] Loaded session counter:', savedCounter);
        
        logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { 
          section: 'grammar_study',
          total_questions: totalQuestions,
          current_progress: progress?.currentQuestionIndex || 0,
          session_counter: savedCounter
        });
      } catch (error) {
        console.error('[GrammarStudyScreen] Error loading grammar study questions:', error);
        setLoadError('Failed to load grammar study questions. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAndInitialize();
  }, []);

  const saveProgress = async () => {
    try {
      await StorageService.saveGrammarStudyProgress(currentQuestionIndex, completedQuestions);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleAnswerSelect = async (choice: string) => {
    if (showResult) return; // Prevent changing answer after showing result
    
    setSelectedAnswer(choice);
    setShowResult(true);
    
    // Mark question as completed
    const newCompleted = new Set(completedQuestions);
    newCompleted.add(currentQuestionIndex);
    setCompletedQuestions(newCompleted);
    
    const isCorrect = allQuestions[currentQuestionIndex]?.question.question.options.find(opt => opt.choice === choice)?.is_correct || false;
    
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, {
      section: 'grammar_study',
      question_index: currentQuestionIndex,
      selected_answer: choice,
      is_correct: isCorrect
    });
    
    // Increment session question counter
    const newSessionCount = sessionQuestionsAnswered + 1;
    setSessionQuestionsAnswered(newSessionCount);
    
    // Save counter to storage
    await StorageService.saveGrammarStudySessionCounter(newSessionCount);
    
    // Record streak activity every QUESTIONS_PER_ACTIVITY questions (if enabled and user is logged in)
    if (isStreaksEnabledForUser(user?.uid) && user?.uid && newSessionCount % QUESTIONS_PER_ACTIVITY === 0) {
      try {
        const activityId = `grammar-study-session-${Date.now()}`;
        
        // Log analytics event for reaching threshold
        logEvent(AnalyticsEvents.GRAMMAR_STUDY_ACTIVITY_THRESHOLD, {
          questions_answered: newSessionCount,
          threshold: QUESTIONS_PER_ACTIVITY,
        });
        
        const result = await recordActivity({
          activityType: 'grammar_study',
          activityId: activityId,
          score: 1,
        });
        
        console.log(`[GrammarStudyScreen] Streak activity recorded after ${newSessionCount} questions`);
        
        // Reset counter after successfully recording streak activity
        if (result.success) {
          setSessionQuestionsAnswered(0);
          await StorageService.clearGrammarStudySessionCounter();
          console.log('[GrammarStudyScreen] Session counter reset after streak activity');
        }
      } catch (streakError) {
        console.error('[GrammarStudyScreen] Error recording streak:', streakError);
        // Don't fail the whole operation if streak recording fails
      }
    }
  };

  // Check if we should show support ad before moving to next question
  const shouldShowSupportAd = (): boolean => {
    // Premium users don't see support ads
    if (isPremium) {
      return false;
    }
    
    // Show ad after every SUPPORT_AD_INTERVAL questions (2nd, 4th, 6th, etc. when interval is 2)
    // currentQuestionIndex is 0-based, so +1 to get the question number
    const questionNumber = currentQuestionIndex + 1;
    const isIntervalReached = questionNumber % SUPPORT_AD_INTERVAL === 0;
    const hasMoreQuestions = currentQuestionIndex < allQuestions.length - 1;
    return isIntervalReached && hasMoreQuestions;
  };

  const handleNext = async () => {
    if (shouldShowSupportAd()) {
      setShowSupportAdModal(true);
      return; // Don't proceed to next question yet - will be done after ad
    }
    
    proceedToNextQuestion();
  };
  
  const proceedToNextQuestion = async () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setSelectedAnswer(null);
      setShowResult(false);
      await saveProgress();
    } else {
      // All questions completed
      Alert.alert(
        t('practice.grammar.study.congratulations'),
        t('practice.grammar.study.allCompleted'),
        [
          {
            text: t('practice.grammar.study.restart'),
            onPress: handleStartOver,
          },
          {
            text: t('common.close'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const handleTryAgain = () => {
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleSkip = async () => {
    // Check if we should show support ad before moving to next question
    if (shouldShowSupportAd()) {
      setShowSupportAdModal(true);
      return; // Don't proceed to next question yet - will be done after ad
    }
    
    proceedToNextQuestion();
  };

  const handleContinueFromProgress = () => {
    setShowProgressModal(false);
  };

  const handleStartOver = async () => {
    try {
      await StorageService.clearGrammarStudyProgress();
      setCurrentQuestionIndex(0);
      setCompletedQuestions(new Set());
      setSelectedAnswer(null);
      setShowResult(false);
      setShowProgressModal(false);
      
      logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'grammar_study' });
    } catch (error) {
      console.error('Error clearing progress:', error);
    }
  };

  const getCurrentQuestion = () => {
    return allQuestions[currentQuestionIndex];
  };

  const getRandomizedOptions = () => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion || randomizedOptions.length === 0) return [];
    return randomizedOptions;
  };

  const shuffleOptions = (options: GrammarQuestion[]) => {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f'];
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    return shuffled.map((option, index) => ({
      option,
      letter: letters[index] || 'a'
    }));
  };

  // Effect to randomize options when question changes
  useEffect(() => {
    const currentQuestion = getCurrentQuestion();
    if (currentQuestion) {
      const shuffled = shuffleOptions(currentQuestion.question.question.options);
      setRandomizedOptions(shuffled);
    }
  }, [currentQuestionIndex, allQuestions]);

  const getSelectedOption = () => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion || !selectedAnswer) return null;
    
    return currentQuestion.question.question.options.find(opt => opt.choice === selectedAnswer);
  };

  const getLanguageKey = (): keyof GrammarQuestion['explanation'] => {
    const langMap: Record<string, keyof GrammarQuestion['explanation']> = {
      'en': 'en',
      'de': 'de',
      'ar': 'ar',
      'fr': 'fr',
      'ru': 'ru',
      'es': 'es'
    };
    return langMap[i18n.language] || 'en';
  };

  const getExampleTranslation = () => {
    let translationKey = getLanguageKey();
  
    if(activeExamConfig.language === 'german') {
      // If the language is German, show the English translation, otherwise show the translation in the current language
      if (translationKey === 'de') {
        return currentQuestion.question.translations['en'];
      }
    }

    if(activeExamConfig.language === 'english') {
      // If the language is English, hide the translation
      if (translationKey === 'en') {
        return '';
      }
    }

    return currentQuestion.question.translations[translationKey];
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError || allQuestions.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {loadError || t('exam.failedToLoad')}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setIsLoading(true);
              setLoadError(null);
              // Reload by re-mounting component (navigate back and forward)
              navigation.goBack();
            }}
          >
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const selectedOption = getSelectedOption();
  const progressPercentage = ((currentQuestionIndex + 1) / allQuestions.length) * 100;

  // Show Support Ad Screen inline when triggered
  if (showSupportAdModal) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <SupportAdScreen 
          screen="grammar_study"
          onContinue={() => {
            console.log('[GrammarStudyScreen] User completed support ad screen');
            setShowSupportAdModal(false);
            // Proceed to next question after ad
            proceedToNextQuestion();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Group Name */}
        {/* <Text style={styles.groupName}>{currentQuestion.groupName}</Text> */}

        {/* Progress */}
        <View style={styles.progressContainer}>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercentage}%` }
                ]}
              />
            </View>
          </View>
          <Text style={styles.progressText}>
            {t('practice.grammar.study.progress', {
              current: currentQuestionIndex + 1,
              total: allQuestions.length
            })}
          </Text>
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>
            {currentQuestion.question.question.rendered_sentence}
          </Text>
          <Text style={styles.sentenceTranslation}>
            {getExampleTranslation()}
          </Text>
        </View>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {!showResult ? (
            // Show all options before answering
            getRandomizedOptions().map((item, index) => {
              const { option, letter } = item;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.optionButton}
                  onPress={() => handleAnswerSelect(option.choice)}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.letterCircle}>
                      <Text style={styles.letterText}>{letter}</Text>
                    </View>
                    <Text style={styles.optionText}>
                      {option.choice}
                    </Text>
                    <View style={styles.emptyCircle} />
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            // Show only selected option after answering
            selectedOption && (
              <View style={[
                styles.selectedOptionCard,
                selectedOption.is_correct ? styles.correctOptionCard : styles.wrongOptionCard
              ]}>
                <View style={styles.optionContent}>
                  <View style={styles.letterCircle}>
                    <Text style={styles.letterText}>
                      {getRandomizedOptions().find(item => item.option.choice === selectedOption.choice)?.letter || 'a'}
                    </Text>
                  </View>
                  <Text style={[
                    styles.selectedOptionText,
                    selectedOption.is_correct ? styles.correctOptionText : styles.wrongOptionText
                  ]}>
                    {selectedOption.choice}
                  </Text>
                  <View style={[
                    styles.iconCircle,
                    selectedOption.is_correct ? styles.correctIconCircle : styles.wrongIconCircle
                  ]}>
                    <Text style={styles.iconText}>
                      {selectedOption.is_correct ? '✓' : '✗'}
                    </Text>
                  </View>
                </View>
              </View>
            )
          )}
        </View>

        {/* Result and Explanation */}
        {showResult && selectedOption && (
          <View style={styles.resultContainer}>
            {/* <View style={[
              styles.resultHeader,
              selectedOption.is_correct ? styles.correctHeader : styles.wrongHeader
            ]}>
              <Text style={styles.resultText}>
                {selectedOption.is_correct 
                  ? t('practice.grammar.study.correct') 
                  : t('practice.grammar.study.incorrect')
                }
              </Text>
            </View> */}
            
            <View style={styles.explanationContainer}>
              <MarkdownText text={selectedOption.explanation[getLanguageKey()]}/>
            </View>

            <View style={styles.actionButtons}>
              {selectedOption.is_correct ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.nextButton]}
                  onPress={handleNext}
                >
                  <Text style={[styles.actionButtonText, styles.nextButtonText]}>
                    {currentQuestionIndex === allQuestions.length - 1 
                      ? t('practice.grammar.study.finish')
                      : t('practice.grammar.study.next')
                    }
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.tryAgainButton]}
                    onPress={handleTryAgain}
                  >
                    <Text style={[styles.actionButtonText, styles.tryAgainButtonText]}>
                      {t('practice.grammar.study.tryAgain')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.skipButton]}
                    onPress={handleSkip}
                  >
                    <Text style={[styles.actionButtonText, styles.skipButtonText]}>
                      {currentQuestionIndex === allQuestions.length - 1 
                        ? t('practice.grammar.study.finish')
                        : t('practice.grammar.study.skip')
                      }
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <GrammarStudyProgressModal
        visible={showProgressModal}
        currentProgress={currentQuestionIndex}
        totalQuestions={allQuestions.length}
        onContinue={handleContinueFromProgress}
        onStartOver={handleStartOver}
        onClose={() => setShowProgressModal(false)}
      />

    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.padding.lg,
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
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      ...typography.textStyles.body,
      color: colors.error[500],
    },
    groupName: {
      ...typography.textStyles.bodySmall,
      color: colors.text.secondary,
      fontStyle: 'italic',
      marginBottom: spacing.margin.sm,
      textAlign: 'center',
    },
    questionCard: {
      marginBottom: spacing.margin.lg,
    },
    questionText: {
      ...typography.textStyles.h3,
      color: colors.text.primary,
      lineHeight: 28,
      textAlign: 'left',
      direction: 'ltr',
    },
    sentenceTranslation: {
      ...typography.textStyles.h6,
      color: colors.text.secondary,
      lineHeight: 18,
      textAlign: 'left',
      marginTop: spacing.margin.sm,
    },
    optionsContainer: {
      marginBottom: spacing.margin.lg,
    },
    optionButton: {
      backgroundColor: colors.background.secondary,
      paddingHorizontal: spacing.padding.lg,
      paddingVertical: spacing.padding.md,
      borderRadius: spacing.borderRadius.lg,
      marginBottom: spacing.margin.md,
      borderWidth: 1,
      borderColor: colors.border.light,
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      direction: 'ltr',
    },
    optionContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.margin.md,
    },
    letterCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary[600],
      justifyContent: 'center',
      alignItems: 'center',
    },
    letterText: {
      ...typography.textStyles.body,
      color: colors.white,
      fontWeight: typography.fontWeight.bold,
      textTransform: 'uppercase',
    },
    emptyCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.border.light,
      backgroundColor: 'transparent',
    },
    optionText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.medium,
      flex: 1,
    },
    selectedOptionCard: {
      paddingHorizontal: spacing.padding.lg,
      paddingVertical: spacing.padding.md,
      borderRadius: spacing.borderRadius.lg,
      borderWidth: 2,
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 3,
      direction: 'ltr',
    },
    correctOptionCard: {
      backgroundColor: colors.success[50],
      borderColor: colors.success[500],
    },
    wrongOptionCard: {
      backgroundColor: colors.error[50],
      borderColor: colors.error[500],
    },
    selectedOptionText: {
      ...typography.textStyles.body,
      fontWeight: typography.fontWeight.semibold,
      flex: 1,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: spacing.margin.sm,
    },
    correctIconCircle: {
      backgroundColor: colors.success[500],
    },
    wrongIconCircle: {
      backgroundColor: colors.error[500],
    },
    iconText: {
      ...typography.textStyles.h4,
      color: colors.white,
      fontWeight: typography.fontWeight.bold,
    },
    correctOptionText: {
      color: colors.success[700],
    },
    wrongOptionText: {
      color: colors.error[700],
    },
    resultContainer: {
      marginBottom: spacing.margin.lg,
    },
    resultHeader: {
      padding: spacing.padding.md,
      borderRadius: spacing.borderRadius.md,
      marginBottom: spacing.margin.md,
      alignItems: 'center',
    },
    correctHeader: {
      backgroundColor: colors.success[100],
    },
    wrongHeader: {
      backgroundColor: colors.error[100],
    },
    resultText: {
      ...typography.textStyles.h4,
      fontWeight: typography.fontWeight.bold,
    },
    explanationContainer: {
      marginBottom: spacing.margin.lg,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: spacing.margin.md,
    },
    actionButton: {
      flex: 1,
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      borderRadius: spacing.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButtonText: {
      ...typography.textStyles.body,
      fontWeight: typography.fontWeight.semibold,
      textAlign: 'center',
    },
    tryAgainButton: {
      backgroundColor: colors.warning[500],
    },
    tryAgainButtonText: {
      color: colors.white,
    },
    skipButton: {
      backgroundColor: colors.primary[500],
    },
    skipButtonText: {
      color: colors.white,
    },
    nextButton: {
      backgroundColor: colors.success[500],
    },
    nextButtonText: {
      color: colors.white,
    },
    progressContainer: {
      marginBottom: spacing.margin.lg,
    },
    progressText: {
      ...typography.textStyles.h6,
      color: colors.text.primary,
      textAlign: 'left',
      marginTop: spacing.margin.md,
      fontWeight: typography.fontWeight.semibold,
    },
    progressBarContainer: {
      alignItems: 'center',
    },
    progressBarBackground: {
      width: '100%',
      height: 8,
      backgroundColor: colors.border.light,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.primary[500],
      borderRadius: 4,
    },
    retryButton: {
      marginTop: spacing.margin.lg,
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      backgroundColor: colors.primary[500],
      borderRadius: spacing.borderRadius.md,
      alignItems: 'center',
    },
    retryButtonText: {
      ...typography.textStyles.body,
      color: colors.white,
      fontWeight: typography.fontWeight.semibold,
    },
  });

export default GrammarStudyScreen;