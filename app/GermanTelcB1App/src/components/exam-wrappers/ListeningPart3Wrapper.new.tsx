import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import listeningPart3Data from '../../data/listening-part3.json';
import ListeningPart3UI from '../exam-ui/ListeningPart3UI';

interface ListeningPart3WrapperProps {
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

const ListeningPart3Wrapper: React.FC<ListeningPart3WrapperProps> = ({ testId, onComplete }) => {
  const sectionDetails = (listeningPart3Data as any).section_details;
  const exams = (listeningPart3Data as any).exams as Exam[];
  const exam = exams[testId] || exams[0];

  return (
    <View style={styles.container}>
      <ListeningPart3UI 
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

export default ListeningPart3Wrapper;

