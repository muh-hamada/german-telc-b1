import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';
import Button from './Button';

interface ListeningCompletionModalProps {
  visible: boolean;
  score: number;
  totalQuestions: number;
  onListenAgain: () => void;
  onBackToHome: () => void;
}

const ListeningCompletionModal: React.FC<ListeningCompletionModalProps> = ({
  visible,
  score,
  totalQuestions,
  onListenAgain,
  onBackToHome,
}) => {
  const { t } = useCustomTranslation();
  
  const percentage = (score / totalQuestions) * 100;

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 80) return colors.success[500];
    if (percentage >= 60) return colors.warning[500];
    return colors.error[500];
  };

  const getScoreEmoji = (percentage: number): string => {
    if (percentage >= 80) return '🎉';
    if (percentage >= 60) return '👍';
    if (percentage >= 40) return '📚';
    return '😞';
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onBackToHome}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
            <View style={styles.content}>
                <Text style={styles.title}>{t('practice.listening.practice.completed')}</Text>
                
                <View style={styles.scoreContainer}>
                    <Text style={styles.emoji}>{getScoreEmoji(percentage)}</Text>
                    <Text style={[styles.scoreText, { color: getScoreColor(percentage) }]}>
                        {t('practice.listening.practice.score', { score, total: totalQuestions })}
                    </Text>
                </View>

                <View style={styles.buttonContainer}>
                    <Button
                        title={t('practice.listening.practice.listenAgain')}
                        onPress={onListenAgain}
                        variant="outline"
                        style={styles.button}
                        textStyle={styles.buttonText}
                    />
                    <Button
                        title={t('practice.listening.practice.backToHome')}
                        onPress={onBackToHome}
                        variant="primary"
                        size='small'
                        style={styles.button}
                        textStyle={styles.buttonText}
                    />
                </View>
            </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  scoreText: {
    ...typography.textStyles.h5,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
  },
});

export default ListeningCompletionModal;

