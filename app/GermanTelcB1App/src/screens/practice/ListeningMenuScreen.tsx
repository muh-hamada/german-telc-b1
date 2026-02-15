import React, { useMemo, useState, useEffect } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../../theme';
import Card from '../../components/Card';
import { HomeStackNavigationProp } from '../../types/navigation.types';
import ExamSelectionModal from '../../components/ExamSelectionModal';
import dataService from '../../services/data.service';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { useAppTheme } from '../../contexts/ThemeContext';
import { activeExamConfig } from '../../config/active-exam.config';

const ListeningMenuScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useCustomTranslation();
  const [showPart1Modal, setShowPart1Modal] = useState(false);
  const [showPart2Modal, setShowPart2Modal] = useState(false);
  const [showPart3Modal, setShowPart3Modal] = useState(false);
  const [showPart4Modal, setShowPart4Modal] = useState(false);
  const [showPart5Modal, setShowPart5Modal] = useState(false);
  const [part1Exams, setPart1Exams] = useState<any[]>([]);
  const [part2Exams, setPart2Exams] = useState<any[]>([]);
  const [part3Exams, setPart3Exams] = useState<any[]>([]);
  const [part4Exams, setPart4Exams] = useState<any[]>([]);
  const [part5Exams, setPart5Exams] = useState<any[]>([]);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isA1 = activeExamConfig.level === 'A1';
  const isA2 = activeExamConfig.level === 'A2';
  const isDele = activeExamConfig.provider === 'dele';

  useEffect(() => {
    const loadData = async () => {
      if (isDele) {
        const [part1Data, part2Data, part3Data, part4Data, part5Data] = await Promise.all([
          dataService.getDeleListeningPart1Content(),
          dataService.getDeleListeningPart2Content(),
          dataService.getDeleListeningPart3Content(),
          dataService.getDeleListeningPart4Content(),
          dataService.getDeleListeningPart5Content(),
        ]);

        setPart1Exams((part1Data.exams || []).map((exam: any) => ({
          id: exam.id,
          title: exam.title
        })));

        setPart2Exams((part2Data.exams || []).map((exam: any) => ({
          id: exam.id,
          title: exam.title
        })));

        setPart3Exams((part3Data.exams || []).map((exam: any) => ({
          id: exam.id,
          title: exam.title
        })));

        setPart4Exams((part4Data.exams || []).map((exam: any) => ({
          id: exam.id,
          title: exam.title
        })));

        setPart5Exams((part5Data.exams || []).map((exam: any) => ({
          id: exam.id,
          title: exam.title
        })));
      } else {
        const [part1Data, part2Data, part3Data] = await Promise.all([
          dataService.getListeningPart1Content(),
          dataService.getListeningPart2Content(),
          dataService.getListeningPart3Content(),
        ]);

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
      }
    };
    loadData();
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'listening' });
  }, [isDele]);

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

  const handleSelectPart1Exam = (examId: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'listening', part: 1, exam_id: examId });
    if (isA1) {
      navigation.navigate('ListeningPart1A1', { examId });
    } else if (isA2) {
      navigation.navigate('ListeningPart1A2', { examId });
    } else {
      navigation.navigate('ListeningPart1', { examId });
    }
  };

  const handleSelectPart2Exam = (examId: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'listening', part: 2, exam_id: examId });
    if (isA1) {
      navigation.navigate('ListeningPart2A1', { examId });
    } else if (isA2) {
      navigation.navigate('ListeningPart2A2', { examId });
    } else {
      navigation.navigate('ListeningPart2', { examId });
    }
  };

  const handleSelectPart3Exam = (examId: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'listening', part: 3, exam_id: examId });
    if (isA1) {
      navigation.navigate('ListeningPart3A1', { examId });
    } else if (isA2) {
      navigation.navigate('ListeningPart3A2', { examId });
    } else {
      navigation.navigate('ListeningPart3', { examId });
    }
  };

  const handlePart4Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'listening', part: 4 });
    setShowPart4Modal(true);
  };

  const handleSelectPart4Exam = (examId: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'listening', part: 4, exam_id: examId });
    navigation.navigate('ListeningPart4', { examId });
  };

  const handlePart5Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'listening', part: 5 });
    setShowPart5Modal(true);
  };

  const handleSelectPart5Exam = (examId: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'listening', part: 5, exam_id: examId });
    navigation.navigate('ListeningPart5', { examId });
  };

  const getCardTitle = (partNumber: number) => {
    if (isA1) {
      return t(`practice.listening.a1.part${partNumber}`);
    }
    if (isA2) {
      return t(`practice.listening.a2.part${partNumber}`);
    }
    if (isDele) {
      return t(`practice.listening.dele.part${partNumber}`);
    }
    return t(`practice.listening.part${partNumber}`);
  }

  const getCardDescription = (partNumber: number) => {
    if (isA1) {
      return t(`practice.listening.descriptions.a1.part${partNumber}`);
    }
    if (isA2) {
      return t(`practice.listening.descriptions.a2.part${partNumber}`);
    }
    if (isDele) {
      return t(`practice.listening.descriptions.dele.part${partNumber}`);
    }
    return t(`practice.listening.part${partNumber}Description`);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card} onPress={handlePart1Press}>
          <Text style={styles.cardTitle}>{getCardTitle(1)}</Text>
          <Text style={styles.cardDescription}>{getCardDescription(1)}</Text>
        </Card>
        <Card style={styles.card} onPress={handlePart2Press}>
          <Text style={styles.cardTitle}>{getCardTitle(2)}</Text>
          <Text style={styles.cardDescription}>{getCardDescription(2)}</Text>
        </Card>
        <Card style={styles.card} onPress={handlePart3Press}>
          <Text style={styles.cardTitle}>{getCardTitle(3)}</Text>
          <Text style={styles.cardDescription}>{getCardDescription(3)}</Text>
        </Card>
        
        {isDele && (
          <>
            <Card style={styles.card} onPress={handlePart4Press}>
              <Text style={styles.cardTitle}>{getCardTitle(4)}</Text>
              <Text style={styles.cardDescription}>{getCardDescription(4)}</Text>
            </Card>
            <Card style={styles.card} onPress={handlePart5Press}>
              <Text style={styles.cardTitle}>{getCardTitle(5)}</Text>
              <Text style={styles.cardDescription}>{getCardDescription(5)}</Text>
            </Card>
          </>
        )}
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

      {isDele && (
        <>
          <ExamSelectionModal
            visible={showPart4Modal}
            onClose={() => setShowPart4Modal(false)}
            exams={part4Exams}
            onSelectExam={handleSelectPart4Exam}
            examType="listening"
            partNumber={4}
            title={t('practice.listening.part4')}
          />

          <ExamSelectionModal
            visible={showPart5Modal}
            onClose={() => setShowPart5Modal(false)}
            exams={part5Exams}
            onSelectExam={handleSelectPart5Exam}
            examType="listening"
            partNumber={5}
            title={t('practice.listening.part5')}
          />
        </>
      )}

    </SafeAreaView>
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

export default ListeningMenuScreen;
