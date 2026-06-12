import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, type ThemeColors, type Typography } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import { PartStat } from '../hooks/useSectionStats';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

interface SectionStatsModalProps {
  visible: boolean;
  onClose: () => void;
  sectionLabel: string;
  stats: PartStat[];
}

const SectionStatsModal: React.FC<SectionStatsModalProps> = ({
  visible,
  onClose,
  sectionLabel,
  stats,
}) => {
  const { t } = useCustomTranslation();
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  useEffect(() => {
    if (!visible) return;
    logEvent(AnalyticsEvents.SECTION_STATS_MODAL_VIEWED, {
      section_label: sectionLabel,
      parts_count: stats.length,
      parts_with_attempts: stats.filter(s => s.attempted > 0).length,
    });
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = (method: 'x_button' | 'done_button' | 'back_gesture') => {
    logEvent(AnalyticsEvents.SECTION_STATS_MODAL_CLOSED, {
      section_label: sectionLabel,
      close_method: method,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => handleClose('back_gesture')}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {t('sectionStats.detailsTitle', { section: sectionLabel })}
            </Text>
            <TouchableOpacity onPress={() => handleClose('x_button')} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {stats.map((part, index) => (
              <View key={part.examType} style={[styles.partSection, index > 0 && styles.partSectionBorder]}>
                <Text style={styles.partTitle}>
                  {t('sectionStats.part', { number: part.partNumber })}
                </Text>

                {part.attempted === 0 ? (
                  <Text style={styles.noAttemptsText}>
                    {t('sectionStats.noAttemptsForPart')}
                  </Text>
                ) : (
                  <>
                    <View style={styles.partMetaRow}>
                      <Text style={styles.partMetaText}>
                        {t('sectionStats.attempts', { count: part.attempted })}
                      </Text>
                      {part.avgScore != null && (
                        <Text style={styles.partMetaText}>
                          {t('sectionStats.avg', { score: part.avgScore })}
                        </Text>
                      )}
                      {part.bestScore != null && (
                        <Text style={styles.partMetaText}>
                          {t('sectionStats.best', { score: part.bestScore })}
                        </Text>
                      )}
                    </View>

                    {part.allHistory.length > 0 ? (
                      <View style={styles.historyContainer}>
                        <Text style={styles.historyTitle}>
                          {t('sectionStats.historyTitle')}
                        </Text>
                        {part.allHistory.map((h, i) => {
                          const pct = Math.round((h.score / h.maxScore) * 100);
                          const date = new Date(h.timestamp).toLocaleDateString();
                          return (
                            <Text key={`${h.timestamp}-${i}`} style={styles.historyEntry}>
                              {'· '}
                              {t('sectionStats.historyEntry', {
                                score: h.score,
                                max: h.maxScore,
                                pct,
                                date,
                              })}
                            </Text>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={styles.noHistoryText}>
                        {t('sectionStats.noHistory')}
                      </Text>
                    )}
                  </>
                )}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.doneButton} onPress={() => handleClose('done_button')}>
            <Text style={styles.doneButtonText}>{t('common.done')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: colors.background.secondary,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      paddingBottom: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    title: {
      fontSize: typography.fontSize.lg,
      fontWeight: '600',
      color: colors.text.primary,
      flex: 1,
    },
    closeButton: {
      padding: spacing.xs,
    },
    closeButtonText: {
      fontSize: typography.fontSize.base,
      color: colors.text.secondary,
    },
    scrollView: {
      flexGrow: 0,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    partSection: {
      paddingVertical: spacing.md,
    },
    partSectionBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    partTitle: {
      fontSize: typography.fontSize.base,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    partMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    partMetaText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
    },
    noAttemptsText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.tertiary,
      fontStyle: 'italic',
    },
    historyContainer: {
      marginTop: spacing.xs,
    },
    historyTitle: {
      fontSize: typography.fontSize.sm,
      fontWeight: '500',
      color: colors.text.secondary,
      marginBottom: spacing.xs,
    },
    historyEntry: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      lineHeight: 20,
    },
    noHistoryText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.tertiary,
      fontStyle: 'italic',
    },
    doneButton: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: colors.primary[500],
      borderRadius: 10,
      alignItems: 'center',
    },
    doneButtonText: {
      fontSize: typography.fontSize.base,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });

export default SectionStatsModal;
