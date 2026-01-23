import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {HomeStackRouteProp} from '../../types/navigation.types';
import {DeleReadingPart1Exam, UserAnswer, ExamResult} from '../../types/exam.types';
import {dataService} from '../../services/data.service';
import DeleReadingPart1UI from '../../components/exam-ui/DeleReadingPart1UI';
import {useProgress} from '../../contexts/ProgressContext';
import ResultsModal from '../../components/ResultsModal';
import ReportIssueModal from '../../components/ReportIssueModal';
import {spacing, typography, type ThemeColors} from '../../theme';
import {useAppTheme} from '../../contexts/ThemeContext';
import {useModalQueue} from '../../contexts/ModalQueueContext';

const DeleReadingPart1Screen: React.FC = () => {
  const route = useRoute<HomeStackRouteProp<'DeleReadingPart1'>>();
  const navigation = useNavigation();
  const {examId} = route.params;
  const {updateExamProgress} = useProgress();
  const {colors} = useAppTheme();
  const {setContextualModalActive} = useModalQueue();

  const [exam, setExam] = useState<DeleReadingPart1Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const examData = await dataService.getDeleReadingPart1ExamById(examId);
      if (examData) {
        setExam(examData);
      } else {
        Alert.alert('Error', 'Exam not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading exam:', error);
      Alert.alert('Error', 'Failed to load exam');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (
    answers: Record<string, string>,
    score: number,
    totalQuestions: number,
  ) => {
    if (!exam) return;

    setExamResult({score, totalQuestions, answers});

    // Update progress
    await updateProgress({
      examId: exam.id,
      examType: 'dele-reading-part-1',
      score,
      totalQuestions,
      completed: true,
      answers,
    });

    setShowResults(true);
  };

  const handleReportIssue = () => {
    setShowReportModal(true);
  };

  const handleSubmitReport = async (issue: string) => {
    if (!exam) return;

    try {
      await dataService.reportExamIssue({
        examId: exam.id,
        examType: 'dele-reading-part-1',
        issue,
        timestamp: new Date().toISOString(),
      });
      Alert.alert('Success', 'Thank you for your report!');
    } catch (error) {
      console.error('Error reporting issue:', error);
      Alert.alert('Error', 'Failed to submit report');
    }
  };

  const handleResultsClose = () => {
    setShowResults(false);
    navigation.goBack();
  };

  const handleRetry = async () => {
    setShowResults(false);
    setExamResult(null);
    await loadExam();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!exam) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <DeleReadingPart1UI exam={exam} onComplete={handleComplete} />
      </ScrollView>

      {examResult && (
        <ResultsModal
          visible={showResults}
          score={examResult.score}
          totalQuestions={examResult.totalQuestions}
          onClose={handleResultsClose}
          onRetry={handleRetry}
          onReportIssue={handleReportIssue}
        />
      )}

      <ReportIssueModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleSubmitReport}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
});
