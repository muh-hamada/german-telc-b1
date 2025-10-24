import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import Card from '../../components/Card';
import { HomeStackNavigationProp } from '../../types/navigation.types';
import ExamSelectionModal from '../../components/ExamSelectionModal';
import { dataService } from '../../services/data.service';
import AdBanner from '../../components/AdBanner';
import { HIDE_ADS } from '../../config/demo.config';

const GrammarMenuScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useTranslation();
  const [showPart1Modal, setShowPart1Modal] = useState(false);
  const [showPart2Modal, setShowPart2Modal] = useState(false);

  const part1Exams = dataService.getGrammarPart1Exams();
  const part2Exams = dataService.getGrammarPart2Exams();

  const handlePart1Press = () => {
    setShowPart1Modal(true);
  };

  const handlePart2Press = () => {
    setShowPart2Modal(true);
  };

  const handleSelectPart1Exam = (examId: number) => {
    navigation.navigate('GrammarPart1', { examId });
  };

  const handleSelectPart2Exam = (examId: number) => {
    navigation.navigate('GrammarPart2', { examId });
  };

  return (
    <SafeAreaView style={styles.container}>
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

