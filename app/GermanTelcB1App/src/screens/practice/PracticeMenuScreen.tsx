import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { spacing, type ThemeColors, type Typography } from '../../theme';
import Card from '../../components/Card';
import { HomeStackNavigationProp } from '../../types/navigation.types';
import ExamSelectionModal from '../../components/ExamSelectionModal';
import { dataService } from '../../services/data.service';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { useAppTheme } from '../../contexts/ThemeContext';
import { activeExamConfig } from '../../config/active-exam.config';
import { ExamSectionConfig } from '../../config/exam-config.types';

const SECTION_NAV_MAP: Record<string, string> = {
  reading: 'ReadingMenu',
  listening: 'ListeningMenu',
  grammar: 'GrammarMenu',
  speaking: 'SpeakingMenu',
  writing: 'WritingMenu',
};

const PracticeMenuScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useCustomTranslation();
  const [showWritingModal, setShowWritingModal] = useState(false);
  const [writingExams, setWritingExams] = useState<any[]>([]);
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  const sections = useMemo(() => {
    if (!activeExamConfig.sections) return null;
    return activeExamConfig.sections
      .filter(s => s.enabled)
      .sort((a, b) => a.order - b.order);
  }, []);

  const writingSection = useMemo(
    () => sections?.find(s => s.id === 'writing') ?? null,
    [sections],
  );

  // Legacy fallback variables for configs without sections populated
  const isA1 = activeExamConfig.level === 'A1';
  const isA2 = activeExamConfig.level === 'A2';
  const isDele = activeExamConfig.provider === 'dele';
  const useLegacy = !sections;

  useEffect(() => {
    // Load writing exams for modal behavior (config-driven) or for B1/B2 legacy
    if (writingSection?.menuBehavior === 'modal' || (!useLegacy ? false : !isA1 && !isA2 && !isDele)) {
      const loadWritingExams = async () => {
        const exams = await dataService.getWritingExams();
        setWritingExams(exams);
      };
      loadWritingExams();
    }
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'practice_menu' });
  }, []);

  const handleSelectWritingExam = useCallback((examId: string) => {
    logEvent(AnalyticsEvents.PRACTICE_EXAM_OPENED, { section: 'writing', part: 1, exam_id: examId });
    navigation.navigate('Writing', { examId, part: 1 });
  }, [navigation]);

  const handleSectionPress = useCallback((section: ExamSectionConfig) => {
    if (section.menuBehavior === 'modal') {
      logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: section.id, part: 1 });
      setShowWritingModal(true);
      return;
    }

    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: section.id });
    navigation.navigate('SectionMenu', { sectionId: section.id });
  }, [navigation]);

  // Legacy handlers for configs without sections
  const handleLegacyWritingPress = useCallback(() => {
    if (isA1 || isA2 || isDele) {
      logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'writing' });
      navigation.navigate('WritingMenu', { sectionId: 'writing' });
    } else {
      logEvent(AnalyticsEvents.EXAM_SELECTION_OPENED, { section: 'writing', part: 1 });
      setShowWritingModal(true);
    }
  }, [navigation, isA1, isA2, isDele]);

  // Config-driven rendering
  if (sections) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {sections.map(section => (
            <Card
              key={section.id}
              style={styles.card}
              onPress={() => handleSectionPress(section)}
            >
              <Text style={styles.cardTitle}>{t(section.menuTitleKey)}</Text>
              <Text style={styles.cardDescription}>
                {t(section.menuDescriptionKey)}
              </Text>
            </Card>
          ))}
        </ScrollView>

        {writingSection?.menuBehavior === 'modal' && (
          <ExamSelectionModal
            visible={showWritingModal}
            onClose={() => setShowWritingModal(false)}
            exams={writingExams}
            onSelectExam={handleSelectWritingExam}
            examType="writing"
            partNumber={1}
            title={t('practice.writing.title')}
          />
        )}
      </View>
    );
  }

  // Legacy rendering for configs without sections populated
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card} onPress={() => { logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'reading' }); navigation.navigate('ReadingMenu', { sectionId: 'reading' }); }}>
          <Text style={styles.cardTitle}>{t('practice.reading.title')}</Text>
          <Text style={styles.cardDescription}>{t('practice.reading.descriptions.main')}</Text>
        </Card>

        <Card style={styles.card} onPress={() => { logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'listening' }); navigation.navigate('ListeningMenu', { sectionId: 'listening' }); }}>
          <Text style={styles.cardTitle}>{t('practice.listening.title')}</Text>
          <Text style={styles.cardDescription}>{t('practice.listening.comingSoon')}</Text>
        </Card>

        {!isA1 && !isA2 && (
          <Card style={styles.card} onPress={() => { logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'grammar' }); navigation.navigate('GrammarMenu', { sectionId: 'grammar' }); }}>
            <Text style={styles.cardTitle}>{t('practice.grammar.title')}</Text>
            <Text style={styles.cardDescription}>{t('practice.grammar.descriptions.main')}</Text>
          </Card>
        )}

        <Card style={styles.card} onPress={handleLegacyWritingPress}>
          <Text style={styles.cardTitle}>{t('practice.writing.title')}</Text>
          <Text style={styles.cardDescription}>{t('practice.writing.description')}</Text>
        </Card>

        <Card style={styles.card} onPress={() => { logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'speaking' }); navigation.navigate('SpeakingMenu', { sectionId: 'speaking' }); }}>
          <Text style={styles.cardTitle}>{t('practice.speaking.title')}</Text>
          <Text style={styles.cardDescription}>{t('practice.speaking.descriptions.main')}</Text>
        </Card>
      </ScrollView>

      {!isA1 && !isA2 && (
        <ExamSelectionModal
          visible={showWritingModal}
          onClose={() => setShowWritingModal(false)}
          exams={writingExams}
          onSelectExam={handleSelectWritingExam}
          examType="writing"
          partNumber={1}
          title={t('practice.writing.title')}
        />
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
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
