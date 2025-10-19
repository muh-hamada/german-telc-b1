import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { dataService } from '../../services/data.service';
import ReadingPart3UI from '../exam-ui/ReadingPart3UI';

interface ReadingPart3WrapperProps {
  testId: number;
  onComplete: (score: number) => void;
}

const ReadingPart3Wrapper: React.FC<ReadingPart3WrapperProps> = ({ testId, onComplete }) => {
  const exam = dataService.getReadingPart3Exam(testId);

  if (!exam) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <ReadingPart3UI exam={exam} onComplete={onComplete} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});

export default ReadingPart3Wrapper;

