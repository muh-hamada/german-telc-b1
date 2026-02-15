import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { ThemeColors } from '../../theme';
import dataService from '../../services/data.service';
import ListeningPart3UI from '../exam-ui/ListeningPart3UI';
import ListeningPart3UIA1 from '../exam-ui/ListeningPart3UIA1';
import ListeningPart3A2UI from '../exam-ui/ListeningPart3A2UI';
import { UserAnswer } from '../../types/exam.types';
import { useAppTheme } from '../../contexts/ThemeContext';
import { activeExamConfig } from '../../config/active-exam.config';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';

interface ListeningPart3WrapperProps {
  testId: number;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

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

const ListeningPart3Wrapper: React.FC<ListeningPart3WrapperProps> = ({ testId, onComplete }) => {
  const { t } = useCustomTranslation();
  const isA1 = activeExamConfig.level === 'A1';
  const isA2 = activeExamConfig.level === 'A2';
  const [isLoading, setIsLoading] = useState(true);
  const [listeningData, setListeningData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  useEffect(() => {
    loadData();
  }, [testId, isA1]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dataService.getListeningPart3Content();
      setListeningData(data);
    } catch (err) {
      console.error('Error loading listening part 3 data:', err);
      setError(t('general.loadingDataError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (error || !listeningData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{t('general.loadingDataError')}</Text>
      </View>
    );
  }

  const sectionDetails = listeningData.section_details;
  const exams = listeningData.exams as Exam[];
  const exam = exams.find(e => e.id === testId) || exams[0];

  return (
    <View style={styles.container}>
      {isA1 ? (
        <ListeningPart3UIA1 
          exam={exam} 
          sectionDetails={sectionDetails}
          onComplete={onComplete} 
        />
      ) : isA2 ? (
        <ListeningPart3A2UI 
          exam={exam} 
          sectionDetails={sectionDetails}
          onComplete={onComplete} 
        />
      ) : (
        <ListeningPart3UI 
          exam={exam} 
          sectionDetails={sectionDetails}
          onComplete={onComplete} 
        />
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.text.primary,
    fontSize: 16,
  },
});

export default ListeningPart3Wrapper;
