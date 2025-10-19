import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import writingData from '../../data/writing.json';
import WritingUI from '../exam-ui/WritingUI';

interface WritingWrapperProps {
  testId: number;
  onComplete: (score: number) => void;
}

interface WritingExam {
  id: number;
  title: string;
  incomingEmail: string;
  writingPoints: string[];
}

const WritingWrapper: React.FC<WritingWrapperProps> = ({ testId, onComplete }) => {
  const exams = (writingData as any).exams as WritingExam[];
  const exam = exams.find(e => e.id === testId) || exams[0];

  if (!exam) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <WritingUI exam={exam} onComplete={onComplete} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});

export default WritingWrapper;

