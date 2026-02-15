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

const WritingMenuScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useCustomTranslation();
  const [showPart1Modal, setShowPart1Modal] = useState(false);
  const [showPart2Modal, setShowPart2Modal] = useState(false);
  const [part1Exams, setPart1Exams] = useState<any[]>([]);
  const [part2Exams, setPart2Exams] = useState<any[]>([]);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  // Check if writing has multiple parts based on exam structure
  const writingParts = activeExamConfig.examStructure.writing || [1];
  const hasPart2 = writingParts.includes(2);
  const isDele = activeExamConfig.provider === 'dele';
  const isA1 = activeExamConfig.level === 'A1';
  const isA2 = activeExamConfig.level === 'A2';

  React.useEffect(() => {
    const loadExams = async () => {
      if (isDele) {
        const [p1, p2] = await Promise.all([
          dataService.getDeleWritingPart1Exams(),
          dataService.getDeleWritingPart2Exams()
        ]);
        setPart1Exams(p1);
        setPart2Exams(p2);
      } else {
        const [p1, p2] = await Promise.all([
          dataService.getWritingPart1Exams(),
          dataService.getWritingPart2Exams()
        ]);
        setPart1Exams(p1);
        setPart2Exams(p2);
      }
    };
    loadExams();
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'writing' });
  }, [isDele]);

  const handlePart1Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'writing', part: 1 });
    setShowPart1Modal(true);
  };

  const handlePart2Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'writing', part: 2 });
    setShowPart2Modal(true);
  };

  const handleSelectPart1Exam = (examId: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'writing', part: 1, exam_id: examId });
    if(isDele) {
      navigation.navigate('Writing', { examId, part: 1 });
    } else {
      navigation.navigate('WritingPart1', { examId});
    }
  };

  const handleSelectPart2Exam = (examId: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'writing', part: 2, exam_id: examId });
    if(isDele) {
      navigation.navigate('Writing', { examId, part: 2 });
    } else {
      if(isA2) {
        // Telc A2 uses the same WritingUI component as B1/B2
        navigation.navigate('Writing', { examId, part: 2 });
      } else {
      navigation.navigate('WritingPart2', { examId});
      }
    }
  };

  const getCardTitle = (partNumber: number) => {
    if (isA1) {
      return t(`practice.writing.a1.part${partNumber}`);
    }

    if(isA2) {
      if(partNumber === 1) {
        return t(`practice.writing.a2.part1`);
      } else {
        return t(`practice.writing.a2.part2`);
      }
    }

    if(isDele) {
      return t(`practice.writing.dele.part${partNumber}`);
    }

    return t(`practice.writing.part${partNumber}`);
  }

  const getCardDescription = (partNumber: number) => {
    if (isA1) {
      return t(`practice.writing.descriptions.a1.part${partNumber}`);
    }

    if(isA2) {
      if(partNumber === 1) {
        return t(`practice.writing.descriptions.a2.part1`);
      } else {
        return t(`practice.writing.descriptions.a2.part2`);
      }
    }

    if(isDele) {
      return t(`practice.writing.descriptions.dele.part${partNumber}`);
    }

    return t(`practice.writing.descriptions.part${partNumber}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card} onPress={handlePart1Press}>
          <Text style={styles.cardTitle}>{getCardTitle(1)}</Text>
          <Text style={styles.cardDescription}>{getCardDescription(1)}</Text>
        </Card>

        {hasPart2 && (
          <Card style={styles.card} onPress={handlePart2Press}>
            <Text style={styles.cardTitle}>{getCardTitle(2)}</Text>
            <Text style={styles.cardDescription}>{getCardDescription(2)}</Text>
          </Card>
        )}
      </ScrollView>
      
      <ExamSelectionModal
        visible={showPart1Modal}
        onClose={() => setShowPart1Modal(false)}
        exams={part1Exams}
        onSelectExam={handleSelectPart1Exam}
        examType="writing"
        partNumber={1}
        title={getCardTitle(1)}
      />

      <ExamSelectionModal
        visible={showPart2Modal}
        onClose={() => setShowPart2Modal(false)}
        exams={part2Exams}
        onSelectExam={handleSelectPart2Exam}
        examType="writing"
        partNumber={2}
        title={getCardTitle(2)}
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

export default WritingMenuScreen;

