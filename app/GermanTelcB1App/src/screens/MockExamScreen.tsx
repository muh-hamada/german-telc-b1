import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { MOCK_EXAM_STEPS } from '../types/mock-exam.types';
import { 
  loadMockExamProgress, 
  clearMockExamProgress,
  createInitialMockExamProgress,
  saveMockExamProgress,
} from '../services/mock-exam.service';
import AdBanner from '../components/AdBanner';
import { HIDE_ADS } from '../config/demo.config';

const MockExamScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [isLoading, setIsLoading] = useState(true);

  const checkForActiveExam = async () => {
    try {
      const progress = await loadMockExamProgress();
      if (progress && progress.hasStarted && !progress.isCompleted) {
        // Show alert to continue or start new
        Alert.alert(
          t('mockExam.examInProgress'),
          t('mockExam.resumeOrRestart'),
          [
            {
              text: t('mockExam.resume'),
              onPress: () => navigation.navigate('MockExamRunning'),
            },
            {
              text: t('mockExam.startNew'),
              onPress: () => confirmStartNew(),
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
      // Create and save initial progress
      const initialProgress = createInitialMockExamProgress();
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

  const totalTime = MOCK_EXAM_STEPS.reduce((acc, step) => acc + (step.timeMinutes || 0), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.primary[500]}
      />
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
            <Text style={styles.overviewValue}>300 {t('mockExam.points')}</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>✅ {t('mockExam.passingScore')}:</Text>
            <Text style={styles.overviewValue}>180 {t('mockExam.points')} (60%)</Text>
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

        {/* Exam Sections */}
        <View style={styles.sectionsCard}>
          <Text style={styles.cardTitle}>{t('mockExam.examSections')}</Text>
          
          <View style={styles.sectionItem}>
            <Text style={styles.sectionNumber}>1</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>{t('mockExam.readingComprehension')}</Text>
              <Text style={styles.sectionDetail}>90 {t('mockExam.minutes')} • 75 {t('mockExam.points')}</Text>
            </View>
          </View>

          <View style={styles.sectionItem}>
            <Text style={styles.sectionNumber}>2</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>{t('mockExam.languageElements')}</Text>
              <Text style={styles.sectionDetail}>90 {t('mockExam.minutes')} • 30 {t('mockExam.points')}</Text>
            </View>
          </View>

          <View style={styles.sectionItem}>
            <Text style={styles.sectionNumber}>3</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>{t('mockExam.listeningComprehension')}</Text>
              <Text style={styles.sectionDetail}>30 {t('mockExam.minutes')} • 75 {t('mockExam.points')}</Text>
            </View>
          </View>

          <View style={styles.sectionItem}>
            <Text style={styles.sectionNumber}>4</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>{t('mockExam.writtenExpression')}</Text>
              <Text style={styles.sectionDetail}>30 {t('mockExam.minutes')} • 45 {t('mockExam.points')}</Text>
            </View>
          </View>

          <View style={styles.sectionItem}>
            <Text style={styles.sectionNumber}>5</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>{t('mockExam.oralExpression')}</Text>
              <Text style={styles.sectionDetail}>15 {t('mockExam.minutes')} • 75 {t('mockExam.points')} ({t('mockExam.practiceRecommended')})</Text>
            </View>
          </View>
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
      {!HIDE_ADS && <AdBanner />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    paddingTop: spacing.padding.xl,
  },
  scrollContent: {
    padding: spacing.padding.lg,
    paddingBottom: spacing.padding.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.margin.xl,
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
    marginBottom: spacing.margin.lg,
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
  },
  overviewRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
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
    marginBottom: spacing.margin.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning[500],
  },
  noteTitle: {
    ...typography.textStyles.h4,
    color: colors.warning[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.xs,
  },
  noteText: {
    ...typography.textStyles.body,
    color: colors.warning[700],
    lineHeight: 22,
    marginBottom: spacing.margin.sm,
  },
  linkButton: {
    marginTop: spacing.margin.sm,
  },
  linkButtonText: {
    ...typography.textStyles.body,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
    textDecorationLine: 'underline',
  },
  disclaimerCard: {
    backgroundColor: colors.primary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  disclaimerTitle: {
    ...typography.textStyles.h4,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.sm,
  },
  disclaimerText: {
    ...typography.textStyles.body,
    color: colors.primary[700],
    lineHeight: 22,
  },
  disclaimerBold: {
    fontWeight: typography.fontWeight.bold,
  },
  sectionsCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.lg,
    marginBottom: spacing.margin.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionItem: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.margin.md,
  },
  sectionNumber: {
    ...typography.textStyles.h2,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.bold,
    width: 40,
    ...(I18nManager.isRTL ? { marginLeft: spacing.margin.sm } : { marginRight: spacing.margin.sm }),
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.xs,
  },
  sectionDetail: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
  speakingNote: {
    backgroundColor: colors.secondary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary[500],
  },
  speakingNoteTitle: {
    ...typography.textStyles.h4,
    color: colors.secondary[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.xs,
  },
  speakingNoteText: {
    ...typography.textStyles.body,
    color: colors.secondary[700],
    lineHeight: 22,
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
