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
import { DeleListeningExam, DeleListeningSectionDetails, UserAnswer, ExamResult } from '../../types/exam.types';
import DeleListeningUI from '../../components/exam-ui/DeleListeningUI';
import { HomeStackRouteProp } from '../../types/navigation.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';

const DeleListeningPart2Screen: React.FC = () => {
  const { t } = useCustomTranslation();
  const route = useRoute<HomeStackRouteProp<'DeleListeningPart2'>>();
  const navigation = useNavigation();
  const { updateExamProgress } = useProgress();
  const { setContextualModalActive } = useModalQueue();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const examId = route.params?.examId ?? '1';
  const examIdNum = Number.parseInt(examId, 10) || 1;
  
  const { isCompleted, toggleCompletion } = useExamCompletion('dele-listening', 2, examIdNum);
  
  const [currentExam, setCurrentExam] = useState<DeleListeningExam | null>(null);
  const [sectionDetails, setSectionDetails] = useState<DeleListeningSectionDetails | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);

  useEffect(() => {
    loadExam(examId);
  }, [examId]);

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
      logEvent(AnalyticsEvents.PRACTICE_MARK_COMPLETED_TOGGLED, { section: 'dele-listening', part: 2, exam_id: examId, completed: newStatus });
    } catch (error: any) {
      if (error.message === 'auth/not-logged-in') {
        Alert.alert(t('common.error'), t('exam.loginToSaveProgress'));
      } else {
        Alert.alert(t('common.error'), t('exam.completionFailed'));
      }
    }
  };

  const loadExam = async (id: string) => {
    try {
      setIsLoading(true);
      const exam = await dataService.getDeleListeningPart2ExamById(id);
      if (exam) {
        setCurrentExam(exam);
        setSectionDetails({
          title: exam.title || 'DELE Listening Part 2',
          instructions_en: 'Listen to the audio and answer the questions.',
          duration_minutes: 30,
        });
        setShowResults(false);
        setExamResult(null);
      }
    } catch (error) {
      console.error('Error loading exam:', error);
      Alert.alert(t('common.error'), t('exam.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = (score: number, answers: UserAnswer[]) => {
    if (!currentExam) return;

    const totalQuestions = currentExam.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    
    const result: ExamResult = {
      examId: examIdNum,
      score,
      maxScore: totalQuestions,
      percentage,
      correctAnswers: score,
      totalQuestions: totalQuestions,
      answers: answers,
      timestamp: Date.now(),
    };

    setExamResult(result);
    setContextualModalActive(true);
    setShowResults(true);

    updateExamProgress('dele-listening-part2', examIdNum, answers, score, totalQuestions);
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

  if (!currentExam || !sectionDetails) {
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
      <DeleListeningUI 
        exam={currentExam} 
        sectionDetails={sectionDetails}
        part={2}
        onComplete={handleComplete} 
      />

      <ResultsModal
        visible={showResults}
        onClose={() => {
          setShowResults(false);
          setContextualModalActive(false);
        }}
        examTitle={`DELE Listening Part 2 - ${currentExam.title}`}
        result={examResult}
      />

      <ReportIssueModal
        visible={showReportIssueModal}
        onClose={() => setShowReportIssueModal(false)}
        examData={currentExam}
        section="dele-listening"
        part={2}
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

export default DeleListeningPart2Screen;
