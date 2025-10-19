import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { dataService } from '../../services/data.service';
import ReadingPart2UI from '../exam-ui/ReadingPart2UI';

interface ReadingPart2WrapperProps {
  testId: number;
  onComplete: (score: number) => void;
}

const ReadingPart2Wrapper: React.FC<ReadingPart2WrapperProps> = ({ testId, onComplete }) => {
  const exam = dataService.getReadingPart2Exam(testId);

  if (!exam) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <ReadingPart2UI exam={exam} onComplete={onComplete} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});

export default ReadingPart2Wrapper;

