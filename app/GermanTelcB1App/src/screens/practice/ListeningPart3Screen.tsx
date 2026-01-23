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
import ListeningPart3UI from '../../components/exam-ui/ListeningPart3UI';
import DeleListeningUI from '../../components/exam-ui/DeleListeningUI';
import { useProgress } from '../../contexts/ProgressContext';
import { useModalQueue } from '../../contexts/ModalQueueContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { ExamResult, UserAnswer, DeleListeningExam } from '../../types/exam.types';
import ResultsModal from '../../components/ResultsModal';
import ReportIssueModal from '../../components/ReportIssueModal';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useExamCompletion } from '../../contexts/CompletionContext';
import Icon from 'react-native-vector-icons/FontAwesome';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { HomeStackParamList } from '../../types/navigation.types';
import { activeExamConfig } from '../../config/active-exam.config';

type ListeningPart3RouteProp = RouteProp<HomeStackParamList, 'ListeningPart3'>;

interface Statement {
  id: number;
  statement: string;
  is_correct: boolean;
}

interface Exam {
  id: number;
  audio_url: string;
  statements: Statement[];
}

const ListeningPart3Screen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ListeningPart3RouteProp>();
  const { examId } = route.params;
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  const isDele = activeExamConfig.provider === 'dele';
  
  const [isLoading, setIsLoading] = useState(true);
  const [listeningData, setListeningData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);
  const { updateExamProgress } = useProgress();
  const { setContextualModalActive } = useModalQueue();
  const sectionDetails = listeningData?.section_details || {};
  const exams = listeningData?.exams as Exam[] | DeleListeningExam[] || [];
  const currentExam = isDele 
    ? (exams as DeleListeningExam[]).find(exam => exam.id === String(examId))
    : (exams as Exam[]).find(exam => exam.id === examId);

  const { isCompleted, toggleCompletion } = useExamCompletion('listening', 3, examId);

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
      logEvent(AnalyticsEvents.PRACTICE_MARK_COMPLETED_TOGGLED, { section: 'listening', part: 3, exam_id: examId, completed: newStatus });
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
      const data = isDele 
        ? await dataService.getDeleListeningPart3Content()
        : await dataService.getListeningPart3Content();
      setListeningData(data);
    } catch (err) {
      console.error('Error loading listening part 3 data:', err);
      setError(t('general.loadingDataError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = (score: number, answers: UserAnswer[]) => {
    if (!currentExam) return;

    const totalQuestions = isDele
      ? (currentExam as DeleListeningExam).questions.length
      : (currentExam as Exam).statements.length;
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

    updateExamProgress('listening-part3', examId, answers, score, totalQuestions);
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
      {isDele ? (
        <DeleListeningUI
          exam={currentExam as DeleListeningExam}
          sectionDetails={sectionDetails}
          part={3}
          onComplete={handleComplete}
        />
      ) : (
        <ListeningPart3UI
          exam={currentExam as Exam}
          sectionDetails={sectionDetails}
          onComplete={handleComplete}
        />
      )}
      <ResultsModal
        visible={showResults}
        onClose={() => {
          setShowResults(false);
          // Resume global modal queue
          setContextualModalActive(false);
        }}
        examTitle={`Listening Part 3 - Test ${examId + 1}`}
        result={examResult}
      />
      
      <ReportIssueModal
        visible={showReportIssueModal}
        onClose={() => setShowReportIssueModal(false)}
        examData={currentExam}
        section="listening"
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

export default ListeningPart3Screen;
