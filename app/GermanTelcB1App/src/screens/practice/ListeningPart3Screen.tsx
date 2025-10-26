import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  ActivityIndicator,
  Text,
} from 'react-native';
import { colors } from '../../theme';
import dataService from '../../services/data.service';
import ListeningPart3UI from '../../components/exam-ui/ListeningPart3UI';
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

const ListeningPart3Screen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [listeningData, setListeningData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dataService.getListeningPart3Content();
      setListeningData(data);
    } catch (err) {
      console.error('Error loading listening part 3 data:', err);
      setError('Failed to load exam data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = (score: number) => {
    console.log('Listening Part 3 completed with score:', score);
    // Note: Progress tracking for practice mode can be added here if needed
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !listeningData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error || 'Failed to load exam'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sectionDetails = listeningData.section_details;
  const exams = listeningData.exams as Exam[];
  const currentExam = exams[0];

  return (
    <SafeAreaView style={styles.container}>
      <ListeningPart3UI 
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.text.primary,
    fontSize: 16,
  },
});

export default ListeningPart3Screen;
