import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { colors, typography } from '../../theme';
import { dataService } from '../../services/data.service';
import ReadingPart1UI from '../exam-ui/ReadingPart1UI';
import { ReadingPart1Exam } from '../../types/exam.types';

interface ReadingPart1WrapperProps {
  testId: number;
  onComplete: (score: number) => void;
}

const ReadingPart1Wrapper: React.FC<ReadingPart1WrapperProps> = ({ testId, onComplete }) => {
  const [exam, setExam] = useState<ReadingPart1Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExam = async () => {
      try {
        setIsLoading(true);
        const loadedExam = await dataService.getReadingPart1ExamById(testId);
        setExam(loadedExam || null);
      } catch (error) {
        console.error('Error loading exam:', error);
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
      <ReadingPart1UI exam={exam} onComplete={onComplete} />
    </View>
  );
};

const styles = StyleSheet.create({
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

export default ReadingPart1Wrapper;
