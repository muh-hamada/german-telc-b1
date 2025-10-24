import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, typography } from '../theme';
import { AllCompletionStats } from '../services/firebase-completion.service';

interface CompletionStatsCardProps {
  stats: AllCompletionStats;
  isLoading?: boolean;
}

interface ExamSection {
  key: string;
  titleKey: string;
  parts: number[];
}

const CompletionStatsCard: React.FC<CompletionStatsCardProps> = ({ stats, isLoading = false }) => {
  const { t } = useTranslation();

  const examSections: ExamSection[] = [
    { key: 'grammar', titleKey: 'practice.grammar.title', parts: [1, 2] },
    { key: 'reading', titleKey: 'practice.reading.title', parts: [1, 2, 3] },
    { key: 'writing', titleKey: 'practice.writing.title', parts: [1] },
  ];

  const getPartTitle = (examType: string, partNumber: number): string => {
    if (examType === 'writing') {
      return t('practice.writing.title');
    }
    return t(`practice.${examType}.part${partNumber}`);
  };

  const getTotalStats = () => {
    let totalCompleted = 0;
    let totalExams = 0;

    Object.values(stats).forEach(examType => {
      Object.values(examType).forEach(partStats => {
        totalCompleted += partStats.completed;
        totalExams += partStats.total;
      });
    });

    return { totalCompleted, totalExams, percentage: totalExams > 0 ? Math.round((totalCompleted / totalExams) * 100) : 0 };
  };

  if (isLoading) {
    return (
      <View style={styles.card}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const totalStats = getTotalStats();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Icon name="trophy" size={24} color={colors.primary[500]} />
        <Text style={styles.headerTitle}>{t('profile.completionStats')}</Text>
      </View>

      {/* Total Progress */}
      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>{t('profile.totalProgress')}</Text>
          <Text style={styles.totalCount}>
            {totalStats.totalCompleted}/{totalStats.totalExams}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${totalStats.percentage}%` },
            ]}
          />
        </View>
        <Text style={styles.percentageText}>{totalStats.percentage}%</Text>
      </View>

      {/* Section-wise breakdown */}
      <View style={styles.sectionsContainer}>
        {examSections.map((section) => {
          const sectionStats = stats[section.key];
          if (!sectionStats) return null;

          // Calculate section totals
          let sectionCompleted = 0;
          let sectionTotal = 0;
          section.parts.forEach(partNumber => {
            const partStats = sectionStats[partNumber];
            if (partStats) {
              sectionCompleted += partStats.completed;
              sectionTotal += partStats.total;
            }
          });

          return (
            <View key={section.key} style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{t(section.titleKey)}</Text>
              
              {section.parts.map((partNumber) => {
                const partStats = sectionStats[partNumber];
                if (!partStats) return null;

                return (
                  <View key={`${section.key}-${partNumber}`} style={styles.partRow}>
                    <View style={styles.partInfo}>
                      <Text style={styles.partTitle}>
                        {section.key === 'writing' ? '' : `Part ${partNumber}`}
                      </Text>
                      <View style={styles.miniProgressBar}>
                        <View
                          style={[
                            styles.miniProgressBarFill,
                            { width: `${partStats.percentage}%` },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.partStats}>
                      {partStats.completed}/{partStats.total}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>

      {totalStats.totalCompleted === 0 && (
        <View style={styles.emptyState}>
          <Icon name="info-circle" size={32} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>{t('profile.noCompletedExams')}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.padding.lg,
    marginBottom: spacing.margin.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: spacing.margin.lg,
  },
  headerTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginLeft: spacing.margin.sm,
    flex: 1,
  },
  totalSection: {
    backgroundColor: colors.primary[50],
    borderRadius: spacing.borderRadius.md,
    padding: spacing.padding.md,
    marginBottom: spacing.margin.lg,
  },
  totalRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.margin.sm,
  },
  totalText: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
  },
  totalCount: {
    ...typography.textStyles.h4,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: colors.white,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.margin.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success[500],
    borderRadius: 6,
  },
  percentageText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.margin.xs,
  },
  sectionsContainer: {
    gap: spacing.margin.md,
  },
  sectionContainer: {
    marginBottom: spacing.margin.md,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  partRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.padding.xs,
    paddingHorizontal: spacing.padding.sm,
    backgroundColor: colors.background.primary,
    borderRadius: spacing.borderRadius.sm,
    marginBottom: spacing.margin.xs,
  },
  partInfo: {
    flex: 1,
    marginRight: spacing.margin.md,
  },
  partTitle: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.margin.xs,
  },
  miniProgressBar: {
    height: 6,
    backgroundColor: colors.secondary[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniProgressBarFill: {
    height: '100%',
    backgroundColor: colors.success[500],
    borderRadius: 3,
  },
  partStats: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.padding.xl,
  },
  emptyText: {
    ...typography.textStyles.body,
    color: colors.text.tertiary,
    marginTop: spacing.margin.sm,
    textAlign: 'center',
  },
});

export default CompletionStatsCard;

