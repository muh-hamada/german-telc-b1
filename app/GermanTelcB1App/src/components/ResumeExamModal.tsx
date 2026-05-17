import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import { ExamProgress } from '../types/exam.types';

interface ResumeExamModalProps {
  visible: boolean;
  savedProgress: ExamProgress | null;
  onResume: () => void;
  onStartFresh: () => void;
}

const ResumeExamModal: React.FC<ResumeExamModalProps> = ({
  visible,
  savedProgress,
  onResume,
  onStartFresh,
}) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!savedProgress) {
    return null;
  }

  // For writing exams, maxScore may have been incorrectly saved as answers.length (1).
  // The correct maxScore lives in the assessment object stored on the answer.
  const assessmentMaxScore = savedProgress.answers?.[0]?.assessment?.maxScore;
  const effectiveMaxScore = assessmentMaxScore ?? savedProgress.maxScore;

  const hasScore = savedProgress.score !== undefined && effectiveMaxScore !== undefined && effectiveMaxScore > 0;
  const lastAttemptDate = savedProgress.lastAttempt
    ? new Date(savedProgress.lastAttempt).toLocaleDateString()
    : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{t('resume.title')}</Text>
          <Text style={styles.message}>{t('resume.message')}</Text>

          <View style={styles.statsContainer}>
            {hasScore && (
              <Text style={styles.stat}>
                {t('resume.lastScore', {
                  score: savedProgress.score,
                  max: effectiveMaxScore,
                })}
              </Text>
            )}
            {lastAttemptDate && (
              <Text style={styles.stat}>
                {t('resume.lastAttempt', { date: lastAttemptDate })}
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.resumeButton} onPress={onResume}>
            <Text style={styles.resumeButtonText}>{t('resume.resumeButton')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.startFreshButton} onPress={onStartFresh}>
            <Text style={styles.startFreshButtonText}>{t('resume.startFresh')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    container: {
      backgroundColor: colors.background.secondary,
      borderRadius: 16,
      padding: spacing.xl,
      width: '100%',
      maxWidth: 400,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    message: {
      fontSize: 15,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    statsContainer: {
      backgroundColor: colors.background.primary,
      borderRadius: 10,
      padding: spacing.md,
      marginBottom: spacing.lg,
      gap: spacing.xs,
    },
    stat: {
      fontSize: 14,
      color: colors.text.primary,
      textAlign: 'center',
    },
    resumeButton: {
      backgroundColor: colors.primary[500],
      borderRadius: 10,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    resumeButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    startFreshButton: {
      borderRadius: 10,
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    startFreshButtonText: {
      color: colors.text.primary,
      fontSize: 16,
      fontWeight: '500',
    },
  });

export default ResumeExamModal;
