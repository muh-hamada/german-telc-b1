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
  testId: number | string;
  stepId?: string; // To determine which part (writing-part1, writing-part2 for A1; writing-1, writing-2 for DELE)
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const WritingWrapper: React.FC<WritingWrapperProps> = ({ testId, stepId, onComplete }) => {
  const isA1 = activeExamConfig.level === 'A1';
  const isA2 = activeExamConfig.level === 'A2';
  const isA1OrA2 = isA1 || isA2;
  const isDele = activeExamConfig.id === 'dele-spanish-b1';
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
        if (isDele) {
          // For DELE, determine which part based on stepId
          if (stepId === 'writing-1') {
            loadedExam = await dataService.getDeleWritingPart1ExamById(testId);
          } else if (stepId === 'writing-2') {
            loadedExam = await dataService.getDeleWritingPart2ExamById(testId);
          }
        } else if (isA1OrA2) {
          // For A1/A2, determine which part based on stepId
          if (stepId === 'writing-part1') {
            loadedExam = await dataService.getWritingPart1Exam(testId);
          } else if (stepId === 'writing-part2') {
            loadedExam = await dataService.getWritingPart2Exam(testId);
            if (isA2 && loadedExam) {
              // WritingUI expects "incomingEmail" for the instruction section
              loadedExam.incomingEmail = loadedExam.instruction;
            }
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
  }, [testId, stepId, isA1OrA2, isDele]);

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

  // For A1/A2, render the appropriate part
  if (isA1OrA2) {
    if (stepId === 'writing-part1' && exam) {
      return (
        <View style={styles.container}>
          <WritingPart1UIA1 exam={exam} onComplete={onComplete} isMockExam={true} />
        </View>
      );
    } else if (stepId === 'writing-part2' && exam) {
      // A2 Part 2 uses WritingUI (same as practice mode) since its data format
      // (instruction, writingPoints) differs from A1 (instruction_header, task_points)
      if (isA2) {
        return (
          <View style={styles.container}>
            <WritingUI exam={exam} onComplete={onComplete} isMockExam={true} part={2} />
          </View>
        );
      }
      return (
        <View style={styles.container}>
          <WritingPart2UIA1 exam={exam} onComplete={onComplete} isMockExam={true} />
        </View>
      );
    }
    // Fallback if stepId doesn't match
    return <View style={styles.container} />;
  }

  // For DELE, render with part number
  if (isDele && exam) {
    const partNumber = stepId === 'writing-1' ? 1 : stepId === 'writing-2' ? 2 : 1;
    return (
      <View style={styles.container}>
        <WritingUI exam={exam} onComplete={onComplete} isMockExam={true} part={partNumber} />
      </View>
    );
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
