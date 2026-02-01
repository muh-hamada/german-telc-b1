import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../../theme';
import { useAppTheme } from '../../contexts/ThemeContext';
import { WritingAssessment } from '../../services/http.openai.service';
import { WritingExam } from '../../types/exam.types';
import { activeExamConfig } from '../../config/active-exam.config';
import Icon from 'react-native-vector-icons/MaterialIcons';

// In the Telc exam, the initiatial evaluation if from 15
// Then we multiply by 3 to reach a max score of 45
// For the Dele exams, we do not multiply at all, so the max score is 25
const SCORE_MULTIPLIER = activeExamConfig.provider === 'dele' ? 1 : 3;

interface WritingResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: WritingAssessment | null;
  isUsingCachedResult: boolean;
  exam: WritingExam;
}

const WritingResultsModal: React.FC<WritingResultsModalProps> = ({
  isOpen,
  onClose,
  assessment,
  isUsingCachedResult,
  exam,
}) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isUserInputExpanded, setIsUserInputExpanded] = React.useState(false);
  const [isModalAnswerExpanded, setIsModalAnswerExpanded] = React.useState(false);

  // Reset expanded states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsUserInputExpanded(false);
      setIsModalAnswerExpanded(false);
    }
  }, [isOpen]);

  if (!assessment) return null;

  const getGradeStyle = (grade: 'A' | 'B' | 'C' | 'D') => {
    switch (grade) {
      case 'A':
        return styles.criterionGreen;
      case 'B':
        return styles.criterionYellow;
      case 'C':
      case 'D':
        return styles.criterionRed;
      default:
        return styles.criterionYellow;
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {t('writing.evaluation.title')}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Icon name="close" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {isUsingCachedResult && (
                <View style={styles.cacheInfo}>
                  <Text style={styles.cacheInfoText}>
                    {t('writing.mock.cacheInfo')}
                  </Text>
                </View>
              )}

              <View style={styles.scoreSection}>
                <Text style={styles.scoreLabel}>{t('writing.evaluation.totalScore')}</Text>
                <Text style={styles.scoreValue}>
                  {assessment.overallScore * SCORE_MULTIPLIER} / {assessment.maxScore * SCORE_MULTIPLIER}
                </Text>
              </View>

              <View style={styles.criteriaSection}>
                <Text style={styles.criteriaTitle}>{t('writing.evaluation.criteriaTitle')}</Text>

                <View style={[styles.criterionCard, getGradeStyle(assessment.criteria.taskCompletion.grade)]}>
                  <View style={styles.criterionHeader}>
                    <Text style={styles.criterionName}>{t('writing.evaluation.criteria.taskCompletion')}</Text>
                    <Text style={styles.criterionGrade}>{t('writing.evaluation.grade')} {assessment.criteria.taskCompletion.grade}</Text>
                  </View>
                  <Text style={styles.criterionFeedback}>{assessment.criteria.taskCompletion.feedback}</Text>
                </View>

                <View style={[styles.criterionCard, getGradeStyle(assessment.criteria.communicativeDesign.grade)]}>
                  <View style={styles.criterionHeader}>
                    <Text style={styles.criterionName}>{t('writing.evaluation.criteria.communicativeDesign')}</Text>
                    <Text style={styles.criterionGrade}>{t('writing.evaluation.grade')} {assessment.criteria.communicativeDesign.grade}</Text>
                  </View>
                  <Text style={styles.criterionFeedback}>{assessment.criteria.communicativeDesign.feedback}</Text>
                </View>

                <View style={[styles.criterionCard, getGradeStyle(assessment.criteria.formalCorrectness.grade)]}>
                  <View style={styles.criterionHeader}>
                    <Text style={styles.criterionName}>{t('writing.evaluation.criteria.formalCorrectness')}</Text>
                    <Text style={styles.criterionGrade}>{t('writing.evaluation.grade')} {assessment.criteria.formalCorrectness.grade}</Text>
                  </View>
                  <Text style={styles.criterionFeedback}>{assessment.criteria.formalCorrectness.feedback}</Text>
                </View>
              </View>

              <View style={styles.userInputSection}>
                <TouchableOpacity 
                  style={styles.userInputHeader}
                  onPress={() => setIsUserInputExpanded(!isUserInputExpanded)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.userInputTitle}>{t('writing.evaluation.userInput')}</Text>
                  <Text style={styles.expandIcon}>{isUserInputExpanded ? '▼' : '▶'}</Text>
                </TouchableOpacity>
                {isUserInputExpanded && (
                  assessment.userInput ?
                    <Text style={styles.userInputText}>{assessment.userInput}</Text> :
                    <Text style={styles.userInputText}>{t('writing.evaluation.noUserInput')}</Text>
                )}
              </View>

              {/* Modal Answer Section - Only show if modalAnswer exists in exam data */}
              {exam.modalAnswer && (
                <View style={styles.modalAnswerSection}>
                  <TouchableOpacity 
                    style={styles.modalAnswerHeader}
                    onPress={() => setIsModalAnswerExpanded(!isModalAnswerExpanded)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalAnswerTitleContainer}>
                      <Text style={styles.modalAnswerIcon}>⭐</Text>
                      <Text style={styles.modalAnswerTitle}>{t('writing.evaluation.modelAnswer')}</Text>
                    </View>
                    <Text style={styles.expandIcon}>{isModalAnswerExpanded ? '▼' : '▶'}</Text>
                  </TouchableOpacity>
                  {isModalAnswerExpanded && (
                    <Text style={styles.modalAnswerText}>{exam.modalAnswer}</Text>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={onClose}
              >
                <Text style={styles.closeModalButtonText}>{t('writing.evaluation.closeButton')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: spacing.borderRadius.xl,
    borderTopRightRadius: spacing.borderRadius.xl,
    maxHeight: '85%',
    width: '100%',
    overflow: 'hidden',
  },
  scrollView: {
    flexGrow: 0,
  },
  contentContainer: {
    paddingBottom: spacing.padding.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.secondary,
  },
  title: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  cacheInfo: {
    backgroundColor: colors.primary[50],
    padding: spacing.padding.sm,
    borderRadius: spacing.borderRadius.sm,
    marginHorizontal: spacing.margin.md,
    marginTop: spacing.margin.md,
    marginBottom: spacing.margin.sm,
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  cacheInfoText: {
    ...typography.textStyles.bodySmall,
    color: colors.primary[700],
    textAlign: 'center',
  },
  scoreSection: {
    backgroundColor: colors.primary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginHorizontal: spacing.margin.md,
    marginTop: spacing.margin.md,
    marginBottom: spacing.margin.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    ...typography.textStyles.h5,
    color: colors.text.primary,
  },
  scoreValue: {
    ...typography.textStyles.h5,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },
  criteriaSection: {
    paddingHorizontal: spacing.padding.md,
    paddingVertical: spacing.padding.sm,
  },
  criteriaTitle: {
    ...typography.textStyles.h5,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  criterionCard: {
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    borderLeftWidth: 4,
  },
  criterionGreen: {
    backgroundColor: colors.success[50],
    borderLeftColor: colors.success[500],
  },
  criterionYellow: {
    backgroundColor: colors.warning[50],
    borderLeftColor: colors.warning[500],
  },
  criterionRed: {
    backgroundColor: colors.error[50],
    borderLeftColor: colors.error[500],
  },
  criterionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.margin.sm,
  },
  criterionName: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  criterionGrade: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  criterionFeedback: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  userInputSection: {
    backgroundColor: colors.background.tertiary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginHorizontal: spacing.margin.md,
    marginBottom: spacing.margin.md,
  },
  userInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInputTitle: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  expandIcon: {
    fontSize: 16,
    color: colors.text.secondary,
    marginLeft: spacing.margin.sm,
  },
  userInputText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
    marginTop: spacing.margin.sm,
  },
  modalAnswerSection: {
    backgroundColor: colors.success[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginHorizontal: spacing.margin.md,
    marginBottom: spacing.margin.md,
    borderWidth: 1,
    borderColor: colors.success[200],
  },
  modalAnswerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalAnswerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalAnswerIcon: {
    fontSize: 18,
    marginRight: spacing.margin.xs,
  },
  modalAnswerTitle: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.success[700],
    flex: 1,
  },
  modalAnswerText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
    marginTop: spacing.margin.sm,
  },
  closeModalButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    marginHorizontal: spacing.margin.md,
    marginTop: spacing.margin.sm,
    marginBottom: spacing.margin.md,
  },
  closeModalButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.secondary,
  },
});

export default WritingResultsModal;
