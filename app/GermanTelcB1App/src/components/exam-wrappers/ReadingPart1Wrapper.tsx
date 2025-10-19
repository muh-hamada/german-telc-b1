import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { dataService } from '../../services/data.service';
import ReadingPart1UI from '../exam-ui/ReadingPart1UI';

interface ReadingPart1WrapperProps {
  testId: number;
  onComplete: (score: number) => void;
}

const ReadingPart1Wrapper: React.FC<ReadingPart1WrapperProps> = ({ testId, onComplete }) => {
  const exam = dataService.getReadingPart1ExamById(testId);

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
});

export default ReadingPart1Wrapper;
