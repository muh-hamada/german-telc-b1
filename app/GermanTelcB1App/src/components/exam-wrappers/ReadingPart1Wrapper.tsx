import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ThemeColors, typography } from '../../theme';
import { dataService } from '../../services/data.service';
import ReadingPart1UI from '../exam-ui/ReadingPart1UI';
import ReadingPart1A1UI from '../exam-ui/ReadingPart1A1UI';
import { ReadingPart1Exam, ReadingPart1A1Exam, UserAnswer } from '../../types/exam.types';
import { useAppTheme } from '../../contexts/ThemeContext';
import { activeExamConfig } from '../../config/active-exam.config';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';

interface ReadingPart1WrapperProps {
  testId: number;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const ReadingPart1Wrapper: React.FC<ReadingPart1WrapperProps> = ({ testId, onComplete }) => {
  const isA1 = activeExamConfig.level === 'A1';
  const { t } = useCustomTranslation();
  const [exam, setExam] = useState<ReadingPart1Exam | ReadingPart1A1Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  useEffect(() => {
    const loadExam = async () => {
      try {
        setIsLoading(true);
        let loadedExam;
        if (isA1) {
          loadedExam = await dataService.getReadingPart1A1ExamById(testId);
        } else {
          loadedExam = await dataService.getReadingPart1ExamById(testId);
        }
        setExam(loadedExam || null);
      } catch (error) {
        console.error('Error loading exam:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadExam();
  }, [testId, isA1]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('general.loading')}</Text>
      </View>
    );
  }

  if (!exam) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      {isA1 ? (
        <ReadingPart1A1UI exam={exam as ReadingPart1A1Exam} onComplete={onComplete} />
      ) : (
        <ReadingPart1UI exam={exam as ReadingPart1Exam} onComplete={onComplete} />
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

export default ReadingPart1Wrapper;
