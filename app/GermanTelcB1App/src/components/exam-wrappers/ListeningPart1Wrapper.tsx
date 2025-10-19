import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import listeningPart1Data from '../../data/listening-part1.json';
import ListeningPart1UI from '../exam-ui/ListeningPart1UI';

interface ListeningPart1WrapperProps {
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

const ListeningPart1Wrapper: React.FC<ListeningPart1WrapperProps> = ({ testId, onComplete }) => {
  const sectionDetails = (listeningPart1Data as any).section_details;
  const exams = (listeningPart1Data as any).exams as Exam[];
  const exam = exams[testId] || exams[0]; // Use testId or fall back to first

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
});

export default ListeningPart1Wrapper;

