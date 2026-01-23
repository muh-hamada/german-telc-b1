import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ThemeColors, typography } from '../../theme';
import { dataService } from '../../services/data.service';
import DeleListeningUI from '../exam-ui/DeleListeningUI';
import { DeleListeningExam, DeleListeningSectionDetails, UserAnswer } from '../../types/exam.types';
import { useAppTheme } from '../../contexts/ThemeContext';

interface DeleListeningPart1WrapperProps {
  testId: string;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const DeleListeningPart1Wrapper: React.FC<DeleListeningPart1WrapperProps> = ({ testId, onComplete }) => {
  const [exam, setExam] = useState<DeleListeningExam | null>(null);
  const [sectionDetails, setSectionDetails] = useState<DeleListeningSectionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  useEffect(() => {
    const loadExam = async () => {
      try {
        setIsLoading(true);
        const data = await dataService.getDeleListeningPart1Content();
        setSectionDetails(data.section_details || {
          title: 'DELE Listening Part 1',
          instructions_en: 'Listen to the audio and answer the questions.',
          duration_minutes: 30,
        });
        const exams = data.exams || [];
        const loadedExam = exams.find((e: DeleListeningExam) => e.id === testId) || exams[0];
        setExam(loadedExam || null);
      } catch (error) {
        console.error('Error loading DELE Listening Part 1 exam:', error);
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

  if (!exam || !sectionDetails) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <DeleListeningUI exam={exam} sectionDetails={sectionDetails} part={1} onComplete={onComplete} />
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

export default DeleListeningPart1Wrapper;
