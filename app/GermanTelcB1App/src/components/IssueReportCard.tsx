import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import { ReportedIssueDetails } from '../services/issue-report.service';

interface IssueReportCardProps {
  report: ReportedIssueDetails;
  isExpanded: boolean;
  onToggleExpand: () => void;
  compact?: boolean; // For use in modals
}

export const IssueReportCard: React.FC<IssueReportCardProps> = ({
  report,
  isExpanded,
  onToggleExpand,
  compact = false,
}) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = React.useMemo(() => createStyles(colors, compact), [colors, compact]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return colors.warning[500];
      case 'in_progress':
        return colors.primary[500];
      case 'resolved':
        return colors.success[500];
      default:
        return colors.text.secondary;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending':
        return t('reportedIssues.statusValues.pending');
      case 'in_progress':
        return t('reportedIssues.statusValues.in_progress');
      case 'resolved':
        return t('reportedIssues.statusValues.resolved');
      default:
        return status;
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatQuestionInfo = (report: ReportedIssueDetails): string => {
    return `${report.section} - Part ${report.part} - Exam #${report.examId}`;
  };

  const truncateMessage = (message: string, maxLength: number = 100): string => {
    if (message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength) + '...';
  };

  const shouldTruncate = report.userFeedback.length > 100;

  return (
    <View style={styles.reportCard}>
      {/* Date and Status Row */}
      <View style={styles.headerRow}>
        <View style={styles.dateContainer}>
          <Icon name="calendar-today" size={16} color={colors.text.secondary} />
          <Text style={styles.dateText}>{formatDate(report.timestamp)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.displayStatus) }]}>
          <Text style={styles.statusText}>{getStatusLabel(report.displayStatus)}</Text>
        </View>
      </View>

      {/* Question Info */}
      <View style={styles.infoRow}>
        <Text style={styles.label}>{t('reportedIssues.question')}:</Text>
        <Text style={styles.value}>{formatQuestionInfo(report)}</Text>
      </View>

      {/* User Message */}
      <View style={styles.messageSection}>
        <Text style={styles.label}>{t('reportedIssues.yourMessage')}:</Text>
        <Text style={styles.messageText}>
          {isExpanded ? report.userFeedback : truncateMessage(report.userFeedback)}
        </Text>
        {shouldTruncate && (
          <TouchableOpacity
            onPress={onToggleExpand}
            activeOpacity={0.7}
          >
            <Text style={styles.expandButton}>
              {isExpanded ? t('reportedIssues.showLess') : t('reportedIssues.showMore')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Admin Response */}
      <View style={styles.responseSection}>
        <Text style={styles.label}>{t('reportedIssues.adminResponse')}:</Text>
        <Text style={[
          styles.responseText,
          !report.adminResponse && styles.noResponseText
        ]}>
          {report.adminResponse || t('reportedIssues.underReview')}
        </Text>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors, compact: boolean) =>
  StyleSheet.create({
    reportCard: {
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      padding: compact ? spacing.sm : spacing.md,
      marginBottom: compact ? spacing.sm : spacing.md,
      ...spacing.shadow.sm,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    dateText: {
      ...typography.textStyles.caption,
      color: colors.text.secondary,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      ...typography.textStyles.caption,
      color: colors.white,
      fontWeight: typography.fontWeight.semibold,
      fontSize: 12,
    },
    infoRow: {
      marginBottom: spacing.sm,
    },
    label: {
      ...typography.textStyles.caption,
      color: colors.text.secondary,
      fontWeight: typography.fontWeight.semibold,
      textAlign: 'left',
    },
    value: {
      ...typography.textStyles.bodySmall,
      color: colors.text.primary,
    },
    messageSection: {
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    messageText: {
      ...typography.textStyles.bodySmall,
      color: colors.text.primary,
      lineHeight: 20,
    },
    expandButton: {
      ...typography.textStyles.caption,
      color: colors.primary[500],
      marginTop: spacing.xs,
      fontWeight: typography.fontWeight.semibold,
    },
    responseSection: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    responseText: {
      ...typography.textStyles.bodySmall,
      color: colors.text.primary,
      lineHeight: 20,
    },
    noResponseText: {
      fontStyle: 'italic',
      color: colors.text.tertiary,
    },
  });

