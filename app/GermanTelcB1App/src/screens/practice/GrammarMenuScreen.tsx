import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../../theme';
import Card from '../../components/Card';
import { HomeStackNavigationProp } from '../../types/navigation.types';
import ExamSelectionModal from '../../components/ExamSelectionModal';
import { dataService } from '../../services/data.service';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { useAppTheme } from '../../contexts/ThemeContext';
import { activeExamConfig } from '../../config/active-exam.config';

const GrammarMenuScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useCustomTranslation();
  const [showPart1Modal, setShowPart1Modal] = useState(false);
  const [showPart2Modal, setShowPart2Modal] = useState(false);
  const [part1Exams, setPart1Exams] = useState<any[]>([]);
  const [part2Exams, setPart2Exams] = useState<any[]>([]);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  const isDele = activeExamConfig.provider === 'dele';

  React.useEffect(() => {
    const loadExams = async () => {
      if (isDele) {
        const [p1, p2] = await Promise.all([
          dataService.getDeleGrammarPart1Exams(),
          dataService.getDeleGrammarPart2Exams()
        ]);
        setPart1Exams(p1);
        setPart2Exams(p2);
      } else {
        const [p1, p2] = await Promise.all([
          dataService.getGrammarPart1Exams(),
          dataService.getGrammarPart2Exams()
        ]);
        setPart1Exams(p1);
        setPart2Exams(p2);
      }
    };
    loadExams();
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'grammar' });
  }, [isDele]);

  const handlePart1Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'grammar', part: 1 });
    setShowPart1Modal(true);
  };

  const handlePart2Press = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'grammar', part: 2 });
    setShowPart2Modal(true);
  };

  const handleSelectPart1Exam = (examId: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'grammar', part: 1, exam_id: examId });
    navigation.navigate('GrammarPart1', { examId });
  };

  const handleSelectPart2Exam = (examId: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'grammar', part: 2, exam_id: examId });
    navigation.navigate('GrammarPart2', { examId });
  };

  const handleGrammarStudyPress = () => {
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'grammar_study' });
    navigation.navigate('GrammarStudy');
  };

  const getCardTitle = (partNumber: number) => {
    if(isDele) {
      return partNumber === 1
        ? t('practice.grammar.dele.part1')
        : t('practice.grammar.dele.part2');
    }

    return partNumber === 1
      ? t('practice.grammar.part1')
      : t('practice.grammar.part2');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card} onPress={handlePart1Press}>
          <Text style={styles.cardTitle}>{getCardTitle(1)}</Text>
          <Text style={styles.cardDescription}>{t('practice.grammar.descriptions.main')}</Text>
        </Card>

        <Card style={styles.card} onPress={handlePart2Press}>
          <Text style={styles.cardTitle}>{getCardTitle(2)}</Text>
          <Text style={styles.cardDescription}>{t('practice.grammar.descriptions.main')}</Text>
        </Card>

        <View style={styles.separatorContainer}>
          <View style={styles.separator}>
            <View style={styles.separatorTextContainer}>
              <Text style={styles.separatorText}>{t('practice.grammar.separator')}</Text>
            </View>
          </View>
        </View>

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
    separatorContainer: {
      marginBottom: spacing.margin.lg,
      position: 'relative',
    },
    separator: {
      height: 1,
      width: '100%',
      backgroundColor: colors.border.light,
    },
    separatorTextContainer: {
      position: 'absolute',
      width: '100%',
      left: 0,
      zIndex: 1000,
      top: -10,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    separatorText: {
      ...typography.textStyles.h6,
      color: colors.text.secondary,
      textTransform: 'uppercase',
      backgroundColor: colors.background.primary,
      paddingHorizontal: spacing.padding.md,
    },
  });

export default GrammarMenuScreen;

