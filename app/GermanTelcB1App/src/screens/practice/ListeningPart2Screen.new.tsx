import React from 'react';
import {
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { colors } from '../../theme';
import listeningPart2Data from '../../data/listening-part2.json';
import ListeningPart2UI from '../../components/exam-ui/ListeningPart2UI';

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

const ListeningPart2Screen: React.FC = () => {
  const sectionDetails = (listeningPart2Data as any).section_details;
  const exams = (listeningPart2Data as any).exams as Exam[];
  const currentExam = exams[0];

  const handleComplete = (score: number) => {
    console.log('Listening Part 2 completed with score:', score);
    // Note: Progress tracking for practice mode can be added here if needed
  };

  return (
    <SafeAreaView style={styles.container}>
      <ListeningPart2UI 
        exam={currentExam} 
        sectionDetails={sectionDetails}
        onComplete={handleComplete} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});

export default ListeningPart2Screen;

