import React, { useMemo, useState, useEffect } from 'react';
import { Text, StyleSheet, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../../theme';
import Card from '../../components/Card';
import { HomeStackNavigationProp } from '../../types/navigation.types';
import ExamSelectionModal from '../../components/ExamSelectionModal';
import dataService from '../../services/data.service';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { activeExamConfig } from '../../config/active-exam.config';
import { useAppTheme } from '../../contexts/ThemeContext';
import CardsListSeperator from '../../components/CardsListSeperator';

const SpeakingMenuScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useCustomTranslation();
  const [showPart1Modal, setShowPart1Modal] = useState(false);
  const [showPart2Modal, setShowPart2Modal] = useState(false);
  const [showPart3Modal, setShowPart3Modal] = useState(false);
  const [showPart4Modal, setShowPart4Modal] = useState(false);
  const [showImportantPhrasesModal, setShowImportantPhrasesModal] = useState(false);
  const [showB2Part1Modal, setShowB2Part1Modal] = useState(false);
  const [showB2Part2Modal, setShowB2Part2Modal] = useState(false);
  const [showB2Part3Modal, setShowB2Part3Modal] = useState(false);
  const [part1Data, setPart1Data] = useState<any[]>([]);
  const [part2Data, setPart2Data] = useState<any[]>([]);
  const [part3Data, setPart3Data] = useState<any[]>([]);
  const [part4Data, setPart4Data] = useState<any[]>([]);
  const [importantPhrasesData, setImportantPhrasesData] = useState<any[]>([]);
  const [b2Part1Topics, setB2Part1Topics] = useState<any[]>([]);
  const [b2Part2Topics, setB2Part2Topics] = useState<any[]>([]);
  const [b2Part3Questions, setB2Part3Questions] = useState<any[]>([]);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isB2 = activeExamConfig.level === 'B2';
  const isB1 = activeExamConfig.level === 'B1';
  const isA1 = activeExamConfig.level === 'A1';
  const isDele = activeExamConfig.provider === 'dele';
  const isTelc = activeExamConfig.provider === 'telc';

  useEffect(() => {
    const loadData = async () => {

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
      } else if (isA1) {
        // A1 level doesn't need to load data since parts don't have multiple exams
        // Data is loaded directly in each screen
      } else if (isDele) {
        // Load DELE B1 data
        // Note: Part 1 is not loaded here as it uses direct navigation without exam selection
        const [part1Data, part2Data, part3Data, part4Data, importantPhrasesData] = await Promise.all([
          dataService.getDeleSpeakingPart1Content(),
          dataService.getDeleSpeakingPart2Content(),
          dataService.getDeleSpeakingPart3Content(),
          dataService.getDeleSpeakingPart4Content(),
          dataService.getSpeakingImportantPhrases()
        ]);

        setPart1Data((part1Data.topics || []).map((t: any, index: number) => ({
          id: "id-" + index,
          title: t.title
        })));

        setPart2Data((part2Data.topics || []).map((t: any, index: number) => ({
          id: "id-" + index,
          title: t.title
        })));
        setPart3Data((part3Data.topics || []).map((t: any, index: number) => ({
          id: "id-" + index,
          title: t.title
        })));
        setPart4Data((part4Data.topics || []).map((t: any, index: number) => ({
          id: "id-" + index,
          title: t.title
        })));
        setImportantPhrasesData((importantPhrasesData.groups || []).map((g: any, index: number) => ({
          id: "id-" + index, // Don't change as we use this format to get the index later
          title: g.name
        })));
      } else {
        // Load Telc B1 data
        const [part2Data, part3Data, part4Data] = await Promise.all([
          dataService.getSpeakingPart2Content(),
          dataService.getSpeakingPart3Content(),
          dataService.getSpeakingImportantPhrases().catch(() => ({ groups: [] }))
        ]);
        setPart2Data(part2Data.topics || []);
        setPart3Data(part3Data.scenarios || []);
        const groups = (part4Data.groups || []).map((g: any, index: number) => ({ id: index, title: g.name }));
        setPart4Data(groups);
      }
    };
    loadData();
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'speaking' });
  }, []);

  const handlePart1Press = () => {
    if (isDele) {
      logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'speaking', part: 1 });
      setShowPart1Modal(true);
    } else {
      navigation.navigate('SpeakingPart1');
    }
  };

  const handlePart2Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'speaking', part: 2 });
    setShowPart2Modal(true);
  };

  const handlePart3Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'speaking', part: 3 });
    setShowPart3Modal(true);
  };

  const handlePart4Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'speaking', part: 4 });
    setShowPart4Modal(true);
  };
  
  const handleImportantPhrasesPress = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'speaking', part: 4 });
    setShowImportantPhrasesModal(true);
  };

  const handleSelectDeleTopic = (part: number, topicId: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'speaking', part, exam_id: topicId });
    navigation.navigate('DeleSpeakingAllParts', { part, topicId });
  };

  const handleSelectPart2Topic = (topicId: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'speaking', part: 2, exam_id: topicId });
    navigation.navigate('SpeakingPart2', { topicId });
  };

  const handleSelectPart3Scenario = (scenarioId: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'speaking', part: 3, exam_id: scenarioId });
    navigation.navigate('SpeakingPart3', { scenarioId });
  };

  const handleSelectPart4Group = (groupIndex: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'speaking', part: 4, exam_id: groupIndex });
    navigation.navigate('SpeakingPart4', { groupIndex });
  };

  const selectImportantPhrasesGroup = (groupIndex: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'speaking', part: 4, exam_id: groupIndex });
    const index = Number.parseInt(groupIndex.replace('id-', ''), 10);
    navigation.navigate('SpeakingImportantPhrases', { groupIndex: index });
  };

  const handleB2StructurePress = () => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'speaking', part: 'b2-structure' });
    navigation.navigate('B2SpeakingStructure');
  };

  const handleB2Part1Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'speaking', part: 'b2-part1' });
    setShowB2Part1Modal(true);
  };

  const handleSelectB2Part1Topic = (topicId: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'speaking', part: 'b2-part1', exam_id: topicId });
    navigation.navigate('B2SpeakingPart1', { topicId });
  };

  const handleB2Part2Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'speaking', part: 'b2-part2' });
    setShowB2Part2Modal(true);
  };

  const handleSelectB2Part2Topic = (topicId: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'speaking', part: 'b2-part2', exam_id: topicId });
    navigation.navigate('B2SpeakingPart2', { topicId });
  };

  const handleB2Part3Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'speaking', part: 'b2-part3' });
    setShowB2Part3Modal(true);
  };

  const handleSelectB2Part3Question = (questionId: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'speaking', part: 'b2-part3', exam_id: questionId });
    navigation.navigate('B2SpeakingPart3', { questionId });
  };

  const handleA1Part1Press = () => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'speaking', part: 'a1-part1' });
    navigation.navigate('A1SpeakingPart1');
  };

  const handleA1Part2Press = () => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'speaking', part: 'a1-part2' });
    navigation.navigate('A1SpeakingPart2');
  };

  const handleA1Part3Press = () => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'speaking', part: 'a1-part3' });
    navigation.navigate('A1SpeakingPart3');
  };

  const renderModals = () => {
    if (isDele) {
      return (
        <>
          <ExamSelectionModal
            visible={showPart1Modal}
            onClose={() => setShowPart1Modal(false)}
            exams={part1Data}
            onSelectExam={(topicId) => handleSelectDeleTopic(1, topicId)}
            examType="speaking"
            partNumber={1}
            title={t('practice.speaking.dele.part1')}
          />
          <ExamSelectionModal
            visible={showPart2Modal}
            onClose={() => setShowPart2Modal(false)}
            exams={part2Data}
            onSelectExam={(topicId) => handleSelectDeleTopic(2, topicId)}
            examType="speaking"
            partNumber={2}
            title={t('practice.speaking.dele.part2')}
          />
          <ExamSelectionModal
            visible={showPart3Modal}
            onClose={() => setShowPart3Modal(false)}
            exams={part3Data}
            onSelectExam={(topicId) => handleSelectDeleTopic(3, topicId)}
            examType="speaking"
            partNumber={3}
            title={t('practice.speaking.dele.part3')}
          />
          <ExamSelectionModal
            visible={showPart4Modal}
            onClose={() => setShowPart4Modal(false)}
            exams={part4Data}
            onSelectExam={(topicId) => handleSelectDeleTopic(4, topicId)}
            examType="speaking"
            partNumber={4}
            title={t('practice.speaking.dele.part4')}
          />

          <ExamSelectionModal
            visible={showImportantPhrasesModal}
            onClose={() => setShowImportantPhrasesModal(false)}
            exams={importantPhrasesData}
            onSelectExam={selectImportantPhrasesGroup}
            examType="speaking"
            partNumber={4}
            title={t('practice.speaking.dele.importantPhrases')}
            itemType={t('speaking.part4.itemType')}
          />
        </>
      );
    }

    return (
      <>
        <ExamSelectionModal
          visible={showPart2Modal}
          onClose={() => setShowPart2Modal(false)}
          exams={part2Data}
          onSelectExam={handleSelectPart2Topic}
          examType="speaking"
          partNumber={2}
          title={t('practice.speaking.part2')}
        />

        <ExamSelectionModal
          visible={showPart3Modal}
          onClose={() => setShowPart3Modal(false)}
          exams={part3Data}
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

        <ExamSelectionModal
          visible={showPart4Modal}
          onClose={() => setShowPart4Modal(false)}
          exams={part4Data}
          onSelectExam={handleSelectPart4Group}
          examType="speaking"
          partNumber={4}
          title={t('practice.speaking.part4')}
          itemType={t('speaking.part4.itemType')}
        />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {isA1 && isTelc && (
          <>
            <Card style={styles.card} onPress={handleA1Part1Press}>
              <Text style={styles.cardTitle}>{t('practice.speaking.part1')}</Text>
              <Text style={styles.cardDescription}>{t('speaking.a1Part1.menuDescription')}</Text>
            </Card>
            <Card style={styles.card} onPress={handleA1Part2Press}>
              <Text style={styles.cardTitle}>{t('practice.speaking.a1Part2')}</Text>
              <Text style={styles.cardDescription}>{t('speaking.a1Part2.menuDescription')}</Text>
            </Card>
            <Card style={styles.card} onPress={handleA1Part3Press}>
              <Text style={styles.cardTitle}>{t('practice.speaking.a1Part3')}</Text>
              <Text style={styles.cardDescription}>{t('speaking.a1Part3.menuDescription')}</Text>
            </Card>
          </>
        )}

        {isB2 && isTelc && (
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

        {isB1 && isTelc && (
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

            <CardsListSeperator title={t('practice.speaking.separator')} />

            <Card style={styles.card} onPress={handlePart4Press}>
              <Text style={styles.cardTitle}>{t('practice.speaking.part4')}</Text>
              <Text style={styles.cardDescription}>{t('speaking.part4.subtitle')}</Text>
            </Card>
          </>
        )}

        {isB1 && isDele && (
          <>
            <Card style={styles.card} onPress={handlePart1Press}>
              <Text style={styles.cardTitle}>{t('practice.speaking.dele.part1')}</Text>
              <Text style={styles.cardDescription}>{t('speaking.part1.dele.subtitle')}</Text>
            </Card>
            <Card style={styles.card} onPress={handlePart2Press}>
              <Text style={styles.cardTitle}>{t('practice.speaking.dele.part2')}</Text>
              <Text style={styles.cardDescription}>{t('speaking.part2.dele.subtitle')}</Text>
            </Card>
            <Card style={styles.card} onPress={handlePart3Press}>
              <Text style={styles.cardTitle}>{t('practice.speaking.dele.part3')}</Text>
              <Text style={styles.cardDescription}>{t('speaking.part3.dele.subtitle')}</Text>
            </Card>
            <Card style={styles.card} onPress={handlePart4Press}>
              <Text style={styles.cardTitle}>{t('practice.speaking.dele.part4')}</Text>
              <Text style={styles.cardDescription}>{t('speaking.part4.dele.subtitle')}</Text>
            </Card>

            <CardsListSeperator title={t('practice.speaking.separator')} />

            <Card style={styles.card} onPress={handleImportantPhrasesPress}>
              <Text style={styles.cardTitle}>{t('practice.speaking.dele.importantPhrases')}</Text>
              <Text style={styles.cardDescription}>{t('speaking.importantPhrases.dele.subtitle')}</Text>
            </Card>
          </>
        )}
      </ScrollView>

      {renderModals()}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      backgroundColor: colors.background.secondary,
    },
    cardTitle: {
      ...typography.textStyles.h3,
      color: colors.text.primary,
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

export default SpeakingMenuScreen;
