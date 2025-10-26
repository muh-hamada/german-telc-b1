import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { colors, typography } from '../../theme';
import { dataService } from '../../services/data.service';
import WritingUI from '../exam-ui/WritingUI';
import { WritingExam } from '../../types/exam.types';

interface WritingWrapperProps {
  testId: number;
  onComplete: (score: number) => void;
}

const WritingWrapper: React.FC<WritingWrapperProps> = ({ testId, onComplete }) => {
  const [exam, setExam] = useState<WritingExam | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExam = async () => {
      try {
        setIsLoading(true);
        const loadedExam = await dataService.getWritingExam(testId);
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
      <WritingUI exam={exam} onComplete={onComplete} isMockExam={true} />
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

export default WritingWrapper;
