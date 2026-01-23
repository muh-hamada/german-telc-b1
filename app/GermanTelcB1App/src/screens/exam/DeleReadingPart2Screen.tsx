import React, {useEffect, useState} from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {DeleReadingPart2Exam} from '../../types/exam.types';
import {dataService} from '../../services/data.service';
import {DeleReadingPart2UI} from '../../components/exam-ui/DeleReadingPart2UI';
import {useProgress} from '../../hooks/useProgress';
import {ResultsModal} from '../../components/exam/ResultsModal';
import {ReportIssueModal} from '../../components/exam/ReportIssueModal';
import {theme} from '../../theme';

type DeleReadingPart2ScreenRouteProp = RouteProp<
  RootStackParamList,
  'DeleReadingPart2'
>;
type DeleReadingPart2ScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DeleReadingPart2'
>;

export const DeleReadingPart2Screen: React.FC = () => {
  const route = useRoute<DeleReadingPart2ScreenRouteProp>();
  const navigation = useNavigation<DeleReadingPart2ScreenNavigationProp>();
  const {examId} = route.params;

  const [exam, setExam] = useState<DeleReadingPart2Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [examResult, setExamResult] = useState<{
    score: number;
    totalQuestions: number;
    answers: Record<string, string>;
  } | null>(null);

  const {updateProgress} = useProgress();

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const examData = await dataService.getDeleReadingPart2ExamById(examId);
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
      examType: 'dele-reading-part-2',
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
        examType: 'dele-reading-part-2',
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
        <DeleReadingPart2UI exam={exam} onComplete={handleComplete} />
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
