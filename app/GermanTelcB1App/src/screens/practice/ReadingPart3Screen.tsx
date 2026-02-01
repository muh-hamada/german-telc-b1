import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { spacing, typography, type ThemeColors } from '../../theme';
import { dataService } from '../../services/data.service';
import { useProgress } from '../../contexts/ProgressContext';
import { useExamCompletion, useCompletion } from '../../contexts/CompletionContext';
import { useModalQueue } from '../../contexts/ModalQueueContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import ResultsModal from '../../components/ResultsModal';
import ReportIssueModal from '../../components/ReportIssueModal';
import { ReadingPart3Exam, DeleReadingPart3Exam, UserAnswer, ExamResult } from '../../types/exam.types';
import ReadingPart3UI from '../../components/exam-ui/ReadingPart3UI';
import DeleReadingPart3UI from '../../components/exam-ui/DeleReadingPart3UI';
import { HomeStackRouteProp } from '../../types/navigation.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { activeExamConfig } from '../../config/active-exam.config';

const ReadingPart3Screen: React.FC = () => {
  const { t } = useCustomTranslation();
  const route = useRoute<HomeStackRouteProp<'ReadingPart3'>>();
  const navigation = useNavigation();
  const { updateExamProgress } = useProgress();
  const { setContextualModalActive } = useModalQueue();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const examId = route.params?.examId ?? 0;
  
  const isDele = activeExamConfig.provider === 'dele';
  
  const { isCompleted, toggleCompletion } = useExamCompletion('reading-part3', examId);
  const { autoMarkCompletedIfEligible } = useCompletion();
  const { showToast } = useToast();
  
  const [currentExam, setCurrentExam] = useState<ReadingPart3Exam | DeleReadingPart3Exam | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);

  useEffect(() => {
    loadExam(examId);
  }, [examId]);

  // Set up header buttons
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setShowReportIssueModal(true)}
            style={styles.headerButton}
          >
            <Icon
              name="warning"
              size={24}
              color={colors.white}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleToggleCompletion}
            style={styles.headerButton}
          >
            <Icon
              name={isCompleted ? 'check-circle' : 'circle-o'}
              size={24}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [isCompleted, navigation]);

  const handleToggleCompletion = async () => {
    try {
      const newStatus = await toggleCompletion(examResult?.score || 0);
      logEvent(AnalyticsEvents.PRACTICE_MARK_COMPLETED_TOGGLED, { section: 'reading', part: 3, exam_id: examId, completed: newStatus });
      // Alert.alert(
      //   t('common.success'),
      //   newStatus ? t('exam.markedCompleted') : t('exam.markedIncomplete')
      // );
    } catch (error: any) {
      if (error.message === 'auth/not-logged-in') {
        Alert.alert(t('common.error'), t('exam.loginToSaveProgress'));
      } else {
        Alert.alert(t('common.error'), t('exam.completionFailed'));
      }
    }
  };

  const loadExam = async (id: number) => {
    try {
      setIsLoading(true);
      let exam;
      
      if (isDele) {
        exam = await dataService.getDeleReadingPart3ExamById(String(id));
      } else {
        exam = await dataService.getReadingPart3Exam(id);
      }
      
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

  const handleComplete = (score: number, answers: UserAnswer[]) => {
    if (!currentExam) return;

    const totalQuestions = isDele 
      ? (currentExam as DeleReadingPart3Exam).questions.length
      : (currentExam as ReadingPart3Exam).situations.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    
    const result: ExamResult = {
      examId: examId,
      score,
      maxScore: totalQuestions,
      percentage,
      correctAnswers: score,
      totalQuestions: totalQuestions,
      answers: answers,
      timestamp: Date.now(),
    };

    setExamResult(result);
    // Pause global modal queue and show results
    setContextualModalActive(true);
    setShowResults(true);

    updateExamProgress('reading-part3', examId, answers, score, totalQuestions);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('exam.loadingExam')}</Text>
        </View>
      </View>
    );
  }

  if (!currentExam) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('exam.failedToLoad')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isDele ? (
        <DeleReadingPart3UI 
          exam={currentExam as DeleReadingPart3Exam} 
          onComplete={handleComplete} 
        />
      ) : (
        <ReadingPart3UI 
          exam={currentExam as ReadingPart3Exam} 
          onComplete={handleComplete} 
        />
      )}

      <ResultsModal
        visible={showResults}
        onClose={async () => {
          setShowResults(false);
          setContextualModalActive(false);
          
          // Try auto-completion
          if (examResult?.score !== undefined && examResult?.maxScore !== undefined) {
            const wasAutoCompleted = await autoMarkCompletedIfEligible(
              'reading-part3',
              examId,
              examResult.score,
              examResult.maxScore
            );
            
            if (wasAutoCompleted) {
              showToast(t('exam.autoCompleted'), 4000);
            }
          }
        }}
        examTitle={`Reading Part 3 - Test ${examId + 1}`}
        result={examResult}
      />

      <ReportIssueModal
        visible={showReportIssueModal}
        onClose={() => setShowReportIssueModal(false)}
        examData={currentExam}
        section="reading"
        part={3}
        examId={examId}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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

export default ReadingPart3Screen;
