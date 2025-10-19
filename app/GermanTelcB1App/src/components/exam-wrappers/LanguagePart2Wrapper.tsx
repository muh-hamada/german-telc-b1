import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { dataService } from '../../services/data.service';
import LanguagePart2UI from '../exam-ui/LanguagePart2UI';

interface LanguagePart2WrapperProps {
  testId: number;
  onComplete: (score: number) => void;
}

const LanguagePart2Wrapper: React.FC<LanguagePart2WrapperProps> = ({ testId, onComplete }) => {
  const exam = dataService.getGrammarPart2Exam(testId);

  if (!exam) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <LanguagePart2UI exam={exam} onComplete={onComplete} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});

export default LanguagePart2Wrapper;

