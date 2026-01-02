import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { issueReportService } from '../services/issue-report.service';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

interface ReportIssueModalProps {
  visible: boolean;
  onClose: () => void;
  examData: any;
  section: string;
  part: number;
  examId: number;
}

const MAX_CHARACTERS = 1000;
const MIN_CHARACTERS = 10;

const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  visible,
  onClose,
  examData,
  section,
  part,
  examId,
}) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Log when modal opens
  React.useEffect(() => {
    if (visible) {
      logEvent(AnalyticsEvents.ISSUE_REPORT_MODAL_OPENED, {
        section,
        part,
        exam_id: examId,
        user_logged_in: !!user,
      });
    }
  }, [visible, section, part, examId, user]);

  const handleClose = () => {
    logEvent(AnalyticsEvents.ISSUE_REPORT_MODAL_CLOSED, {
      section,
      part,
      exam_id: examId,
      feedback_provided: feedback.length > 0,
    });
    setFeedback('');
    onClose();
  };

  const handleSubmit = async () => {
    // Validate feedback
    if (feedback.trim().length < MIN_CHARACTERS) {
      Alert.alert(
        t('issueReport.error'),
        t('issueReport.feedbackRequired')
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await issueReportService.submitIssueReport({
        userId: user?.uid || null,
        examData,
        section,
        part,
        examId,
        userFeedback: feedback.trim(),
      });

      logEvent(AnalyticsEvents.ISSUE_REPORT_SUBMITTED, {
        section,
        part,
        exam_id: examId,
        feedback_length: feedback.trim().length,
        user_logged_in: !!user,
      });

      // Show success message
      Alert.alert(
        t('issueReport.success'),
        t('issueReport.successMessage'),
        [
          {
            text: 'OK',
            onPress: () => {
              setFeedback('');
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('[ReportIssueModal] Error submitting report:', error);
      
      logEvent(AnalyticsEvents.ISSUE_REPORT_SUBMISSION_FAILED, {
        section,
        part,
        exam_id: examId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      Alert.alert(
        t('issueReport.error'),
        t('issueReport.errorMessage')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = feedback.trim().length < MIN_CHARACTERS || isSubmitting;
  const characterCount = feedback.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{t('issueReport.title')}</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Instruction Text */}
              <Text style={styles.instructionText}>
                {t('issueReport.instruction')}
              </Text>

              {/* Feedback Input */}
              <TextInput
                style={styles.feedbackInput}
                placeholder={t('issueReport.feedbackPlaceholder')}
                placeholderTextColor={colors.text.tertiary}
                value={feedback}
                onChangeText={setFeedback}
                multiline
                maxLength={MAX_CHARACTERS}
                textAlignVertical="top"
                editable={!isSubmitting}
              />

              {/* Character Counter */}
              <Text style={styles.characterCount}>
                {t('issueReport.characterCount', {
                  current: characterCount,
                  max: MAX_CHARACTERS,
                })}
              </Text>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitDisabled && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isSubmitDisabled}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {t('issueReport.submit')}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
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
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background.primary,
      borderTopLeftRadius: spacing.borderRadius.xl,
      borderTopRightRadius: spacing.borderRadius.xl,
      maxHeight: '80%',
      minHeight: 500,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.padding.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    title: {
      ...typography.textStyles.h3,
      color: colors.text.primary,
      flex: 1,
    },
    closeButton: {
      padding: spacing.padding.sm,
    },
    closeButtonText: {
      ...typography.textStyles.h3,
      color: colors.text.secondary,
    },
    scrollView: {
      maxHeight: 450,
    },
    scrollContent: {
      padding: spacing.padding.lg,
      paddingBottom: spacing.padding.xl,
    },
    instructionText: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      lineHeight: 22,
      marginBottom: spacing.margin.lg,
    },
    feedbackInput: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      backgroundColor: colors.background.secondary,
      borderWidth: 1,
      borderColor: colors.border.light,
      borderRadius: spacing.borderRadius.md,
      padding: spacing.padding.md,
      minHeight: 150,
      maxHeight: 250,
      marginBottom: spacing.margin.sm,
    },
    characterCount: {
      ...typography.textStyles.bodySmall,
      color: colors.text.tertiary,
      textAlign: 'right',
      marginBottom: spacing.margin.lg,
    },
    submitButton: {
      backgroundColor: colors.primary[500],
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      borderRadius: spacing.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    submitButtonDisabled: {
      backgroundColor: colors.secondary[400],
      opacity: 0.6,
    },
    submitButtonText: {
      ...typography.textStyles.body,
      fontWeight: typography.fontWeight.bold,
      color: colors.white,
    },
  });

export default ReportIssueModal;

