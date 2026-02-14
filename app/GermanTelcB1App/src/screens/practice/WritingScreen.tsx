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
import { spacing, typography, type ThemeColors } from '../../theme';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useExamCompletion } from '../../contexts/CompletionContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { HomeStackRouteProp } from '../../types/navigation.types';
import { dataService } from '../../services/data.service';
import { WritingExam, DeleWritingExam } from '../../types/exam.types';
import WritingUI from '../../components/exam-ui/WritingUI';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { useProgress } from '../../contexts/ProgressContext';
import ReportIssueModal from '../../components/ReportIssueModal';
import { activeExamConfig } from '../../config/active-exam.config';

const WritingScreen: React.FC = () => {
  const { t } = useCustomTranslation();
  const route = useRoute<HomeStackRouteProp<'Writing'>>();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const examId = route.params?.examId ?? 0;
  const part = route.params?.part ?? 1;
  const { updateExamProgress } = useProgress();

  const isDele = activeExamConfig.provider === 'dele';
  const isA2 = activeExamConfig.level === 'A2';

  const { isCompleted, toggleCompletion } = useExamCompletion(`writing-part${part}`, examId);

  const [examResult, setExamResult] = useState<{ score: number } | null>(null);
  const [currentExam, setCurrentExam] = useState<WritingExam | DeleWritingExam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      console.log('Loading Writing Exam:', examId, 'Part:', part);
      setIsLoading(true);
      let exam;

      if (isDele) {
        console.log('Loading DELE Writing Exam:', examId, 'Part:', part);
        if (part === 1) {
          exam = await dataService.getDeleWritingPart1ExamById(String(examId));
          console.log('Loaded DELE Writing Part 1 Exam:', exam);
        } else {
          exam = await dataService.getDeleWritingPart2ExamById(String(examId));
        }
      } else if (isA2) {
        exam = await dataService.getWritingPart2Exam(examId);

        // WritingUI component expects a "incomingEmail" property
        exam.incomingEmail = exam.instruction
        console.log('Loaded A2 Writing Part 2 Exam:', exam);
      } else {
        exam = await dataService.getWritingExam(examId);
      }

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
      const newStatus = await toggleCompletion(examResult?.score || 0);
      // The alert doesn't add much value, so we'll just log the event
      logEvent(AnalyticsEvents.PRACTICE_MARK_COMPLETED_TOGGLED, {
        section: 'writing',
        part: 1,
        exam_id: examId,
        completed: newStatus,
        score: examResult?.score || 0,
        max_score: 45,
        percentage: Math.round((examResult?.score || 0 / 45) * 100),
      });
    } catch (error: any) {
      if (error.message === 'auth/not-logged-in') {
        Alert.alert(t('common.error'), t('exam.loginToSaveProgress'));
      } else {
        Alert.alert(t('common.error'), t('exam.completionFailed'));
      }
    }
  };

  const handleComplete = (score: number) => {
    const maxScore = 45;
    const percentage = Math.round((score / maxScore) * 100);

    logEvent(AnalyticsEvents.PRACTICE_EXAM_COMPLETED, {
      section: 'writing',
      part: 1,
      exam_id: examId,
      score,
      max_score: maxScore,
      percentage: percentage,
    });

    updateExamProgress(`writing-part${part}`, examId, [], score, maxScore);
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
      <WritingUI
        exam={currentExam as WritingExam}
        onComplete={handleComplete}
        part={part}
      />

      <ReportIssueModal
        visible={showReportIssueModal}
        onClose={() => setShowReportIssueModal(false)}
        examData={currentExam}
        section="writing"
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

export default WritingScreen;
