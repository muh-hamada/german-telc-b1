import React, { useMemo, useState } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../../theme';
import Card from '../../components/Card';
import { HomeStackNavigationProp } from '../../types/navigation.types';
import ExamSelectionModal from '../../components/ExamSelectionModal';
import { dataService } from '../../services/data.service';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { useAppTheme } from '../../contexts/ThemeContext';
import { activeExamConfig } from '../../config/active-exam.config';

const ReadingMenuScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useCustomTranslation();
  const [showPart1Modal, setShowPart1Modal] = useState(false);
  const [showPart2Modal, setShowPart2Modal] = useState(false);
  const [showPart3Modal, setShowPart3Modal] = useState(false);
  const [part1Exams, setPart1Exams] = useState<any[]>([]);
  const [part2Exams, setPart2Exams] = useState<any[]>([]);
  const [part3Exams, setPart3Exams] = useState<any[]>([]);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isA1 = activeExamConfig.level === 'A1';
  const isA2 = activeExamConfig.level === 'A2';
  const isDele = activeExamConfig.provider === 'dele';

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
  }, [isDele]);

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

  const handleSelectPart1Exam = (examId: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'reading', part: 1, exam_id: examId });
    // Check app level and navigate to appropriate screen
    if (isA1) {
      navigation.navigate('ReadingPart1A1', { examId });
    } else {
      navigation.navigate('ReadingPart1', { examId });
    }
  };

  const handleSelectPart2Exam = (examId: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'reading', part: 2, exam_id: examId });
    // Check app level and navigate to appropriate screen
    if (isA1) {
      navigation.navigate('ReadingPart2A1', { examId });
    } else {
      navigation.navigate('ReadingPart2', { examId });
    }
  };

  const handleSelectPart3Exam = (examId: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'reading', part: 3, exam_id: examId });
    // Check app level and navigate to appropriate screen
    if (isA1) {
      navigation.navigate('ReadingPart3A1', { examId });
    } else {
      navigation.navigate('ReadingPart3', { examId });
    }
  };

  const getCardTitle = (partNumber: number) => {
    switch (partNumber) {
      case 1:
        if(isA2) {
          return t('practice.reading.a2.part1');
        }
        return isA1 ? t('practice.reading.a1.part1') : t('practice.reading.part1');
      case 2:
        if(isA2) {
          return t('practice.reading.a2.part2');
        }
        return isA1 ? t('practice.reading.a1.part2') : t('practice.reading.part2');
      case 3:
        if(isA2) {
          return t('practice.reading.a2.part3');
        }
        return isA1
          ? t('practice.reading.a1.part3')
          : (isDele ? t('practice.reading.dele.part3') : t('practice.reading.part3'));
      default:
        return '';
    }
  }

  const getCardDescription = (partNumber: number) => {
    switch (partNumber) {
      case 1:
        if(isA2) {
          return t('practice.reading.descriptions.a2.part1')
        }
        return isA1
          ? t('practice.reading.descriptions.a1.part1')
          : t('practice.reading.descriptions.part1');
      case 2:
        if(isA2) {
          return t('practice.reading.descriptions.a2.part2')
        }
        return isA1
          ? t('practice.reading.descriptions.a1.part2')
          : t('practice.reading.descriptions.part2');
      case 3:
        if(isA2) {
          return t('practice.reading.descriptions.a2.part3')
        }
        return isA1
          ? t('practice.reading.descriptions.a1.part3')
          : (isDele ? t('practice.reading.descriptions.dele.part3') : t('practice.reading.descriptions.part3'));
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
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
      </ScrollView>

      <ExamSelectionModal
        visible={showPart1Modal}
        onClose={() => setShowPart1Modal(false)}
        exams={part1Exams}
        onSelectExam={handleSelectPart1Exam}
        examType="reading"
        partNumber={1}
        title={getCardTitle(1)}
      />

      <ExamSelectionModal
        visible={showPart2Modal}
        onClose={() => setShowPart2Modal(false)}
        exams={part2Exams}
        onSelectExam={handleSelectPart2Exam}
        examType="reading"
        partNumber={2}
        title={getCardTitle(2)}
      />

      <ExamSelectionModal
        visible={showPart3Modal}
        onClose={() => setShowPart3Modal(false)}
        exams={part3Exams}
        onSelectExam={handleSelectPart3Exam}
        examType="reading"
        partNumber={3}
        title={getCardTitle(3)}
      />

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

export default ReadingMenuScreen;
