import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, type ThemeColors, type Typography } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import { useSectionStats, PartStat } from '../hooks/useSectionStats';
import SectionStatsModal from './SectionStatsModal';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

interface SectionStatsCardProps {
  section: string;
  sectionLabel: string;
}

const SectionStatsCard: React.FC<SectionStatsCardProps> = ({ section, sectionLabel }) => {
  const { t } = useCustomTranslation();
  const { colors, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);
  const { stats, hasAnyAttempts } = useSectionStats(section);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (stats.length === 0) return;
    const partsAttempted = stats.filter(s => s.attempted > 0).length;
    logEvent(AnalyticsEvents.SECTION_STATS_CARD_VIEWED, {
      section,
      has_attempts: hasAnyAttempts,
      parts_count: stats.length,
      parts_attempted: partsAttempted,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const handleDetailsPressed = useCallback(() => {
    const partsAttempted = stats.filter(s => s.attempted > 0).length;
    const scoredParts = stats.filter(s => s.avgScore != null);
    const avgScore =
      scoredParts.length > 0
        ? Math.round(
            scoredParts.reduce((sum, s) => sum + s.avgScore!, 0) / scoredParts.length,
          )
        : null;
    logEvent(AnalyticsEvents.SECTION_STATS_DETAILS_CLICKED, {
      section,
      parts_count: stats.length,
      parts_attempted: partsAttempted,
      avg_score: avgScore,
    });
    setModalVisible(true);
  }, [section, stats]);

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
  }, []);

  const getPartStatsText = (part: PartStat): string => {
    if (part.attempted === 0) {
      return t('sectionStats.noAttemptsForPart');
    }
    if (part.avgScore != null) {
      return t('sectionStats.attemptsWithAvg', { count: part.attempted, score: part.avgScore });
    }
    return t('sectionStats.attempts', { count: part.attempted });
  };

  if (stats.length === 0) {
    // Section not present in this flavor's examStructure — render nothing
    return null;
  }

  return (
    <>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle}>{t('sectionStats.title')}</Text>
          {hasAnyAttempts && (
            <TouchableOpacity
              onPress={handleDetailsPressed}
              style={styles.detailsButton}>
              <Text style={styles.detailsButtonText}>{t('sectionStats.detailsButton')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {hasAnyAttempts ? (
          stats.map(part => (
            <View key={part.examType} style={styles.partRow}>
              <Text style={styles.partLabel}>
                {t('sectionStats.part', { number: part.partNumber })}
              </Text>
              <Text style={styles.partStats}>
                {getPartStatsText(part)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noAttemptsText}>{t('sectionStats.noAttempts')}</Text>
        )}
      </View>

      <SectionStatsModal
        visible={modalVisible}
        onClose={handleModalClose}
        sectionLabel={sectionLabel}
        stats={stats}
      />
    </>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.gray[50],
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderTopWidth: 1,
      borderLeftWidth: 4,
      borderBottomWidth: 4,
      borderColor: colors.black,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    cardTitle: {
      fontSize: typography.fontSize.sm,
      fontWeight: '600',
      color: colors.text.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    detailsButton: {
      paddingVertical: 2,
      paddingHorizontal: spacing.sm,
    },
    detailsButtonText: {
      fontSize: typography.fontSize.sm,
      color: colors.primary[500],
      fontWeight: '500',
    },
    partRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 3,
    },
    partLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.text.primary,
    },
    partStats: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
    },
    noAttemptsText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.tertiary,
      fontStyle: 'italic',
    },
  });

export default SectionStatsCard;
