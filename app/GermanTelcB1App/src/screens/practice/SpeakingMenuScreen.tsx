import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../../theme';
import Card from '../../components/Card';
import { HomeStackNavigationProp } from '../../types/navigation.types';
import ExamSelectionModal from '../../components/ExamSelectionModal';
import dataService from '../../services/data.service';
import { HIDE_ADS } from '../../config/development.config';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { activeExamConfig } from '../../config/active-exam.config';

const SpeakingMenuScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useCustomTranslation();
  const [showPart2Modal, setShowPart2Modal] = useState(false);
  const [showPart3Modal, setShowPart3Modal] = useState(false);
  const [showPart4Modal, setShowPart4Modal] = useState(false);
  const [showB2Part1Modal, setShowB2Part1Modal] = useState(false);
  const [showB2Part2Modal, setShowB2Part2Modal] = useState(false);
  const [showB2Part3Modal, setShowB2Part3Modal] = useState(false);
  const [part2Topics, setPart2Topics] = useState<any[]>([]);
  const [part3Scenarios, setPart3Scenarios] = useState<any[]>([]);
  const [part4Groups, setPart4Groups] = useState<any[]>([]);
  const [b2Part1Topics, setB2Part1Topics] = useState<any[]>([]);
  const [b2Part2Topics, setB2Part2Topics] = useState<any[]>([]);
  const [b2Part3Questions, setB2Part3Questions] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const isB2 = activeExamConfig.level === 'B2';
      
      if (isB2) {
        // Load B2 data
        const [b2Part1Data, b2Part2Data, b2Part3Data] = await Promise.all([
          dataService.getSpeakingB2Part1Content(),
          dataService.getSpeakingB2Part2Content(),
          dataService.getSpeakingB2Part3Content(),
        ]);
        
        const part1Topics = (b2Part1Data.topics || []).map((t: any, index: number) => ({ 
          id: index, 
          title: t.title 
        }));
        setB2Part1Topics(part1Topics);
        
        const part2Topics = (b2Part2Data.questions || []).map((q: any, index: number) => ({ 
          id: index, 
          title: q.title 
        }));
        setB2Part2Topics(part2Topics);
        
        const part3Questions = (b2Part3Data.questions || []).map((q: any, index: number) => ({ 
          id: index, 
          title: q.title 
        }));
        setB2Part3Questions(part3Questions);
      } else {
        // Load B1 data
        const [part2Data, part3Data, part4Data] = await Promise.all([
          dataService.getSpeakingPart2Content(),
          dataService.getSpeakingPart3Content(),
          dataService.getSpeakingImportantPhrases().catch(() => ({ groups: [] }))
        ]);
        setPart2Topics(part2Data.topics || []);
        setPart3Scenarios(part3Data.scenarios || []);
        const groups = (part4Data.groups || []).map((g: any, index: number) => ({ id: index, title: g.name }));
        setPart4Groups(groups);
      }
    };
    loadData();
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'speaking' });
  }, []);

  const handlePart1Press = () => navigation.navigate('SpeakingPart1');
  
  const handlePart2Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'speaking', part: 2 });
    setShowPart2Modal(true);
  };

  const handlePart3Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'speaking', part: 3 });
    setShowPart3Modal(true);
  };

  const handleSelectPart2Topic = (topicId: number) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'speaking', part: 2, exam_id: topicId });
    navigation.navigate('SpeakingPart2', { topicId });
  };

  const handleSelectPart3Scenario = (scenarioId: number) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'speaking', part: 3, exam_id: scenarioId });
    navigation.navigate('SpeakingPart3', { scenarioId });
  };

  const handlePart4Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'speaking', part: 4 });
    setShowPart4Modal(true);
  };

  const handleSelectPart4Group = (groupIndex: number) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'speaking', part: 4, exam_id: groupIndex });
    navigation.navigate('SpeakingPart4', { groupIndex });
  };

  const handleB2StructurePress = () => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'speaking', part: 'b2-structure' });
    navigation.navigate('B2SpeakingStructure');
  };

  const handleB2Part1Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'speaking', part: 'b2-part1' });
    setShowB2Part1Modal(true);
  };

  const handleSelectB2Part1Topic = (topicId: number) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'speaking', part: 'b2-part1', exam_id: topicId });
    navigation.navigate('B2SpeakingPart1', { topicId });
  };

  const handleB2Part2Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'speaking', part: 'b2-part2' });
    setShowB2Part2Modal(true);
  };

  const handleSelectB2Part2Topic = (topicId: number) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'speaking', part: 'b2-part2', exam_id: topicId });
    navigation.navigate('B2SpeakingPart2', { topicId });
  };

  const handleB2Part3Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'speaking', part: 'b2-part3' });
    setShowB2Part3Modal(true);
  };

  const handleSelectB2Part3Question = (questionId: number) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'speaking', part: 'b2-part3', exam_id: questionId });
    navigation.navigate('B2SpeakingPart3', { questionId });
  };

  const isB1 = activeExamConfig.level === 'B1';
  const isB2 = activeExamConfig.level === 'B2';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {isB2 && (
          <>
            <Card style={styles.card} onPress={handleB2StructurePress}>
              <Text style={styles.cardTitle}>{t('speaking.b2Structure.menuTitle')}</Text>
              <Text style={styles.cardDescription}>{t('speaking.b2Structure.menuDescription')}</Text>
            </Card>
            <Card style={styles.card} onPress={handleB2Part1Press}>
              <Text style={styles.cardTitle}>{t('speaking.b2Part1.menuTitle')}</Text>
              <Text style={styles.cardDescription}>{t('speaking.b2Part1.menuDescription')}</Text>
            </Card>
            <Card style={styles.card} onPress={handleB2Part2Press}>
              <Text style={styles.cardTitle}>{t('speaking.b2Part2.menuTitle')}</Text>
              <Text style={styles.cardDescription}>{t('speaking.b2Part2.menuDescription')}</Text>
            </Card>
            <Card style={styles.card} onPress={handleB2Part3Press}>
              <Text style={styles.cardTitle}>{t('speaking.b2Part3.menuTitle')}</Text>
              <Text style={styles.cardDescription}>{t('speaking.b2Part3.menuDescription')}</Text>
            </Card>
          </>
        )}
        
        {isB1 && (
          <>
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
            <Card style={styles.card} onPress={handlePart4Press}>
              <Text style={styles.cardTitle}>{t('practice.speaking.part4')}</Text>
              <Text style={styles.cardDescription}>{t('speaking.part4.subtitle')}</Text>
            </Card>
          </>
        )}
      <ExamSelectionModal
        visible={showPart4Modal}
        onClose={() => setShowPart4Modal(false)}
        exams={part4Groups}
        onSelectExam={handleSelectPart4Group}
        examType="speaking"
        partNumber={4}
        title={t('practice.speaking.part4')}
        itemType={t('speaking.part4.itemType')}
      />
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

      <ExamSelectionModal
        visible={showB2Part1Modal}
        onClose={() => setShowB2Part1Modal(false)}
        exams={b2Part1Topics}
        onSelectExam={handleSelectB2Part1Topic}
        examType="speaking"
        partNumber={1}
        title={t('speaking.b2Part1.title')}
      />

      <ExamSelectionModal
        visible={showB2Part2Modal}
        onClose={() => setShowB2Part2Modal(false)}
        exams={b2Part2Topics}
        onSelectExam={handleSelectB2Part2Topic}
        examType="speaking"
        partNumber={2}
        title={t('speaking.b2Part2.title')}
      />

      <ExamSelectionModal
        visible={showB2Part3Modal}
        onClose={() => setShowB2Part3Modal(false)}
        exams={b2Part3Questions}
        onSelectExam={handleSelectB2Part3Question}
        examType="speaking"
        partNumber={3}
        title={t('speaking.b2Part3.title')}
      />

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
