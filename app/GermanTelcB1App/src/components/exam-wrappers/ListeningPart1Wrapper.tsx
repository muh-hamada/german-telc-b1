import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { colors } from '../../theme';
import dataService from '../../services/data.service';
import ListeningPart1UI from '../exam-ui/ListeningPart1UI';
import { UserAnswer } from '../../types/exam.types';

interface ListeningPart1WrapperProps {
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

const ListeningPart1Wrapper: React.FC<ListeningPart1WrapperProps> = ({ testId, onComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [listeningData, setListeningData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [testId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dataService.getListeningPart1Content();
      setListeningData(data);
    } catch (err) {
      console.error('Error loading listening part 1 data:', err);
      setError('Failed to load exam data');
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
        <Text style={styles.errorText}>{error || 'Failed to load exam'}</Text>
      </View>
    );
  }

  const sectionDetails = listeningData.section_details;
  const exams = listeningData.exams as Exam[];
  const exam = exams.find(e => e.id === testId) || exams[0];

  return (
    <View style={styles.container}>
      <ListeningPart1UI 
        exam={exam} 
        sectionDetails={sectionDetails}
        onComplete={onComplete} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
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

export default ListeningPart1Wrapper;
