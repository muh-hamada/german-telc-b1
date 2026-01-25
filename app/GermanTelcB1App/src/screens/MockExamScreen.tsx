import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { useNavigation } from '@react-navigation/native';
import { spacing, typography, type ThemeColors } from '../theme';
import { MOCK_EXAM_STEPS, MOCK_EXAM_STEPS_A1, MOCK_EXAM_STEPS_DELE_B1 } from '../types/mock-exam.types';
import {
  loadMockExamProgress,
  clearMockExamProgress,
  createInitialMockExamProgress,
  saveMockExamProgress,
} from '../services/mock-exam.service';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import { useAppTheme } from '../contexts/ThemeContext';
import { activeExamConfig } from '../config/active-exam.config';

const MockExamScreen: React.FC = () => {
  const { t } = useCustomTranslation();
  const navigation = useNavigation<any>();
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const checkForActiveExam = async () => {
    try {
      const progress = await loadMockExamProgress();
      if (progress && progress.hasStarted && !progress.isCompleted) {
        // Show alert to continue or start new
        logEvent(AnalyticsEvents.MOCK_EXAM_RESUME_DIALOG_SHOWN, { has_active_exam: true });
        Alert.alert(
          t('mockExam.examInProgress'),
          t('mockExam.resumeOrRestart'),
          [
            {
              text: t('mockExam.resume'),
              onPress: () => {
                logEvent(AnalyticsEvents.MOCK_EXAM_RESUME_SELECTED);
                navigation.navigate('MockExamRunning');
              },
            },
            {
              text: t('mockExam.startNew'),
              onPress: () => {
                logEvent(AnalyticsEvents.MOCK_EXAM_START_NEW_SELECTED);
                confirmStartNew();
              },
              style: 'destructive',
            },
            {
              text: t('common.cancel'),
              style: 'cancel',
            },
          ]
        );
      } else {
        handleStartExam();
      }
    } catch (error) {
      console.error('Error checking for active exam:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmStartNew = () => {
    Alert.alert(
      t('mockExam.confirm'),
      t('mockExam.confirmRestart'),
      [
        {
          text: t('mockExam.yesStartNew'),
          onPress: async () => {
            await clearMockExamProgress();
            handleStartExam();
          },
          style: 'destructive',
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  const handleStartExam = async () => {
    try {
      logEvent(AnalyticsEvents.MOCK_EXAM_START_CLICKED);
      // Create and save initial progress
      const initialProgress = await createInitialMockExamProgress();
      await saveMockExamProgress(initialProgress);
      navigation.navigate('MockExamRunning');
    } catch (error) {
      console.error('Error starting exam:', error);
      Alert.alert(t('common.error'), t('mockExam.couldNotStartExam'));
    }
  };

  const handleViewStructure = () => {
    // @ts-ignore - Navigate to ExamStructure in HomeStack
    navigation.navigate('HomeStack', { screen: 'ExamStructure' });
  };

  const isA1 = activeExamConfig.level === 'A1';
  const isDele = activeExamConfig.provider === 'dele';
  const mockExamSteps = isDele ? MOCK_EXAM_STEPS_DELE_B1 : (isA1 ? MOCK_EXAM_STEPS_A1 : MOCK_EXAM_STEPS);
  const totalTime = mockExamSteps.reduce((acc, step) => acc + (step.timeMinutes || 0), 0);

  const getExamDuration = () => {
    return totalTime;
  }

  const getTotalPoints = () => {
    if (isDele) {
      return 100;
    }

    return isA1 ? 60 : 300;
  }

  const getPassingScore = () => {
    if (isDele) {
      return 60;
    }

    return isA1 ? 36 : 180;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📝 {t('mockExam.title')}</Text>
          <Text style={styles.subtitle}>{t('mockExam.subtitle')}</Text>
        </View>

        {/* Overview Card */}
        <View style={styles.overviewCard}>
          <Text style={styles.cardTitle}>{t('mockExam.overview')}</Text>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>⏱️ {t('mockExam.totalDuration')}:</Text>
            <Text style={styles.overviewValue}>{totalTime} {t('mockExam.minutes')}</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>📊 {t('mockExam.totalPoints')}:</Text>
            <Text style={styles.overviewValue}>{getTotalPoints()} {t('mockExam.points')}</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>✅ {t('mockExam.passingScore')}:</Text>
            <Text style={styles.overviewValue}>{getPassingScore()} {t('mockExam.points')} (60%)</Text>
          </View>
        </View>

        {/* Important Note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>⚠️ {t('mockExam.importantNote')}</Text>
          <Text style={styles.noteText}>
            {t('mockExam.importantNoteText')}
          </Text>
          <TouchableOpacity style={styles.linkButton} onPress={handleViewStructure}>
            <Text style={styles.linkButtonText}>📖 {t('mockExam.viewStructure')}</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>ℹ️ {t('mockExam.aboutMockExam')}</Text>
          <Text style={styles.disclaimerText}>
            {t('mockExam.disclaimerText1')}{' '}
            <Text style={styles.disclaimerBold}>{t('mockExam.disclaimerText2')}</Text>{' '}
            {t('mockExam.disclaimerText3')}
          </Text>
          <Text style={styles.disclaimerText}>
            {'\n'}{t('mockExam.disclaimerText4')}
          </Text>
        </View>

        {/* Speaking Note */}
        <View style={styles.speakingNote}>
          <Text style={styles.speakingNoteTitle}>🗣️ {t('mockExam.speakingNote')}</Text>
          <Text style={styles.speakingNoteText}>
            {t('mockExam.speakingNoteText')}
          </Text>
        </View>

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} onPress={checkForActiveExam}>
          <Text style={styles.startButtonText}>🚀 {t('mockExam.startExam')}</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          {t('mockExam.goodLuck')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.padding.lg,
    paddingBottom: spacing.padding.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.margin.lg,
  },
  title: {
    ...typography.textStyles.h1,
    color: colors.primary[600],
    marginBottom: spacing.margin.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  overviewCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.lg,
    marginBottom: spacing.margin.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
    textAlign: 'left',
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.margin.sm,
  },
  overviewLabel: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  overviewValue: {
    ...typography.textStyles.body,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },
  noteCard: {
    backgroundColor: colors.warning[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    borderLeftWidth: I18nManager.isRTL ? 0 : 4,
    borderRightWidth: I18nManager.isRTL ? 4 : 0,
    borderLeftColor: colors.warning[500],
    borderRightColor: colors.warning[500],
  },
  noteTitle: {
    ...typography.textStyles.h4,
    color: colors.warning[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.xs,
    textAlign: 'left',
  },
  noteText: {
    ...typography.textStyles.body,
    color: colors.warning[700],
    lineHeight: 22,
    marginBottom: spacing.margin.sm,
    textAlign: 'left',
  },
  linkButton: {
    marginTop: spacing.margin.sm,
  },
  linkButtonText: {
    ...typography.textStyles.body,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
    textDecorationLine: 'underline',
    textAlign: 'left',
  },
  disclaimerCard: {
    backgroundColor: colors.primary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    borderLeftWidth: I18nManager.isRTL ? 0 : 4,
    borderRightWidth: I18nManager.isRTL ? 4 : 0,
    borderLeftColor: colors.primary[500],
    borderRightColor: colors.primary[500],
  },
  disclaimerTitle: {
    ...typography.textStyles.h4,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.sm,
    textAlign: 'left',
  },
  disclaimerText: {
    ...typography.textStyles.body,
    color: colors.primary[700],
    lineHeight: 22,
    textAlign: 'left',
  },
  disclaimerBold: {
    fontWeight: typography.fontWeight.bold,
    textAlign: 'left',
  },
  sectionsCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.lg,
    marginBottom: spacing.margin.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.margin.md,
  },
  sectionNumber: {
    ...typography.textStyles.h2,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.bold,
    width: 40,
    marginRight: spacing.margin.sm,
    textAlign: 'left',
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.xs,
    textAlign: 'left',
  },
  sectionDetail: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'left',
  },
  speakingNote: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.xl,
    borderLeftWidth: I18nManager.isRTL ? 0 : 4,
    borderRightWidth: I18nManager.isRTL ? 4 : 0,
    borderLeftColor: colors.secondary[500],
    borderRightColor: colors.secondary[500],
  },
  speakingNoteTitle: {
    ...typography.textStyles.h4,
    color: colors.secondary[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.xs,
    textAlign: 'left',
  },
  speakingNoteText: {
    ...typography.textStyles.body,
    color: colors.secondary[700],
    lineHeight: 22,
    textAlign: 'left',
  },
  startButton: {
    backgroundColor: colors.success[500],
    paddingVertical: spacing.padding.lg,
    paddingHorizontal: spacing.padding.xl,
    borderRadius: spacing.borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.margin.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    ...typography.textStyles.h3,
    color: colors.background.secondary,
    fontWeight: typography.fontWeight.bold,
  },
  disclaimer: {
    ...typography.textStyles.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MockExamScreen;
