import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';

interface GrammarStudyProgressModalProps {
  visible: boolean;
  currentProgress: number;
  totalQuestions: number;
  onContinue: () => void;
  onStartOver: () => void;
  onClose: () => void;
}

const GrammarStudyProgressModal: React.FC<GrammarStudyProgressModalProps> = ({
  visible,
  currentProgress,
  totalQuestions,
  onContinue,
  onStartOver,
  onClose,
}) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleStartOver = () => {
    Alert.alert(
      t('practice.grammar.study.confirmRestart'),
      t('practice.grammar.study.restartWarning'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('practice.grammar.study.restart'),
          style: 'destructive',
          onPress: onStartOver,
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>
            {t('practice.grammar.study.progressFound')}
          </Text>
          
          <Text style={styles.message}>
            {t('practice.grammar.study.progressMessage', {
              current: currentProgress + 1,
              total: totalQuestions,
            })}
          </Text>

          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {t('practice.grammar.study.currentProgress')}: {currentProgress + 1}/{totalQuestions}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.continueButton]}
              onPress={onContinue}
            >
              <Text style={[styles.buttonText, styles.continueButtonText]}>
                {t('practice.grammar.study.continue')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.restartButton]}
              onPress={handleStartOver}
            >
              <Text style={[styles.buttonText, styles.restartButtonText]}>
                {t('practice.grammar.study.startOver')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.padding.lg,
    },
    modalContainer: {
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.padding.xl,
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
    title: {
      ...typography.textStyles.h3,
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: spacing.margin.md,
    },
    message: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: spacing.margin.lg,
    },
    progressInfo: {
      backgroundColor: colors.primary[50],
      padding: spacing.padding.md,
      borderRadius: spacing.borderRadius.md,
      marginBottom: spacing.margin.lg,
      alignSelf: 'stretch',
    },
    progressText: {
      ...typography.textStyles.body,
      color: colors.primary[700],
      textAlign: 'center',
      fontWeight: typography.fontWeight.semibold,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: spacing.margin.md,
      alignSelf: 'stretch',
    },
    button: {
      flex: 1,
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      borderRadius: spacing.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    continueButton: {
      backgroundColor: colors.primary[500],
    },
    restartButton: {
      backgroundColor: colors.background.primary,
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    buttonText: {
      ...typography.textStyles.body,
      fontWeight: typography.fontWeight.semibold,
      textAlign: 'center',
    },
    continueButtonText: {
      color: colors.text.inverse,
    },
    restartButtonText: {
      color: colors.text.primary,
    },
  });

export default GrammarStudyProgressModal;