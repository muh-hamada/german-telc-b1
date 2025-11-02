import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import Card from '../../components/Card';
import { HomeStackNavigationProp } from '../../types/navigation.types';
import ExamSelectionModal from '../../components/ExamSelectionModal';
import { dataService } from '../../services/data.service';
import AdBanner from '../../components/AdBanner';
import { HIDE_ADS } from '../../config/development.config';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';

const GrammarMenuScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useTranslation();
  const [showPart1Modal, setShowPart1Modal] = useState(false);
  const [showPart2Modal, setShowPart2Modal] = useState(false);
  const [part1Exams, setPart1Exams] = useState<any[]>([]);
  const [part2Exams, setPart2Exams] = useState<any[]>([]);

  React.useEffect(() => {
    const loadExams = async () => {
      const [p1, p2] = await Promise.all([
        dataService.getGrammarPart1Exams(),
        dataService.getGrammarPart2Exams()
      ]);
      setPart1Exams(p1);
      setPart2Exams(p2);
    };
    loadExams();
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'grammar' });
  }, []);

  const handlePart1Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'grammar', part: 1 });
    setShowPart1Modal(true);
  };

  const handlePart2Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'grammar', part: 2 });
    setShowPart2Modal(true);
  };

  const handleSelectPart1Exam = (examId: number) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'grammar', part: 1, exam_id: examId });
    navigation.navigate('GrammarPart1', { examId });
  };

  const handleSelectPart2Exam = (examId: number) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'grammar', part: 2, exam_id: examId });
    navigation.navigate('GrammarPart2', { examId });
  };

  const handleGrammarStudyPress = () => {
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'grammar_study' });
    navigation.navigate('GrammarStudy');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card} onPress={handlePart1Press}>
          <Text style={styles.cardTitle}>{t('practice.grammar.part1')}</Text>
          <Text style={styles.cardDescription}>
            {t('practice.grammar.descriptions.main')}
          </Text>
        </Card>

        <Card style={styles.card} onPress={handlePart2Press}>
          <Text style={styles.cardTitle}>{t('practice.grammar.part2')}</Text>
          <Text style={styles.cardDescription}>
            {t('practice.grammar.descriptions.main')}
          </Text>
        </Card>

        <Card style={styles.card} onPress={handleGrammarStudyPress}>
          <Text style={styles.cardTitle}>{t('practice.grammar.study.title')}</Text>
          <Text style={styles.cardDescription}>
            {t('practice.grammar.study.description')}
          </Text>
        </Card>
      </ScrollView>
      
      <ExamSelectionModal
        visible={showPart1Modal}
        onClose={() => setShowPart1Modal(false)}
        exams={part1Exams}
        onSelectExam={handleSelectPart1Exam}
        examType="grammar"
        partNumber={1}
        title={t('practice.grammar.part1')}
      />

      <ExamSelectionModal
        visible={showPart2Modal}
        onClose={() => setShowPart2Modal(false)}
        exams={part2Exams}
        onSelectExam={handleSelectPart2Exam}
        examType="grammar"
        partNumber={2}
        title={t('practice.grammar.part2')}
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

export default GrammarMenuScreen;

