import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ThemeColors, typography } from '../../theme';
import { dataService } from '../../services/data.service';
import ReadingPart3UI from '../exam-ui/ReadingPart3UI';
import ReadingPart3A1UI from '../exam-ui/ReadingPart3A1UI';
import ReadingPart3A2UI from '../exam-ui/ReadingPart3A2UI';
import { ReadingPart3Exam, ReadingPart3A1Exam, ReadingPart3A2Exam, UserAnswer } from '../../types/exam.types';
import { useAppTheme } from '../../contexts/ThemeContext';
import { activeExamConfig } from '../../config/active-exam.config';

interface ReadingPart3WrapperProps {
  testId: number;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const ReadingPart3Wrapper: React.FC<ReadingPart3WrapperProps> = ({ testId, onComplete }) => {
  const isA1 = activeExamConfig.level === 'A1';
  const isA2 = activeExamConfig.level === 'A2';
  const [exam, setExam] = useState<ReadingPart3Exam | ReadingPart3A1Exam | ReadingPart3A2Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  useEffect(() => {
    const loadExam = async () => {
      try {
        setIsLoading(true);
        let loadedExam;
        if (isA1) {
          loadedExam = await dataService.getReadingPart3A1ExamById(testId);
        } else if (isA2) {
          loadedExam = await dataService.getReadingPart3A2ExamById(testId);
        } else {
          loadedExam = await dataService.getReadingPart3Exam(testId);
        }
        setExam(loadedExam || null);
      } catch (error) {
        console.error('Error loading exam:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadExam();
  }, [testId, isA1, isA2]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!exam) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      {isA1 ? (
        <ReadingPart3A1UI exam={exam as ReadingPart3A1Exam} onComplete={onComplete} />
      ) : isA2 ? (
        <ReadingPart3A2UI exam={exam as ReadingPart3A2Exam} onComplete={onComplete} />
      ) : (
        <ReadingPart3UI exam={exam as ReadingPart3Exam} onComplete={onComplete} />
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default ReadingPart3Wrapper;

