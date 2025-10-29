import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { colors, typography } from '../../theme';
import { dataService } from '../../services/data.service';
import LanguagePart1UI from '../exam-ui/LanguagePart1UI';
import { GrammarPart1Exam, UserAnswer } from '../../types/exam.types';

interface LanguagePart1WrapperProps {
  testId: number;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const LanguagePart1Wrapper: React.FC<LanguagePart1WrapperProps> = ({ testId, onComplete }) => {
  const [exam, setExam] = useState<GrammarPart1Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExam = async () => {
      try {
        setIsLoading(true);
        const loadedExam = await dataService.getGrammarPart1Exam(testId);
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
      <LanguagePart1UI exam={exam} onComplete={onComplete} />
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

export default LanguagePart1Wrapper;

