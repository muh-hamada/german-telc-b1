import React from 'react';
import {
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { colors } from '../../theme';
import listeningPart3Data from '../../data/listening-part3.json';
import ListeningPart3UI from '../../components/exam-ui/ListeningPart3UI';
import AdBanner from '../../components/AdBanner';
import { DEMO_MODE } from '../../config/demo.config';

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

const ListeningPart3Screen: React.FC = () => {
  const sectionDetails = (listeningPart3Data as any).section_details;
  const exams = (listeningPart3Data as any).exams as Exam[];
  const currentExam = exams[0];

  const handleComplete = (score: number) => {
    console.log('Listening Part 3 completed with score:', score);
    // Note: Progress tracking for practice mode can be added here if needed
  };

  return (
    <SafeAreaView style={styles.container}>
      <ListeningPart3UI 
        exam={currentExam} 
        sectionDetails={sectionDetails}
        onComplete={handleComplete} 
      />
      {!DEMO_MODE && <AdBanner />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});

export default ListeningPart3Screen;

