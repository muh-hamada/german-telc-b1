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
import {
  WritingAssessmentResult,
  isGradedAssessment,
  isPointBasedAssessment,
} from '../../services/http.openai.service';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface WritingResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: WritingAssessmentResult | null;
  isUsingCachedResult: boolean;
  modalAnswer?: string;
  /** Multiplier applied to displayed scores (default: 1). Used for B1/B2 Telc where raw 15 → 45. */
  scoreMultiplier?: number;
}

const WritingResultsModal: React.FC<WritingResultsModalProps> = ({
  isOpen,
  onClose,
  assessment,
  isUsingCachedResult,
  modalAnswer,
  scoreMultiplier = 1,
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

  // Determine the effective multiplier: only apply for graded (B1/B2) assessments
  const effectiveMultiplier = isGradedAssessment(assessment) ? scoreMultiplier : 1;
  const displayScore = assessment.overallScore * effectiveMultiplier;
  const displayMaxScore = assessment.maxScore * effectiveMultiplier;

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

  // --- B1/B2 criteria rendering (grade-based) ---
  const renderGradedCriteria = () => {
    if (!isGradedAssessment(assessment)) return null;
    return (
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
    );
  };

  // --- A1/A2 criteria rendering (content-points based) ---
  const renderPointBasedCriteria = () => {
    if (!isPointBasedAssessment(assessment)) return null;
    return (
      <>
        {/* Content Points Results */}
        {assessment.contentPoints && assessment.contentPoints.length > 0 && (
          <View style={styles.contentPointsContainer}>
            <Text style={styles.contentPointsTitle}>
              {t('practice.writing.taskPoints')}
            </Text>
            {assessment.contentPoints.map((point, index) => (
              <View key={index} style={styles.contentPointItem}>
                <View style={styles.contentPointItemHeader}>
                  <View style={[
                    styles.contentPointNumber,
                    point.score === 3 ? styles.contentPointCorrect :
                      point.score >= 1.5 ? styles.contentPointPartial :
                        styles.contentPointIncorrect,
                  ]}>
                    <Text style={styles.contentPointNumberText}>{point.pointNumber}</Text>
                  </View>
                  <Text style={styles.contentPointText}>
                    {point.pointText}
                  </Text>
                  <Text style={styles.contentPointScore}>
                    {point.score}/3
                  </Text>
                </View>
                <Text style={styles.contentPointFeedback}>
                  {point.feedback}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Communicative Design */}
        {assessment.communicativeDesign && (
          <View style={styles.communicativeDesignSection}>
            <Text style={styles.communicativeDesignTitle}>
              {t('practice.writing.communicativeDesign')}
            </Text>
            <View style={styles.communicativeDesignCard}>
              <View style={styles.communicativeDesignHeader}>
                <Text style={styles.communicativeDesignScore}>
                  {assessment.communicativeDesign.score}/1
                </Text>
              </View>
              <Text style={styles.communicativeDesignFeedback}>
                {assessment.communicativeDesign.feedback}
              </Text>
            </View>
          </View>
        )}
      </>
    );
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
                  {displayScore} / {displayMaxScore}
                </Text>
              </View>

              {/* Render criteria based on assessment type */}
              {renderGradedCriteria()}
              {renderPointBasedCriteria()}

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

              {/* Modal Answer Section - Only show if modalAnswer exists */}
              {modalAnswer && (
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
                    <Text style={styles.modalAnswerText}>{modalAnswer}</Text>
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

  // --- B1/B2 grade-based criteria styles ---
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

  // --- A1/A2 content-points based styles ---
  contentPointsContainer: {
    paddingHorizontal: spacing.padding.md,
    paddingVertical: spacing.padding.sm,
  },
  contentPointsTitle: {
    ...typography.textStyles.h5,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  contentPointItem: {
    backgroundColor: colors.background.primary,
    padding: spacing.padding.sm,
    borderRadius: spacing.borderRadius.sm,
    marginBottom: spacing.margin.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  contentPointItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.margin.xs,
    marginBottom: spacing.margin.xs,
  },
  contentPointNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentPointCorrect: {
    backgroundColor: colors.success[500],
  },
  contentPointPartial: {
    backgroundColor: colors.warning[500],
  },
  contentPointIncorrect: {
    backgroundColor: colors.error[500],
  },
  contentPointNumberText: {
    ...typography.textStyles.bodySmall,
    fontSize: 11,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  contentPointText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'left',
  },
  contentPointScore: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
  },
  contentPointFeedback: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    marginLeft: 30,
    textAlign: 'left',
    fontStyle: 'italic',
  },
  communicativeDesignSection: {
    paddingHorizontal: spacing.padding.md,
    paddingVertical: spacing.padding.sm,
    marginBottom: spacing.margin.sm,
  },
  communicativeDesignTitle: {
    ...typography.textStyles.h5,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  communicativeDesignCard: {
    backgroundColor: colors.background.primary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  communicativeDesignHeader: {
    marginBottom: spacing.margin.xs,
  },
  communicativeDesignScore: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
  },
  communicativeDesignFeedback: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'left',
    fontStyle: 'italic',
  },

  // --- Shared styles ---
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
