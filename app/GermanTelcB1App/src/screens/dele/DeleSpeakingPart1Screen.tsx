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
import { useExamCompletion } from '../../contexts/CompletionContext';
import { useModalQueue } from '../../contexts/ModalQueueContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import ResultsModal from '../../components/ResultsModal';
import ReportIssueModal from '../../components/ReportIssueModal';
import { DeleSpeakingTopic, UserAnswer, ExamResult } from '../../types/exam.types';
import DeleSpeakingPart1UI from '../../components/exam-ui/DeleSpeakingPart1UI';
import { HomeStackRouteProp } from '../../types/navigation.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';

const DeleSpeakingPart1Screen: React.FC = () => {
  const { t } = useCustomTranslation();
  const route = useRoute<HomeStackRouteProp<'DeleSpeakingPart1'>>();
  const navigation = useNavigation();
  const { updateExamProgress } = useProgress();
  const { setContextualModalActive } = useModalQueue();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const topicId = route.params?.topicId ?? 1;
  
  const { isCompleted, toggleCompletion } = useExamCompletion('dele-speaking', 1, topicId);
  
  const [currentTopic, setCurrentTopic] = useState<DeleSpeakingTopic | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);

  useEffect(() => {
    loadTopic(topicId);
  }, [topicId]);

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
  }, [isCompleted, navigation, colors, styles]);

  const handleToggleCompletion = async () => {
    try {
      const newStatus = await toggleCompletion(examResult?.score || 0);
      logEvent(AnalyticsEvents.PRACTICE_MARK_COMPLETED_TOGGLED, { section: 'dele-speaking', part: 1, exam_id: topicId, completed: newStatus });
    } catch (error: any) {
      if (error.message === 'auth/not-logged-in') {
        Alert.alert(t('common.error'), t('exam.loginToSaveProgress'));
      } else {
        Alert.alert(t('common.error'), t('exam.completionFailed'));
      }
    }
  };

  const loadTopic = async (id: number) => {
    try {
      setIsLoading(true);
      const topic = await dataService.getDeleSpeakingTopicById(id);
      if (topic) {
        setCurrentTopic(topic);
        setShowResults(false);
        setExamResult(null);
      }
    } catch (error) {
      console.error('Error loading topic:', error);
      Alert.alert(t('common.error'), t('exam.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = (score: number, answers: UserAnswer[]) => {
    if (!currentTopic) return;

    const result: ExamResult = {
      examId: topicId,
      score,
      maxScore: 1,
      percentage: 100,
      correctAnswers: 1,
      totalQuestions: 1,
      answers: answers,
      timestamp: Date.now(),
    };

    setExamResult(result);
    setContextualModalActive(true);
    setShowResults(true);

    updateExamProgress('dele-speaking-part1', topicId, answers, score, 1);
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

  if (!currentTopic) {
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
      <DeleSpeakingPart1UI topic={currentTopic} onComplete={handleComplete} />

      <ResultsModal
        visible={showResults}
        onClose={() => {
          setShowResults(false);
          setContextualModalActive(false);
        }}
        examTitle={`DELE Speaking Part 1 - ${currentTopic.title}`}
        result={examResult}
      />

      <ReportIssueModal
        visible={showReportIssueModal}
        onClose={() => setShowReportIssueModal(false)}
        examData={currentTopic}
        section="dele-speaking"
        part={1}
        examId={topicId}
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
      color: colors.text.secondary,
    },
    headerButton: {
      marginLeft: spacing.md,
    },
  });

export default DeleSpeakingPart1Screen;
