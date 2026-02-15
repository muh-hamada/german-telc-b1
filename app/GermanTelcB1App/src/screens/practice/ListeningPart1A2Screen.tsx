import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { spacing, type ThemeColors } from '../../theme';
import dataService from '../../services/data.service';
import ListeningPart1A2UI from '../../components/exam-ui/ListeningPart1A2UI';
import Icon from 'react-native-vector-icons/FontAwesome';
import { UserAnswer, ExamResult } from '../../types/exam.types';
import ResultsModal from '../../components/ResultsModal';
import ReportIssueModal from '../../components/ReportIssueModal';
import { useProgress } from '../../contexts/ProgressContext';
import { useExamCompletion, useCompletion } from '../../contexts/CompletionContext';
import { useModalQueue } from '../../contexts/ModalQueueContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { HomeStackParamList } from '../../types/navigation.types';

type ListeningPart1A2RouteProp = RouteProp<HomeStackParamList, 'ListeningPart1A2'>;

const ListeningPart1A2Screen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ListeningPart1A2RouteProp>();
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
  const exams = listeningData?.exams || [];
  const currentExam = exams.find((exam: any) => exam.id === examId) || null;

  const { isCompleted, toggleCompletion } = useExamCompletion('listening-part1', examId);
  const { autoMarkCompletedIfEligible } = useCompletion();
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [examId]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setShowReportIssueModal(true)}
            style={styles.headerButton}
          >
            <Icon name="warning" size={24} color={colors.white} />
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
      logEvent(AnalyticsEvents.PRACTICE_MARK_COMPLETED_TOGGLED, { section: 'listening', part: 1, exam_id: examId, completed: newStatus });
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
      const data = await dataService.getListeningPart1Content();
      setListeningData(data);
    } catch (err) {
      console.error('Error loading listening part 1 A2 data:', err);
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
      examId,
      score,
      maxScore: totalQuestions,
      percentage,
      correctAnswers: score,
      totalQuestions,
      answers,
      timestamp: Date.now(),
    };

    setExamResult(result);
    setContextualModalActive(true);
    setShowResults(true);
    updateExamProgress('listening-part1', examId, answers, score, totalQuestions);
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
        <ListeningPart1A2UI
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
          if (examResult?.score !== undefined && examResult?.maxScore !== undefined) {
            const wasAutoCompleted = await autoMarkCompletedIfEligible(
              'listening-part1', examId, examResult.score, examResult.maxScore
            );
            if (wasAutoCompleted) {
              showToast(t('exam.autoCompleted'), 4000);
            }
          }
        }}
        examTitle={`Listening Part 1 - ${currentExam?.title || examId}`}
        result={examResult}
      />
      <ReportIssueModal
        visible={showReportIssueModal}
        onClose={() => setShowReportIssueModal(false)}
        examData={currentExam}
        section="listening"
        part={1}
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

export default ListeningPart1A2Screen;
