import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../theme';
import dataService from '../../services/data.service';
import ListeningPart2UI from '../../components/exam-ui/ListeningPart2UI';
import { HIDE_ADS } from '../../config/development.config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProgress } from '../../contexts/ProgressContext';
import ResultsModal from '../../components/ResultsModal';
import { ExamResult, UserAnswer } from '../../types/exam.types';
import { useExamCompletion } from '../../contexts/CompletionContext';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import Icon from 'react-native-vector-icons/FontAwesome';
import { HomeStackParamList } from '../../types/navigation.types';

type ListeningPart2RouteProp = RouteProp<HomeStackParamList, 'ListeningPart2'>;

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

const ListeningPart2Screen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ListeningPart2RouteProp>();
  const { examId } = route.params;
  const { t } = useCustomTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [listeningData, setListeningData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const { updateExamProgress } = useProgress();
  const sectionDetails = listeningData?.section_details || {};
  const exams = listeningData?.exams as Exam[] || [];
  const currentExam = exams.find(exam => exam.id === examId) || null;

  const { isCompleted, toggleCompletion } = useExamCompletion('listening', 2, examId);

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
            color={isCompleted ? colors.success[500] : colors.white}
          />
        </TouchableOpacity>
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
      setListeningData(data);
    } catch (err) {
      console.error('Error loading listening part 2 data:', err);
      setError('Failed to load exam data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = (score: number, answers: UserAnswer[]) => {
    if (!currentExam) return;

    const totalQuestions = currentExam.statements.length;
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
    setShowResults(true);

    updateExamProgress('listening-part2', examId, answers, score, totalQuestions);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !listeningData) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error || 'Failed to load exam'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ListeningPart2UI
        exam={currentExam}
        sectionDetails={sectionDetails}
        onComplete={handleComplete}
      />
      <ResultsModal
        visible={showResults}
        onClose={() => setShowResults(false)}
        examTitle={`Listening Part 2 - Test ${examId + 1}`}
        result={examResult}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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

export default ListeningPart2Screen;
