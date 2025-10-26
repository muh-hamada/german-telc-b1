import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import Card from '../../components/Card';
import { HomeStackNavigationProp } from '../../types/navigation.types';
import ExamSelectionModal from '../../components/ExamSelectionModal';
import dataService from '../../services/data.service';
import AdBanner from '../../components/AdBanner';
import { HIDE_ADS } from '../../config/demo.config';

const SpeakingMenuScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useTranslation();
  const [showPart2Modal, setShowPart2Modal] = useState(false);
  const [showPart3Modal, setShowPart3Modal] = useState(false);
  const [part2Topics, setPart2Topics] = useState<any[]>([]);
  const [part3Scenarios, setPart3Scenarios] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [part2Data, part3Data] = await Promise.all([
        dataService.getSpeakingPart2Content(),
        dataService.getSpeakingPart3Content()
      ]);
      setPart2Topics(part2Data.topics || []);
      setPart3Scenarios(part3Data.scenarios || []);
    };
    loadData();
  }, []);

  const handlePart1Press = () => navigation.navigate('SpeakingPart1');
  
  const handlePart2Press = () => {
    setShowPart2Modal(true);
  };

  const handlePart3Press = () => {
    setShowPart3Modal(true);
  };

  const handleSelectPart2Topic = (topicId: number) => {
    navigation.navigate('SpeakingPart2', { topicId });
  };

  const handleSelectPart3Scenario = (scenarioId: number) => {
    navigation.navigate('SpeakingPart3', { scenarioId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card} onPress={handlePart1Press}>
          <Text style={styles.cardTitle}>{t('practice.speaking.part1')}</Text>
          <Text style={styles.cardDescription}>{t('speaking.part1.subtitle')}</Text>
        </Card>
        <Card style={styles.card} onPress={handlePart2Press}>
          <Text style={styles.cardTitle}>{t('practice.speaking.part2')}</Text>
          <Text style={styles.cardDescription}>{t('speaking.part2.subtitle')}</Text>
        </Card>
        <Card style={styles.card} onPress={handlePart3Press}>
          <Text style={styles.cardTitle}>{t('practice.speaking.part3')}</Text>
          <Text style={styles.cardDescription}>{t('speaking.part3.subtitle')}</Text>
        </Card>
      </ScrollView>

      <ExamSelectionModal
        visible={showPart2Modal}
        onClose={() => setShowPart2Modal(false)}
        exams={part2Topics}
        onSelectExam={handleSelectPart2Topic}
        examType="speaking"
        partNumber={2}
        title={t('practice.speaking.part2')}
      />

      <ExamSelectionModal
        visible={showPart3Modal}
        onClose={() => setShowPart3Modal(false)}
        exams={part3Scenarios}
        onSelectExam={handleSelectPart3Scenario}
        examType="speaking"
        partNumber={3}
        title={t('practice.speaking.part3')}
      />

      {!HIDE_ADS && <AdBanner />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1 },
  scrollContent: { padding: spacing.padding.lg },
  card: { marginBottom: spacing.margin.lg, minHeight: 100, justifyContent: 'center' },
  cardTitle: { ...typography.textStyles.h3, color: colors.primary[500], marginBottom: spacing.margin.sm },
  cardDescription: { ...typography.textStyles.body, color: colors.text.secondary, lineHeight: 24 },
});

export default SpeakingMenuScreen;
