import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { spacing, type ThemeColors } from '../../theme';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useExamCompletion } from '../../contexts/CompletionContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { HomeStackRouteProp } from '../../types/navigation.types';
import { dataService } from '../../services/data.service';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { useProgress } from '../../contexts/ProgressContext';
import { UserAnswer } from '../../types/exam.types';
import WritingPart2UIA1 from '../../components/exam-ui/WritingPart2UIA1';
import ReportIssueModal from '../../components/ReportIssueModal';

const WritingPart2Screen: React.FC = () => {
  const { t } = useCustomTranslation();
  const route = useRoute<HomeStackRouteProp<'WritingPart2'>>();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const examId = route.params?.examId ?? 0;
  const { updateExamProgress } = useProgress();

  const { isCompleted, toggleCompletion } = useExamCompletion('writing-part2', examId);

  const [currentExam, setCurrentExam] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      setIsLoading(true);
      const exam = await dataService.getWritingPart2Exam(examId);
      setCurrentExam(exam || null);
    } catch (error) {
      console.error('Error loading exam:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      const newStatus = await toggleCompletion(score);
      logEvent(AnalyticsEvents.PRACTICE_MARK_COMPLETED_TOGGLED, {
        section: 'writing',
        part: 2,
        exam_id: examId,
        completed: newStatus,
        score,
      });
    } catch (error: any) {
      if (error.message === 'auth/not-logged-in') {
        Alert.alert(t('common.error'), t('exam.loginToSaveProgress'));
      } else {
        Alert.alert(t('common.error'), t('exam.completionFailed'));
      }
    }
  };

  const handleComplete = (calculatedScore: number, answers: UserAnswer[]) => {
    setScore(calculatedScore);
    
    // Log completion
    logEvent(AnalyticsEvents.PRACTICE_EXAM_COMPLETED, {
      section: 'writing',
      part: 2,
      exam_id: examId,
      score: calculatedScore,
      max_score: answers.length,
    });

    // Update progress
    updateExamProgress('writing-part2', examId, answers, calculatedScore, answers.length);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('exam.loadingExam')}</Text>
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
      <WritingPart2UIA1 exam={currentExam} onComplete={handleComplete} isMockExam={false} />
      
      <ReportIssueModal
        visible={showReportIssueModal}
        onClose={() => setShowReportIssueModal(false)}
        examData={currentExam}
        section="writing"
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
    headerButton: {
      marginRight: spacing.margin.md,
      padding: spacing.padding.sm,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.padding.lg,
    },
    errorText: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
    },
  });

export default WritingPart2Screen;
