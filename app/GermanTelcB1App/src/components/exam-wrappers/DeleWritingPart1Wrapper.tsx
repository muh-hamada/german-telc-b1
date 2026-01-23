import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ThemeColors, typography } from '../../theme';
import { dataService } from '../../services/data.service';
import DeleWritingPart1UI from '../exam-ui/DeleWritingPart1UI';
import { DeleWritingExam, UserAnswer } from '../../types/exam.types';
import { useAppTheme } from '../../contexts/ThemeContext';

interface DeleWritingPart1WrapperProps {
  testId: string;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const DeleWritingPart1Wrapper: React.FC<DeleWritingPart1WrapperProps> = ({ testId, onComplete }) => {
  const [exam, setExam] = useState<DeleWritingExam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  useEffect(() => {
    const loadExam = async () => {
      try {
        setIsLoading(true);
        const loadedExam = await dataService.getDeleWritingPart1ExamById(testId);
        setExam(loadedExam || null);
      } catch (error) {
        console.error('Error loading DELE Writing Part 1 exam:', error);
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
      <DeleWritingPart1UI exam={exam} onComplete={onComplete} isMockExam={true} />
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

export default DeleWritingPart1Wrapper;
