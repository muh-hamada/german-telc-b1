import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ThemeColors, typography } from '../../theme';
import { dataService } from '../../services/data.service';
import DeleReadingPart1UI from '../exam-ui/DeleReadingPart1UI';
import { DeleReadingPart1Exam, UserAnswer } from '../../types/exam.types';
import { useAppTheme } from '../../contexts/ThemeContext';

interface DeleReadingPart1WrapperProps {
  testId: string;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const DeleReadingPart1Wrapper: React.FC<DeleReadingPart1WrapperProps> = ({ testId, onComplete }) => {
  const [exam, setExam] = useState<DeleReadingPart1Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  useEffect(() => {
    const loadExam = async () => {
      try {
        setIsLoading(true);
        const loadedExam = await dataService.getDeleReadingPart1ExamById(testId);
        setExam(loadedExam || null);
      } catch (error) {
        console.error('Error loading DELE Reading Part 1 exam:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadExam();
  }, [testId]);

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
      <DeleReadingPart1UI exam={exam} onComplete={onComplete} />
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

export default DeleReadingPart1Wrapper;
