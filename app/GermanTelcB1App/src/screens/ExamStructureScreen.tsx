import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../theme';
import dataService from '../services/data.service';
import AdBanner from '../components/AdBanner';
import { HIDE_ADS } from '../config/development.config';

const ExamStructureScreen: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [examInfoData, setExamInfoData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dataService.getExamInfo();
      setExamInfoData(data);
    } catch (err) {
      console.error('Error loading exam info data:', err);
      setError('Failed to load exam structure data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !examInfoData) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error || 'Failed to load exam structure'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const examInfo = examInfoData.exam_info;

  const getLocalizedText = (obj: any) => {
    const lang = i18n.language;
    return obj[lang] || obj.en;
  };

  const renderPartItem = (part: any, index: number) => (
    <View key={index} style={styles.partItem}>
      <View style={styles.partHeader}>
        <Text style={styles.partName}>{part.part_name}</Text>
        <View style={styles.partMeta}>
          {part.time_minutes && (
            <Text style={styles.partMetaText}>⏱️ {part.time_minutes} Min</Text>
          )}
          {part.max_points && (
            <Text style={styles.partMetaText}>📊 {part.max_points} Pkt</Text>
          )}
        </View>
      </View>
      {part.question_type_detail && (
        <Text style={styles.partDetail}>
          {getLocalizedText(part.question_type_detail)}
        </Text>
      )}
    </View>
  );

  const renderSection = (section: any, index: number) => {
    const sectionNumber = index + 1;

    return (
      <View key={index} style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>{sectionNumber}</Text>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionName}>{section.name}</Text>
            <View style={styles.sectionMetaRow}>
              <Text style={styles.sectionMeta}>
                ⏱️ {section.total_time_minutes} Min
              </Text>
              {section.preparation_time_minutes && (
                <Text style={styles.sectionMeta}>
                  📝 +{section.preparation_time_minutes} Min Vorbereitung
                </Text>
              )}
              <Text style={styles.sectionMeta}>
                📊 {section.max_points} Pkt ({section.weight_percent}%)
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.partsContainer}>
          {section.parts.map((part: any, idx: number) => renderPartItem(part, idx))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📝 {getLocalizedText(examInfo.title)}</Text>
          <View style={styles.overviewCard}>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>{t('examStructure.cefrLevel')}:</Text>
              <Text style={styles.overviewValue}>{examInfo.cefr_level}</Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>{t('examStructure.totalDuration')}:</Text>
              <Text style={styles.overviewValue}>
                {examInfo.total_duration_minutes} {t('examStructure.minutes')}
              </Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>{t('examStructure.totalMaxPoints')}:</Text>
              <Text style={styles.overviewValue}>{examInfo.total_max_points} {t('examStructure.points')}</Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>{t('examStructure.passingScore')}:</Text>
              <Text style={styles.overviewValue}>
                {examInfo.passing_score.overall_points} {t('examStructure.points')} (60%)
              </Text>
            </View>
          </View>

          {/* Passing Score Note */}
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>⚠️ {t('examStructure.important')}:</Text>
            <Text style={styles.noteText}>
              {getLocalizedText(examInfo.passing_score.note)}
            </Text>
          </View>
        </View>

        {/* Exam Structure Sections */}
        <Text style={styles.structureTitle}>
          {getLocalizedText(examInfo.exam_structure.title)}
        </Text>

        {examInfo.exam_structure.sections.map((section: any, index: number) =>
          renderSection(section, index)
        )}

        {/* Assessment Criteria */}
        <View style={styles.assessmentSection}>
          <Text style={styles.structureTitle}>
            {getLocalizedText(examInfo.assessment_score.title)}
          </Text>

          {examInfo.assessment_score.assessment_details.map((detail: any, index: number) => (
            <View key={index} style={styles.assessmentCard}>
              <Text style={styles.assessmentSectionName}>
                {detail.section_name}
              </Text>
              <Text style={styles.assessmentMaxPoints}>
                {t('examStructure.maxPoints')}: {detail.max_points} {t('examStructure.points')}
              </Text>

              <View style={styles.criteriaList}>
                {detail.criteria.map((criterion: any, idx: number) => (
                  <View key={idx} style={styles.criterionItem}>
                    <Text style={styles.criterionName}>{criterion.name}</Text>
                    {criterion.max_points && (
                      <Text style={styles.criterionPoints}>
                        ({criterion.max_points} {t('examStructure.points')})
                      </Text>
                    )}
                    <Text style={styles.criterionExplanation}>
                      {getLocalizedText(criterion.explanation)}
                    </Text>
                  </View>
                ))}
              </View>

              {detail.note && (
                <View style={styles.assessmentNote}>
                  <Text style={styles.assessmentNoteText}>
                    ℹ️ {getLocalizedText(detail.note)}
                  </Text>
                </View>
              )}

              {detail.points_distribution && (
                <View style={styles.assessmentNote}>
                  <Text style={styles.assessmentNoteText}>
                    ℹ️ {getLocalizedText(detail.points_distribution)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
      {!HIDE_ADS && <AdBanner screen="exam-structure" />}
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
  },
  scrollContent: {
    padding: spacing.padding.lg,
    paddingBottom: spacing.padding.xl * 2,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
  },
  header: {
    marginBottom: spacing.margin.xl,
  },
  title: {
    ...typography.textStyles.h2,
    color: colors.primary[600],
    marginBottom: spacing.margin.lg,
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
  overviewRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.margin.sm,
  },
  overviewLabel: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold,
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
    ...typography.textStyles.bodySmall,
    color: colors.warning[700],
    lineHeight: 20,
  },
  structureTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
  },
  sectionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.padding.lg,
    marginBottom: spacing.margin.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.margin.md,
  },
  sectionNumber: {
    ...typography.textStyles.h2,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.bold,
    ...(I18nManager.isRTL ? { marginLeft: spacing.margin.sm } : { marginRight: spacing.margin.sm }),
    width: 40,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionName: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  sectionMetaRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    flexWrap: 'wrap',
    gap: spacing.margin.sm,
  },
  sectionMeta: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
  partsContainer: {
    marginTop: spacing.margin.sm,
  },
  partItem: {
    backgroundColor: colors.secondary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[400],
  },
  partHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.margin.xs,
  },
  partName: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
    marginRight: spacing.margin.sm,
  },
  partMeta: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    gap: spacing.margin.xs,
  },
  partMetaText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
  partDetail: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    lineHeight: 20,
    marginTop: spacing.margin.xs,
  },
  assessmentSection: {
    marginTop: spacing.margin.md,
  },
  assessmentCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.padding.lg,
    marginBottom: spacing.margin.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  assessmentSectionName: {
    ...typography.textStyles.h4,
    color: colors.primary[600],
    marginBottom: spacing.margin.xs,
  },
  assessmentMaxPoints: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.margin.md,
  },
  criteriaList: {
    marginTop: spacing.margin.sm,
  },
  criterionItem: {
    backgroundColor: colors.secondary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.sm,
  },
  criterionName: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.xs,
  },
  criterionPoints: {
    ...typography.textStyles.bodySmall,
    color: colors.primary[500],
    marginBottom: spacing.margin.xs,
  },
  criterionExplanation: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  assessmentNote: {
    backgroundColor: colors.primary[50],
    padding: spacing.padding.sm,
    borderRadius: spacing.borderRadius.sm,
    marginTop: spacing.margin.md,
  },
  assessmentNoteText: {
    ...typography.textStyles.bodySmall,
    color: colors.primary[700],
    lineHeight: 18,
  },
});

export default ExamStructureScreen;
