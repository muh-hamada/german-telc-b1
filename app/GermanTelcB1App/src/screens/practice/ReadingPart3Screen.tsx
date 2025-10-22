import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import { dataService } from '../../services/data.service';
import { useProgress } from '../../contexts/ProgressContext';
import ResultsModal from '../../components/ResultsModal';
import { ReadingPart3Exam, UserAnswer, ExamResult } from '../../types/exam.types';
import ReadingPart3UI from '../../components/exam-ui/ReadingPart3UI';
import AdBanner from '../../components/AdBanner';
import { DEMO_MODE } from '../../config/demo.config';

const ReadingPart3Screen: React.FC = () => {
  const { t } = useTranslation();
  const { updateExamProgress } = useProgress();
  
  const [currentExamId, setCurrentExamId] = useState(0);
  const [currentExam, setCurrentExam] = useState<ReadingPart3Exam | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExam(currentExamId);
  }, [currentExamId]);

  const loadExam = async (examId: number) => {
    try {
      setIsLoading(true);
      const exam = dataService.getReadingPart3Exam(examId);
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

    const percentage = Math.round((score / 25) * 100);
    
    const result: ExamResult = {
      examId: currentExamId,
      score,
      maxScore: 25,
      percentage,
      correctAnswers: score,
      totalQuestions: currentExam.situations.length,
      answers: [],
      timestamp: Date.now(),
    };

    setExamResult(result);
    setShowResults(true);

    const userAnswersArray: UserAnswer[] = currentExam.situations.map(situation => ({
      questionId: situation.id,
      answer: '',
      isCorrect: false,
      timestamp: Date.now(),
    }));

    updateExamProgress('reading-part3', currentExamId, userAnswersArray, score, 25);
  };

  const renderExamTabs = () => {
    const exams = dataService.getReadingPart3Exams();
    return (
      <View style={styles.tabsContainer}>
        <Text style={styles.tabsTitle}>{t('exam.selectExam')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {exams.map((exam) => (
            <TouchableOpacity
              key={exam.id}
              style={[
                styles.tab,
                currentExamId === exam.id && styles.activeTab,
              ]}
              onPress={() => setCurrentExamId(exam.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  currentExamId === exam.id && styles.activeTabText,
                ]}
              >
                {t('exam.test')} {exam.id + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('exam.loadingExam')}</Text>
        </View>
        {!DEMO_MODE && <AdBanner />}
      </SafeAreaView>
    );
  }

  if (!currentExam) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('exam.failedToLoad')}</Text>
        </View>
        {!DEMO_MODE && <AdBanner />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderExamTabs()}

      <ReadingPart3UI exam={currentExam} onComplete={handleComplete} />

      <ResultsModal
        visible={showResults}
        onClose={() => setShowResults(false)}
        examTitle={`Reading Part 3 - Test ${currentExamId + 1}`}
        result={examResult}
      />
      {!DEMO_MODE && <AdBanner />}
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
  header: {
    backgroundColor: colors.primary[500],
    padding: spacing.padding.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.textStyles.h2,
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.textStyles.body,
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing.margin.xs,
    opacity: 0.9,
  },
  tabsContainer: {
    padding: spacing.padding.lg,
    backgroundColor: colors.background.secondary,
  },
  tabsTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  tabsScroll: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
  },
  tab: {
    paddingHorizontal: spacing.padding.md,
    paddingVertical: spacing.padding.sm,
    marginRight: spacing.margin.sm,
    backgroundColor: colors.background.primary,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  activeTab: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  tabText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  activeTabText: {
    color: colors.white,
  },
});

export default ReadingPart3Screen;

