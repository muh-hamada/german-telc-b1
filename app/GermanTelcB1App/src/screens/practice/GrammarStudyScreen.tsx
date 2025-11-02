import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
import StorageService from '../../services/storage.service';
import GrammarStudyProgressModal from '../../components/GrammarStudyProgressModal';
import AdBanner from '../../components/AdBanner';
import { HIDE_ADS } from '../../config/development.config';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import MarkdownText from '../../components/MarkdownText';

// Import the JSON data directly
const grammarQuestions = require('../../data/grammer-study-questions.json');

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
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();

  // Flatten all questions from all groups
  const [allQuestions, setAllQuestions] = useState<Array<{ question: Sentence; groupName: string; questionIndex: number }>>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [randomizedOptions, setRandomizedOptions] = useState<Array<{ option: GrammarQuestion; letter: string }>>([]);

  useEffect(() => {
    const initializeQuestions = () => {
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
      return flattened.length;
    };

    const loadProgress = async () => {
      try {
        const totalQuestions = initializeQuestions();
        const progress = await StorageService.getGrammarStudyProgress();
        
        if (progress && progress.currentQuestionIndex > 0) {
          setCurrentQuestionIndex(progress.currentQuestionIndex);
          setCompletedQuestions(progress.completedQuestions);
          setShowProgressModal(true);
        }
        
        logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { 
          section: 'grammar_study',
          total_questions: totalQuestions,
          current_progress: progress?.currentQuestionIndex || 0
        });
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, []);

  const saveProgress = async () => {
    try {
      await StorageService.saveGrammarStudyProgress(currentQuestionIndex, completedQuestions);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleAnswerSelect = (choice: string) => {
    if (showResult) return; // Prevent changing answer after showing result
    
    setSelectedAnswer(choice);
    setShowResult(true);
    
    // Mark question as completed
    const newCompleted = new Set(completedQuestions);
    newCompleted.add(currentQuestionIndex);
    setCompletedQuestions(newCompleted);
    
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, {
      section: 'grammar_study',
      question_index: currentQuestionIndex,
      selected_answer: choice,
      is_correct: allQuestions[currentQuestionIndex]?.question.question.options.find(opt => opt.choice === choice)?.is_correct || false
    });
  };

  const handleNext = async () => {
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

  if (allQuestions.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('exam.failedToLoad')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const selectedOption = getSelectedOption();
  const progressPercentage = ((currentQuestionIndex + 1) / allQuestions.length) * 100;

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
            {currentQuestion.question.translations[getLanguageKey()]}
          </Text>
        </View>

        {/* Answer Options */}
        {!showResult && (
          <View style={styles.optionsContainer}>
            {getRandomizedOptions().map((item, index) => {
              const { option, letter } = item;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.optionButton}
                  onPress={() => handleAnswerSelect(option.choice)}
                >
                  <Text style={styles.optionText}>
                    {letter}. {option.choice}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Result and Explanation */}
        {showResult && selectedOption && (
          <View style={styles.resultContainer}>
            <View style={[
              styles.resultHeader,
              selectedOption.is_correct ? styles.correctHeader : styles.wrongHeader
            ]}>
              <Text style={styles.resultText}>
                {selectedOption.is_correct 
                  ? t('practice.grammar.study.correct') 
                  : t('practice.grammar.study.incorrect')
                }
              </Text>
            </View>
            
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

      {!HIDE_ADS && <AdBanner />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    borderWidth: 2,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  optionText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  correctOption: {
    backgroundColor: colors.success[50],
    borderColor: colors.success[500],
  },
  correctOptionText: {
    color: colors.success[700],
  },
  wrongOption: {
    backgroundColor: colors.error[50],
    borderColor: colors.error[500],
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
  },
  actionButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.semibold,
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
    textAlign: I18nManager.isRTL ? 'right' : 'left',
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
});

export default GrammarStudyScreen;