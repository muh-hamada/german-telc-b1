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
import { DeleWritingExam } from '../../types/exam.types';
import DeleWritingPart1UI from '../../components/exam-ui/DeleWritingPart1UI';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { useProgress } from '../../contexts/ProgressContext';
import ReportIssueModal from '../../components/ReportIssueModal';

const DeleWritingPart1Screen: React.FC = () => {
  const { t } = useCustomTranslation();
  const route = useRoute<HomeStackRouteProp<'DeleWritingPart1'>>();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const examId = route.params?.examId ?? '1';
  const examIdNum = Number.parseInt(examId, 10) || 1;
  const { updateExamProgress } = useProgress();
  
  const { isCompleted, toggleCompletion } = useExamCompletion('dele-writing', 1, examIdNum);
  
  const [examResult] = useState<{ score: number } | null>(null);
  const [currentExam, setCurrentExam] = useState<DeleWritingExam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      setIsLoading(true);
      const exam = await dataService.getDeleWritingPart1ExamById(examId);
      setCurrentExam(exam || null);
    } catch (error) {
      console.error('Error loading exam:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      logEvent(AnalyticsEvents.PRACTICE_MARK_COMPLETED_TOGGLED, {
        section: 'dele-writing',
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
      section: 'dele-writing',
      part: 1,
      exam_id: examId,
      score,
      max_score: maxScore,
      percentage: percentage,
    });

    updateExamProgress('dele-writing-part1', examIdNum, [], score, maxScore);
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
      <DeleWritingPart1UI exam={currentExam} onComplete={handleComplete} />
      
      <ReportIssueModal
        visible={showReportIssueModal}
        onClose={() => setShowReportIssueModal(false)}
        examData={currentExam}
        section="dele-writing"
        part={1}
        examId={examIdNum}
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
      marginLeft: spacing.md,
    },
  });

export default DeleWritingPart1Screen;
