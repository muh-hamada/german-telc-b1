import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import dataService from '../../services/data.service';
import ListeningPart3UI from '../../components/exam-ui/ListeningPart3UI';
import AdBanner from '../../components/AdBanner';
import { HIDE_ADS } from '../../config/demo.config';
import { useProgress } from '../../contexts/ProgressContext';
import { ExamResult, UserAnswer } from '../../types/exam.types';
import ResultsModal from '../../components/ResultsModal';

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
  const [isLoading, setIsLoading] = useState(true);
  const [listeningData, setListeningData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const { updateExamProgress } = useProgress();
  const sectionDetails = listeningData?.section_details || {};
  const exams = listeningData?.exams as Exam[] || [];
  const currentExam = exams[0] || null;
  const examId = currentExam?.id || -1;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dataService.getListeningPart3Content();
      setListeningData(data);
    } catch (err) {
      console.error('Error loading listening part 3 data:', err);
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

    updateExamProgress('listening-part3', examId, answers, score, totalQuestions);
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
      <ListeningPart3UI 
        exam={currentExam} 
        sectionDetails={sectionDetails}
        onComplete={handleComplete} 
      />
      <ResultsModal
        visible={showResults}
        onClose={() => setShowResults(false)}
        examTitle={`Listening Part 3 - Test ${examId + 1}`}
        result={examResult}
      />
      {!HIDE_ADS && <AdBanner />}
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
});

export default ListeningPart3Screen;
