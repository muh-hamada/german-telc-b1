import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ThemeColors, typography } from '../../theme';
import { dataService } from '../../services/data.service';
import WritingUI from '../exam-ui/WritingUI';
import WritingPart1UIA1 from '../exam-ui/WritingPart1UIA1';
import WritingPart2UIA1 from '../exam-ui/WritingPart2UIA1';
import { UserAnswer, WritingExam } from '../../types/exam.types';
import { useAppTheme } from '../../contexts/ThemeContext';
import { activeExamConfig } from '../../config/active-exam.config';

interface WritingWrapperProps {
  testId: number;
  stepId?: string; // To determine which A1 writing part (writing-part1 or writing-part2)
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const WritingWrapper: React.FC<WritingWrapperProps> = ({ testId, stepId, onComplete }) => {
  const isA1 = activeExamConfig.level === 'A1';
  const [exam, setExam] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  useEffect(() => {
    // Reset exam data immediately when stepId or testId changes to prevent rendering with stale data
    setExam(null);
    setIsLoading(true);
    
    const loadExam = async () => {
      try {
        let loadedExam;
        if (isA1) {
          // For A1, determine which part based on stepId
          if (stepId === 'writing-part1') {
            loadedExam = await dataService.getWritingPart1Exam(testId);
          } else if (stepId === 'writing-part2') {
            loadedExam = await dataService.getWritingPart2Exam(testId);
          }
        } else {
          loadedExam = await dataService.getWritingExam(testId);
        }
        setExam(loadedExam || null);
      } catch (error) {
        console.error('Error loading exam:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadExam();
  }, [testId, stepId, isA1]);

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

  // For A1, render the appropriate part
  if (isA1) {
    if (stepId === 'writing-part1' && exam) {
      return (
        <View style={styles.container}>
          <WritingPart1UIA1 exam={exam} onComplete={onComplete} />
        </View>
      );
    } else if (stepId === 'writing-part2' && exam) {
      return (
        <View style={styles.container}>
          <WritingPart2UIA1 exam={exam} onComplete={onComplete} isMockExam={true} />
        </View>
      );
    }
    // Fallback if stepId doesn't match
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <WritingUI exam={exam} onComplete={onComplete} isMockExam={true} />
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

export default WritingWrapper;
