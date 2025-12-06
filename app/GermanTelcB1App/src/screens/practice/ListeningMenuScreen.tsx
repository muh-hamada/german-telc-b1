import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../../theme';
import Card from '../../components/Card';
import { HomeStackNavigationProp } from '../../types/navigation.types';
import ExamSelectionModal from '../../components/ExamSelectionModal';
import dataService from '../../services/data.service';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';

const ListeningMenuScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useCustomTranslation();
  const [showPart1Modal, setShowPart1Modal] = useState(false);
  const [showPart2Modal, setShowPart2Modal] = useState(false);
  const [showPart3Modal, setShowPart3Modal] = useState(false);
  const [part1Exams, setPart1Exams] = useState<any[]>([]);
  const [part2Exams, setPart2Exams] = useState<any[]>([]);
  const [part3Exams, setPart3Exams] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [part1Data, part2Data, part3Data] = await Promise.all([
        dataService.getListeningPart1Content(),
        dataService.getListeningPart2Content(),
        dataService.getListeningPart3Content(),
      ]);

      console.log('part1Data', part1Data);

      const part1ExamsList = (part1Data.exams || []).map((exam: any) => ({
        id: exam.id,
        title: exam.title || `Test ${exam.id + 1}`
      }));
      setPart1Exams(part1ExamsList);

      const part2ExamsList = (part2Data.exams || []).map((exam: any) => ({
        id: exam.id,
        title: exam.title || `Test ${exam.id + 1}`
      }));
      setPart2Exams(part2ExamsList);

      const part3ExamsList = (part3Data.exams || []).map((exam: any) => ({
        id: exam.id,
        title: exam.title || `Test ${exam.id + 1}`
      }));
      setPart3Exams(part3ExamsList);
    };
    loadData();
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'listening' });
  }, []);

  const handlePart1Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'listening', part: 1 });
    setShowPart1Modal(true);
  };

  const handlePart2Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'listening', part: 2 });
    setShowPart2Modal(true);
  };

  const handlePart3Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'listening', part: 3 });
    setShowPart3Modal(true);
  };

  const handleSelectPart1Exam = (examId: number) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'listening', part: 1, exam_id: examId });
    navigation.navigate('ListeningPart1', { examId });
  };

  const handleSelectPart2Exam = (examId: number) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'listening', part: 2, exam_id: examId });
    navigation.navigate('ListeningPart2', { examId });
  };

  const handleSelectPart3Exam = (examId: number) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'listening', part: 3, exam_id: examId });
    navigation.navigate('ListeningPart3', { examId });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card} onPress={handlePart1Press}>
          <Text style={styles.cardTitle}>{t('practice.listening.part1')}</Text>
          <Text style={styles.cardDescription}>{t('practice.listening.part1Description')}</Text>
        </Card>
        <Card style={styles.card} onPress={handlePart2Press}>
          <Text style={styles.cardTitle}>{t('practice.listening.part2')}</Text>
          <Text style={styles.cardDescription}>{t('practice.listening.part2Description')}</Text>
        </Card>
        <Card style={styles.card} onPress={handlePart3Press}>
          <Text style={styles.cardTitle}>{t('practice.listening.part3')}</Text>
          <Text style={styles.cardDescription}>{t('practice.listening.part3Description')}</Text>
        </Card>
      </ScrollView>

      <ExamSelectionModal
        visible={showPart1Modal}
        onClose={() => setShowPart1Modal(false)}
        exams={part1Exams}
        onSelectExam={handleSelectPart1Exam}
        examType="listening"
        partNumber={1}
        title={t('practice.listening.part1')}
      />

      <ExamSelectionModal
        visible={showPart2Modal}
        onClose={() => setShowPart2Modal(false)}
        exams={part2Exams}
        onSelectExam={handleSelectPart2Exam}
        examType="listening"
        partNumber={2}
        title={t('practice.listening.part2')}
      />

      <ExamSelectionModal
        visible={showPart3Modal}
        onClose={() => setShowPart3Modal(false)}
        exams={part3Exams}
        onSelectExam={handleSelectPart3Exam}
        examType="listening"
        partNumber={3}
        title={t('practice.listening.part3')}
      />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.padding.lg,
  },
  card: {
    marginBottom: spacing.margin.lg,
    minHeight: 100,
    justifyContent: 'center',
  },
  cardTitle: {
    ...typography.textStyles.h3,
    color: colors.primary[500],
    marginBottom: spacing.margin.sm,
    textAlign: 'left',
  },
  cardDescription: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    lineHeight: 24,
    textAlign: 'left',
  },
});

export default ListeningMenuScreen;
