import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, typography } from '../theme';
import { useCompletion } from '../contexts/CompletionContext';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

interface Exam {
  id: number;
  title?: string;
}

interface ExamSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  exams: Exam[];
  onSelectExam: (examId: number) => void;
  examType: string;
  partNumber: number;
  title?: string;
  itemType?: string;
}

const ExamSelectionModal: React.FC<ExamSelectionModalProps> = ({
  visible,
  onClose,
  exams,
  onSelectExam,
  examType,
  partNumber,
  title,
  itemType,
}) => {
  const { t } = useTranslation();
  const { getCompletionStatus, getStatsForPart } = useCompletion();
  
  const stats = getStatsForPart(examType, partNumber);
  
  // Always show stats, even if user is logged out (will show 0 progress)
  const displayStats = stats || {
    completed: 0,
    total: exams.length,
    percentage: 0,
  };

  const handleSelectExam = (examId: number) => {
    onSelectExam(examId);
    onClose();
  };

  const handleClose = (reason: 'user' | 'system') => {
    logEvent(AnalyticsEvents.EXAM_SELECTION_CLOSED, { section: examType, part: partNumber, reason });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => handleClose('system')}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {title || t('exam.selectExam')}
            </Text>
            <TouchableOpacity
              onPress={() => handleClose('user')}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <Icon name="check-circle" size={20} color={colors.success[500]} />
              <Text style={styles.statsText}>
                {t('exam.completedCount', { completed: displayStats.completed, total: displayStats.total })}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${displayStats.percentage}%` }
                ]} 
              />
            </View>
            {!stats && (
              <Text style={styles.loginHintText}>
                {t('exam.loginToSaveProgress')}
              </Text>
            )}
          </View>

          <ScrollView style={styles.examList}>
            {exams && exams.length > 0 ? (
              exams.map((exam) => {
                const completionData = getCompletionStatus(examType, partNumber, exam.id);
                const isCompleted = completionData?.completed || false;

                return (
                  <TouchableOpacity
                    key={exam.id}
                    style={[
                      styles.examItem,
                      isCompleted && styles.examItemCompleted,
                    ]}
                    onPress={() => handleSelectExam(exam.id)}
                  >
                    <View style={styles.examItemContent}>
                      <View style={styles.examItemLeft}>
                        <Text style={styles.examItemNumber}>
                          {itemType || t('exam.test')}  {exam.id + 1}
                        </Text>
                        {exam.title && (
                          <Text style={styles.examItemTitle}>{exam.title}</Text>
                        )}
                      </View>
                      
                      {isCompleted && (
                        <View style={styles.completedBadge}>
                          <Icon name="check" size={16} color={colors.success[600]} />
                          <Text style={styles.completedText}>
                            {t('exam.completed')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {t('exam.selectAnExam')}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.padding.lg,
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    ...typography.textStyles.h5,
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: spacing.padding.xs,
  },
  closeButtonText: {
    ...typography.textStyles.h3,
    color: colors.text.secondary,
  },
  statsContainer: {
    padding: spacing.padding.lg,
    backgroundColor: colors.primary[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  statsRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: spacing.margin.sm,
  },
  statsText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.margin.sm,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.white,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success[500],
    borderRadius: 4,
  },
  loginHintText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.margin.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  examList: {
    flexGrow: 1,
    flexShrink: 1,
  },
  examItem: {
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  examItemCompleted: {
    backgroundColor: colors.success[50],
  },
  examItemContent: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examItemLeft: {
    flex: 1,
  },
  examItemNumber: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  examItemTitle: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
  completedBadge: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.success[100],
    paddingHorizontal: spacing.padding.sm,
    paddingVertical: spacing.padding.xs,
    borderRadius: spacing.borderRadius.sm,
  },
  completedText: {
    ...typography.textStyles.bodySmall,
    color: colors.success[700],
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.margin.xs,
  },
  emptyState: {
    padding: spacing.padding.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default ExamSelectionModal;

