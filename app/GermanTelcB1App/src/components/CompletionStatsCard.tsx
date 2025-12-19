import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import Icon from 'react-native-vector-icons/FontAwesome';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import Button from './Button';
import { AllCompletionStats } from '../services/firebase-completion.service';
import { activeExamConfig } from '../config/active-exam.config';

interface CompletionStatsCardProps {
  stats: AllCompletionStats;
  isLoading?: boolean;
  showLoggedOutMessage?: boolean;
  showOnlyTop?: boolean;
  onSeeAllStats?: () => void;
}

interface ExamSection {
  key: string;
  titleKey: string;
  parts: number[];
}

const CompletionStatsCard: React.FC<CompletionStatsCardProps> = ({ 
  stats, 
  isLoading = false, 
  showLoggedOutMessage = false, 
  showOnlyTop = false,
  onSeeAllStats 
}) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Build exam sections dynamically from the active exam config
  const examSections: ExamSection[] = useMemo(() => {
    const sections: ExamSection[] = [];
    const examStructure = activeExamConfig.examStructure;
    
    // Define title keys for each exam type
    const titleKeys: { [key: string]: string } = {
      'grammar': 'practice.grammar.title',
      'reading': 'practice.reading.title',
      'writing': 'practice.writing.title',
      'speaking': 'practice.speaking.title',
      'listening': 'practice.listening.title',
    };
    
    // Build sections based on exam structure
    for (const [examType, parts] of Object.entries(examStructure)) {
      if (titleKeys[examType]) {
        sections.push({
          key: examType,
          titleKey: titleKeys[examType],
          parts: parts as number[],
        });
      }
    }
    
    return sections;
  }, []);

  const getPartTitle = (examType: string, partNumber: number): string => {
    // For writing with only 1 part, don't show part number
    if (examType === 'writing' && activeExamConfig.examStructure.writing.length === 1) {
      return t('practice.writing.title');
    }
    if (examType === 'speaking') {
      return t(`practice.speaking.part${partNumber}`);
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

      {/* See All Stats Button for showOnlyTop mode */}
      {showOnlyTop && onSeeAllStats && (
        <Button
          title={t('profile.seeAllStats')}
          onPress={onSeeAllStats}
          variant="outline"
          style={styles.seeAllButton}
        />
      )}

      {/* Section-wise breakdown - only show when not showOnlyTop */}
      {!showOnlyTop && (
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

                  // Determine whether to show part number
                  const showPartNumber = !(section.key === 'writing' && section.parts.length === 1);

                  return (
                    <View key={`${section.key}-${partNumber}`} style={styles.partRow}>
                      <View style={styles.partInfo}>
                        <Text style={styles.partTitle}>
                          {showPartNumber ? `Part ${partNumber}` : ''}
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
      )}

      {totalStats.totalCompleted === 0 && (
        <View style={styles.emptyState}>
          <Icon name="info-circle" size={32} color={colors.text.tertiary} style={styles.emptyIcon} />
          {showLoggedOutMessage ? (
            <Text style={styles.emptyText}>{t('exam.loginToSaveProgress')}</Text>
          ) : (
            t('profile.noCompletedExams').split('.').map((sentence, index) => (
              <Text key={index} style={styles.emptyText}>{sentence}</Text>
            ))
          )}
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.padding.lg,
      marginBottom: spacing.margin.lg,
      ...spacing.shadow.sm,
    },
    loadingText: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.margin.lg,
    },
    headerTitle: {
      ...typography.textStyles.h3,
      color: colors.text.primary,
      marginLeft: spacing.margin.sm,
      flex: 1,
      textAlign: 'left',
    },
    totalSection: {
      backgroundColor: colors.primary[50],
      borderRadius: spacing.borderRadius.md,
      padding: spacing.padding.md,
      marginBottom: spacing.margin.lg,
    },
    totalRow: {
      flexDirection: 'row',
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
      backgroundColor: colors.background.secondary,
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
      textAlign: 'left',
    },
    partRow: {
      flexDirection: 'row',
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
      paddingTop: spacing.padding.xl,
    },
    emptyIcon: {
      marginBottom: spacing.margin.md,
    },
    emptyText: {
      ...typography.textStyles.body,
      color: colors.text.tertiary,
      textAlign: 'center',
    },
    seeAllButton: {},
  });

export default CompletionStatsCard;

