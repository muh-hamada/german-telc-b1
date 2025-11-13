import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../../theme';
import Card from '../../components/Card';
import { HomeStackNavigationProp } from '../../types/navigation.types';
import ExamSelectionModal from '../../components/ExamSelectionModal';
import { dataService } from '../../services/data.service';
import { HIDE_ADS } from '../../config/development.config';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';

const ReadingMenuScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useCustomTranslation();
  const [showPart1Modal, setShowPart1Modal] = useState(false);
  const [showPart2Modal, setShowPart2Modal] = useState(false);
  const [showPart3Modal, setShowPart3Modal] = useState(false);
  const [part1Exams, setPart1Exams] = useState<any[]>([]);
  const [part2Exams, setPart2Exams] = useState<any[]>([]);
  const [part3Exams, setPart3Exams] = useState<any[]>([]);

  React.useEffect(() => {
    const loadExams = async () => {
      const [p1, p2, p3] = await Promise.all([
        dataService.getReadingPart1Exams(),
        dataService.getReadingPart2Exams(),
        dataService.getReadingPart3Exams()
      ]);
      setPart1Exams(p1);
      setPart2Exams(p2);
      setPart3Exams(p3);
    };
    loadExams();
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'reading' });
  }, []);

  const handlePart1Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'reading', part: 1 });
    setShowPart1Modal(true);
  };

  const handlePart2Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'reading', part: 2 });
    setShowPart2Modal(true);
  };

  const handlePart3Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'reading', part: 3 });
    setShowPart3Modal(true);
  };

  const handleSelectPart1Exam = (examId: number) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'reading', part: 1, exam_id: examId });
    navigation.navigate('ReadingPart1', { examId });
  };

  const handleSelectPart2Exam = (examId: number) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'reading', part: 2, exam_id: examId });
    navigation.navigate('ReadingPart2', { examId });
  };

  const handleSelectPart3Exam = (examId: number) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'reading', part: 3, exam_id: examId });
    navigation.navigate('ReadingPart3', { examId });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card} onPress={handlePart1Press}>
          <Text style={styles.cardTitle}>{t('practice.reading.part1')}</Text>
          <Text style={styles.cardDescription}>
            {t('practice.reading.descriptions.part1')}
          </Text>
        </Card>

        <Card style={styles.card} onPress={handlePart2Press}>
          <Text style={styles.cardTitle}>{t('practice.reading.part2')}</Text>
          <Text style={styles.cardDescription}>
            {t('practice.reading.descriptions.part2')}
          </Text>
        </Card>

        <Card style={styles.card} onPress={handlePart3Press}>
          <Text style={styles.cardTitle}>{t('practice.reading.part3')}</Text>
          <Text style={styles.cardDescription}>
            {t('practice.reading.descriptions.part3')}
          </Text>
        </Card>
      </ScrollView>
      
      <ExamSelectionModal
        visible={showPart1Modal}
        onClose={() => setShowPart1Modal(false)}
        exams={part1Exams}
        onSelectExam={handleSelectPart1Exam}
        examType="reading"
        partNumber={1}
        title={t('practice.reading.part1')}
      />

      <ExamSelectionModal
        visible={showPart2Modal}
        onClose={() => setShowPart2Modal(false)}
        exams={part2Exams}
        onSelectExam={handleSelectPart2Exam}
        examType="reading"
        partNumber={2}
        title={t('practice.reading.part2')}
      />

      <ExamSelectionModal
        visible={showPart3Modal}
        onClose={() => setShowPart3Modal(false)}
        exams={part3Exams}
        onSelectExam={handleSelectPart3Exam}
        examType="reading"
        partNumber={3}
        title={t('practice.reading.part3')}
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
  },
  cardDescription: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
});

export default ReadingMenuScreen;
