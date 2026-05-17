import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, type ThemeColors, type Typography } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import { useSectionStats, PartStat } from '../hooks/useSectionStats';
import SectionStatsModal from './SectionStatsModal';

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
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.detailsButton}>
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
        onClose={() => setModalVisible(false)}
        sectionLabel={sectionLabel}
        stats={stats}
      />
    </>
  );
};

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.light,
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
      color: colors.text.secondary,
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
