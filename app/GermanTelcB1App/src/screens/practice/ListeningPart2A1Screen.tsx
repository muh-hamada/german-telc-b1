import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { spacing, type ThemeColors } from '../../theme';
import dataService from '../../services/data.service';
import ListeningPart2UIA1 from '../../components/exam-ui/ListeningPart2UIA1';
import { useProgress } from '../../contexts/ProgressContext';
import { useModalQueue } from '../../contexts/ModalQueueContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import ResultsModal from '../../components/ResultsModal';
import ReportIssueModal from '../../components/ReportIssueModal';
import { ExamResult, UserAnswer } from '../../types/exam.types';
import { useExamCompletion, useCompletion } from '../../contexts/CompletionContext';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import Icon from 'react-native-vector-icons/FontAwesome';
import { HomeStackParamList } from '../../types/navigation.types';

type ListeningPart2A1RouteProp = RouteProp<HomeStackParamList, 'ListeningPart2A1'>;

interface Question {
  id: number;
  question: string;
  is_correct: boolean;
}

interface Exam {
  id: number;
  title: string;
  audio_url: string;
  questions: Question[];
}

const ListeningPart2A1Screen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ListeningPart2A1RouteProp>();
  const { examId } = route.params;
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isLoading, setIsLoading] = useState(true);
  const [listeningData, setListeningData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);
  const { updateExamProgress } = useProgress();
  const { setContextualModalActive } = useModalQueue();
  const sectionDetails = listeningData?.section_details || {};
  const exams = listeningData?.exams as Exam[] || [];
  const currentExam = exams.find(exam => exam.id === examId) || null;

  const { isCompleted, toggleCompletion } = useExamCompletion('listening-part2', examId);
  const { autoMarkCompletedIfEligible } = useCompletion();
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
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
  }, [isCompleted, navigation, examId]);

  const handleToggleCompletion = async () => {
    try {
      const newStatus = await toggleCompletion(examResult?.score || 0);
      logEvent(AnalyticsEvents.PRACTICE_MARK_COMPLETED_TOGGLED, { section: 'listening', part: 2, exam_id: examId, completed: newStatus });
    } catch (error: any) {
      if (error.message === 'auth/not-logged-in') {
        Alert.alert(t('common.error'), t('exam.loginToSaveProgress'));
      } else {
        Alert.alert(t('common.error'), t('exam.completionFailed'));
      }
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dataService.getListeningPart2Content();
      console.log('Listening Part 2 A1 data loaded:', data);
      setListeningData(data);
    } catch (err) {
      console.error('Error loading listening part 2 A1 data:', err);
      setError(t('general.loadingDataError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = (score: number, answers: UserAnswer[]) => {
    if (!currentExam) return;

    const totalQuestions = currentExam.questions.length;
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

    updateExamProgress('listening-part2', examId, answers, score, totalQuestions);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </View>
    );
  }

  if (error || !listeningData) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{t('general.loadingDataError')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentExam && (
        <ListeningPart2UIA1
          exam={currentExam}
          sectionDetails={sectionDetails}
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
              'listening-part2',
              examId,
              examResult.score,
              examResult.maxScore
            );
            
            if (wasAutoCompleted) {
              showToast(t('exam.autoCompleted'), 4000);
            }
          }
        }}
        examTitle={`Listening Part 2 - Test ${examId + 1}`}
        result={examResult}
      />
      
      <ReportIssueModal
        visible={showReportIssueModal}
        onClose={() => setShowReportIssueModal(false)}
        examData={currentExam}
        section="listening"
        part={2}
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
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      color: colors.text.primary,
      fontSize: 16,
    },
    headerButton: {
      marginRight: spacing.margin.md,
      padding: spacing.padding.xs,
    },
  });

export default ListeningPart2A1Screen;

