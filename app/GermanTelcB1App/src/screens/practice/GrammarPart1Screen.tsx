import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, typography } from '../../theme';
import { dataService } from '../../services/data.service';
import { useProgress } from '../../contexts/ProgressContext';
import { useExamCompletion } from '../../contexts/CompletionContext';
import ResultsModal from '../../components/ResultsModal';
import { GrammarPart1Exam, UserAnswer, ExamResult } from '../../types/exam.types';
import LanguagePart1UI from '../../components/exam-ui/LanguagePart1UI';
import AdBanner from '../../components/AdBanner';
import { HIDE_ADS } from '../../config/demo.config';
import { HomeStackRouteProp } from '../../types/navigation.types';

const GrammarPart1Screen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<HomeStackRouteProp<'GrammarPart1'>>();
  const navigation = useNavigation();
  const { updateExamProgress } = useProgress();
  const examId = route.params?.examId ?? 0;
  
  const { isCompleted, toggleCompletion } = useExamCompletion('grammar', 1, examId);
  
  const [currentExam, setCurrentExam] = useState<GrammarPart1Exam | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExam(examId);
  }, [examId]);

  // Set up header button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleToggleCompletion}
          style={styles.headerButton}
        >
          <Icon
            name={isCompleted ? 'check-circle' : 'circle-o'}
            size={24}
            color={isCompleted ? colors.success[500] : colors.white}
          />
        </TouchableOpacity>
      ),
    });
  }, [isCompleted, navigation]);

  const handleToggleCompletion = async () => {
    try {
      const newStatus = await toggleCompletion(examResult?.score || 0);
      Alert.alert(
        t('common.success'),
        newStatus ? t('exam.markedCompleted') : t('exam.markedIncomplete')
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('exam.completionFailed'));
    }
  };

  const loadExam = async (id: number) => {
    try {
      setIsLoading(true);
      const exam = await dataService.getGrammarPart1Exam(id);
      if (exam) {
        setCurrentExam(exam);
        setShowResults(false);
        setExamResult(null);
      }
    } catch (error) {
      console.error('Error loading exam:', error);
      Alert.alert(t('common.error'), t('exam.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = (score: number) => {
    if (!currentExam) return;

    const percentage = Math.round((score / 15) * 100);
    
    const result: ExamResult = {
      examId: examId,
      score,
      maxScore: 15,
      percentage,
      correctAnswers: score,
      totalQuestions: currentExam.questions.length,
      answers: [],
      timestamp: Date.now(),
    };

    setExamResult(result);
    setShowResults(true);

    const userAnswersArray: UserAnswer[] = currentExam.questions.map(question => ({
      questionId: question.id,
      answer: '',
      isCorrect: false,
      timestamp: Date.now(),
    }));

    updateExamProgress('grammar-part1', examId, userAnswersArray, score, 15);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('exam.loadingExam')}</Text>
        </View>
        {!HIDE_ADS && <AdBanner />}
      </SafeAreaView>
    );
  }

  if (!currentExam) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('exam.failedToLoad')}</Text>
        </View>
        {!HIDE_ADS && <AdBanner />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LanguagePart1UI exam={currentExam} onComplete={handleComplete} />

      <ResultsModal
        visible={showResults}
        onClose={() => setShowResults(false)}
        examTitle={`Grammar Part 1 - Test ${examId + 1}`}
        result={examResult}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
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
  headerButton: {
    marginRight: spacing.margin.md,
    padding: spacing.padding.xs,
  },
});

export default GrammarPart1Screen;

