import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { dataService } from '../../services/data.service';
import LanguagePart1UI from '../exam-ui/LanguagePart1UI';

interface LanguagePart1WrapperProps {
  testId: number;
  onComplete: (score: number) => void;
}

const LanguagePart1Wrapper: React.FC<LanguagePart1WrapperProps> = ({ testId, onComplete }) => {
  const exam = dataService.getGrammarPart1Exam(testId);

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
});

export default LanguagePart1Wrapper;

