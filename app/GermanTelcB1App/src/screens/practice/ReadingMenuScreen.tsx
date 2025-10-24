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

const ReadingMenuScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useTranslation();
  const [showPart1Modal, setShowPart1Modal] = useState(false);
  const [showPart2Modal, setShowPart2Modal] = useState(false);
  const [showPart3Modal, setShowPart3Modal] = useState(false);

  const handlePart1Press = () => {
    setShowPart1Modal(true);
  };

  const handlePart2Press = () => {
    setShowPart2Modal(true);
  };

  const handlePart3Press = () => {
    setShowPart3Modal(true);
  };

  const handleSelectPart1Exam = (examId: number) => {
    navigation.navigate('ReadingPart1', { examId });
  };

  const handleSelectPart2Exam = (examId: number) => {
    navigation.navigate('ReadingPart2', { examId });
  };

  const handleSelectPart3Exam = (examId: number) => {
    navigation.navigate('ReadingPart3', { examId });
  };

  return (
    <SafeAreaView style={styles.container}>
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
        exams={dataService.getReadingPart1Exams()}
        onSelectExam={handleSelectPart1Exam}
        examType="reading"
        partNumber={1}
        title={t('practice.reading.part1')}
      />

      <ExamSelectionModal
        visible={showPart2Modal}
        onClose={() => setShowPart2Modal(false)}
        exams={dataService.getReadingPart2Exams()}
        onSelectExam={handleSelectPart2Exam}
        examType="reading"
        partNumber={2}
        title={t('practice.reading.part2')}
      />

      <ExamSelectionModal
        visible={showPart3Modal}
        onClose={() => setShowPart3Modal(false)}
        exams={dataService.getReadingPart3Exams()}
        onSelectExam={handleSelectPart3Exam}
        examType="reading"
        partNumber={3}
        title={t('practice.reading.part3')}
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

export default ReadingMenuScreen;
