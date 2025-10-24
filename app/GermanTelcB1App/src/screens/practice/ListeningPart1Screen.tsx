import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { colors } from '../../theme';
import listeningPart1Data from '../../data/listening-part1.json';
import ListeningPart1UI from '../../components/exam-ui/ListeningPart1UI';
import AdBanner from '../../components/AdBanner';
import { HIDE_ADS } from '../../config/demo.config';

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

const ListeningPart1Screen: React.FC = () => {
  const sectionDetails = (listeningPart1Data as any).section_details;
  const exams = (listeningPart1Data as any).exams as Exam[];
  const currentExam = exams[0];

  const handleComplete = (score: number) => {
    console.log('Listening Part 1 completed with score:', score);
    // Note: Progress tracking for practice mode can be added here if needed
  };

  return (
    <SafeAreaView style={styles.container}>
      <ListeningPart1UI 
        exam={currentExam} 
        sectionDetails={sectionDetails}
        onComplete={handleComplete} 
      />
      {!HIDE_ADS && <AdBanner />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});

export default ListeningPart1Screen;

