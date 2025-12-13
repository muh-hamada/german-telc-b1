import React, { useMemo, useState, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../../theme';
import Card from '../../components/Card';
import { HomeStackNavigationProp } from '../../types/navigation.types';
import ExamSelectionModal from '../../components/ExamSelectionModal';
import { dataService } from '../../services/data.service';
import { HIDE_ADS } from '../../config/development.config';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { useAppTheme } from '../../contexts/ThemeContext';

const PracticeMenuScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useCustomTranslation();
  const [showWritingModal, setShowWritingModal] = useState(false);
  const [writingExams, setWritingExams] = useState<any[]>([]);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    const loadWritingExams = async () => {
      const exams = await dataService.getWritingExams();
      setWritingExams(exams);
    };
    loadWritingExams();
    // Section opened
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'practice_menu' });
  }, []);

  const handleReadingPress = () => {
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'reading' });
    navigation.navigate('ReadingMenu');
  };

  const handleListeningPress = () => {
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'listening' });
    navigation.navigate('ListeningMenu');
  };

  const handleWritingPress = () => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'writing', part: 1 });
    setShowWritingModal(true);
  };

  const handleSelectWritingExam = (examId: number) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'writing', part: 1, exam_id: examId });
    navigation.navigate('Writing', { examId });
  };

  const handleSpeakingPress = () => {
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'speaking' });
    navigation.navigate('SpeakingMenu');
  };

  const handleGrammarPress = () => {
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'grammar' });
    navigation.navigate('GrammarMenu');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card} onPress={handleReadingPress}>
          <Text style={styles.cardTitle}>{t('practice.reading.title')}</Text>
          <Text style={styles.cardDescription}>
            {t('practice.reading.descriptions.main')}
          </Text>
        </Card>

        <Card style={styles.card} onPress={handleListeningPress}>
          <Text style={styles.cardTitle}>{t('practice.listening.title')}</Text>
          <Text style={styles.cardDescription}>
            {t('practice.listening.comingSoon')}
          </Text>
        </Card>

        <Card style={styles.card} onPress={handleGrammarPress}>
          <Text style={styles.cardTitle}>{t('practice.grammar.title')}</Text>
          <Text style={styles.cardDescription}>
            {t('practice.grammar.descriptions.main')}
          </Text>
        </Card>

        <Card style={styles.card} onPress={handleWritingPress}>
          <Text style={styles.cardTitle}>{t('practice.writing.title')}</Text>
          <Text style={styles.cardDescription}>
            {t('practice.writing.description')}
          </Text>
        </Card>

        <Card style={styles.card} onPress={handleSpeakingPress}>
          <Text style={styles.cardTitle}>{t('practice.speaking.title')}</Text>
          <Text style={styles.cardDescription}>
            {t('practice.speaking.descriptions.main')}
          </Text>
        </Card>
      </ScrollView>
      
      <ExamSelectionModal
        visible={showWritingModal}
        onClose={() => setShowWritingModal(false)}
        exams={writingExams}
        onSelectExam={handleSelectWritingExam}
        examType="writing"
        partNumber={1}
        title={t('practice.writing.title')}
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

export default PracticeMenuScreen;
