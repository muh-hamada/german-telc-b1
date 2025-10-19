import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import listeningPart2Data from '../../data/listening-part2.json';
import ListeningPart2UI from '../exam-ui/ListeningPart2UI';

interface ListeningPart2WrapperProps {
  testId: number;
  onComplete: (score: number) => void;
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

const ListeningPart2Wrapper: React.FC<ListeningPart2WrapperProps> = ({ testId, onComplete }) => {
  const sectionDetails = (listeningPart2Data as any).section_details;
  const exams = (listeningPart2Data as any).exams as Exam[];
  const exam = exams[testId] || exams[0];

  return (
    <View style={styles.container}>
      <ListeningPart2UI 
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
});

export default ListeningPart2Wrapper;

