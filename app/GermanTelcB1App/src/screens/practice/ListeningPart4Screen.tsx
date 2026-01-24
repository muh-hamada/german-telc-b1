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
import DeleListeningUI from '../../components/exam-ui/DeleListeningUI';
import { useProgress } from '../../contexts/ProgressContext';
import { useModalQueue } from '../../contexts/ModalQueueContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import ResultsModal from '../../components/ResultsModal';
import ReportIssueModal from '../../components/ReportIssueModal';
import { ExamResult, UserAnswer, DeleListeningExam } from '../../types/exam.types';
import { useExamCompletion } from '../../contexts/CompletionContext';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import Icon from 'react-native-vector-icons/FontAwesome';
import { HomeStackParamList } from '../../types/navigation.types';

type ListeningPart4RouteProp = RouteProp<HomeStackParamList, 'ListeningPart4'>;

const ListeningPart4Screen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ListeningPart4RouteProp>();
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
  const exams = listeningData?.exams as DeleListeningExam[] || [];
  const currentExam = exams.find(exam => exam.id === String(examId));
  const examIdNumber = typeof examId === 'string' ? Number.parseInt(examId, 10) : examId;

  const { isCompleted, toggleCompletion } = useExamCompletion('listening', 4, examIdNumber);

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
      logEvent(AnalyticsEvents.PRACTICE_MARK_COMPLETED_TOGGLED, { section: 'listening', part: 4, exam_id: examId, completed: newStatus });
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
      const data = await dataService.getDeleListeningPart4Content();
      setListeningData(data);
    } catch (err) {
      console.error('Error loading listening part 4 data:', err);
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
      examId: examIdNumber,
      score,
      maxScore: totalQuestions,
      percentage,
      correctAnswers: score,
      totalQuestions: totalQuestions,
      answers: answers,
      timestamp: Date.now(),
    };

    setExamResult(result);
    setShowResults(true);
    // Pause global modal queue
    setContextualModalActive(true);

    logEvent(AnalyticsEvents.PRACTICE_EXAM_COMPLETED, {
      section: 'listening',
      part: 4,
      exam_id: examIdNumber,
      score,
      max_score: totalQuestions,
      percentage: percentage,
    });

    updateExamProgress('listening', examIdNumber, answers, score, totalQuestions);
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
          <Text style={styles.errorText}>{error || t('general.loadingDataError')}</Text>
        </View>
      </View>
    );
  }

  if (!currentExam) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{t('exam.notFound')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DeleListeningUI
        exam={currentExam}
        sectionDetails={sectionDetails}
        part={4}
        onComplete={handleComplete}
      />
      <ResultsModal
        visible={showResults}
        onClose={() => {
          setShowResults(false);
          // Resume global modal queue
          setContextualModalActive(false);
        }}
        examTitle={`Listening Part 4 - Test ${examIdNumber + 1}`}
        result={examResult}
      />

      <ReportIssueModal
        visible={showReportIssueModal}
        onClose={() => setShowReportIssueModal(false)}
        examData={currentExam}
        section="listening"
        part={4}
        examId={examIdNumber}
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

export default ListeningPart4Screen;
