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
import ListeningPart3UIA1 from '../../components/exam-ui/ListeningPart3UIA1';
import { useProgress } from '../../contexts/ProgressContext';
import { useModalQueue } from '../../contexts/ModalQueueContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { ExamResult, UserAnswer } from '../../types/exam.types';
import ResultsModal from '../../components/ResultsModal';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useExamCompletion } from '../../contexts/CompletionContext';
import Icon from 'react-native-vector-icons/FontAwesome';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { HomeStackParamList } from '../../types/navigation.types';

type ListeningPart3A1RouteProp = RouteProp<HomeStackParamList, 'ListeningPart3A1'>;

interface Option {
  is_correct: boolean;
  text: string;
}

interface Question {
  id: number;
  question: string;
  options: Option[];
}

interface Exam {
  id: number;
  title: string;
  audio_url: string;
  questions: Question[];
}

const ListeningPart3A1Screen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ListeningPart3A1RouteProp>();
  const { examId } = route.params;
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isLoading, setIsLoading] = useState(true);
  const [listeningData, setListeningData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const { updateExamProgress } = useProgress();
  const { setContextualModalActive } = useModalQueue();
  const sectionDetails = listeningData?.section_details || {};
  const exams = listeningData?.exams as Exam[] || [];
  const currentExam = exams.find(exam => exam.id === examId) || null;

  const { isCompleted, toggleCompletion } = useExamCompletion('listening', 3, examId);

  useEffect(() => {
    loadData();
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
            color={colors.white}
          />
        </TouchableOpacity>
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
      const data = await dataService.getListeningPart3Content();
      console.log('Listening Part 3 A1 data loaded:', data);
      setListeningData(data);
    } catch (err) {
      console.error('Error loading listening part 3 A1 data:', err);
      setError('Failed to load exam data');
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
          <Text style={styles.errorText}>{error || 'Failed to load exam'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentExam && (
        <ListeningPart3UIA1
          exam={currentExam}
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

export default ListeningPart3A1Screen;

