import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../contexts/ThemeContext';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { ReportedIssueDetails, issueReportService } from '../services/issue-report.service';
import { spacing, typography, type ThemeColors } from '../theme';
import { IssueReportCard } from './IssueReportCard';

interface IssueUpdateNotificationModalProps {
  visible: boolean;
  onClose: () => void;
  updatedReports: ReportedIssueDetails[];
}

export const IssueUpdateNotificationModal: React.FC<IssueUpdateNotificationModalProps> = ({
  visible,
  onClose,
  updatedReports,
}) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDismiss = async () => {
    // Mark all shown reports as seen
    const reportIds = updatedReports.map(r => r.id);
    await issueReportService.updateLastSeenAt(reportIds);
    onClose();
  };

  const count = updatedReports.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer} edges={['bottom']}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{t('issueUpdates.modalTitle')}</Text>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Subtitle */}
            <View style={styles.subtitleContainer}>
              <Text style={styles.subtitle}>
                {count === 1
                  ? t('issueUpdates.updatesAvailableSingle')
                  : t('issueUpdates.updatesAvailable', { count })
                }
              </Text>
            </View>

            {/* Updated Reports List */}
            <ScrollView
              style={styles.reportsList}
              contentContainerStyle={styles.reportsContent}
              showsVerticalScrollIndicator={false}
            >
              {updatedReports.map(report => (
                <IssueReportCard
                  key={report.id}
                  report={report}
                  isExpanded={expandedIds.has(report.id)}
                  onToggleExpand={() => toggleExpanded(report.id)}
                  compact={true}
                />
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background.primary,
      borderTopLeftRadius: spacing.borderRadius.xl,
      borderTopRightRadius: spacing.borderRadius.xl,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    title: {
      ...typography.textStyles.h3,
      color: colors.text.primary,
      flex: 1,
    },
    closeButton: {
      padding: spacing.sm,
    },
    closeButtonText: {
      ...typography.textStyles.h3,
      color: colors.text.secondary,
    },
    subtitleContainer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    subtitle: {
      ...typography.textStyles.bodySmall,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    reportsList: {
      flexGrow: 0,
      flexShrink: 1,
    },
    reportsContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    dismissButton: {
      backgroundColor: colors.background.secondary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    dismissButtonText: {
      ...typography.textStyles.button,
      color: colors.text.primary,
    },
  });

