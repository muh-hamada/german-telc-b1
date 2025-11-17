import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';
import { REWARD_MODAL_SUCCESS_DURATION } from '../constants/streak.constants';

interface StreakRewardModalProps {
  visible: boolean;
  currentStreak: number;
  onClaim: () => Promise<boolean>;
  onClose: () => void;
}

const StreakRewardModal: React.FC<StreakRewardModalProps> = ({
  visible,
  currentStreak,
  onClaim,
  onClose,
}) => {
  const { t } = useCustomTranslation();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const handleClaim = async () => {
    setIsClaiming(true);
    const success = await onClaim();
    setIsClaiming(false);
    
    if (success) {
      setClaimed(true);
    }
  };

  // Auto-close effect when claimed
  useEffect(() => {
    if (claimed) {
      const timer = setTimeout(() => {
        setClaimed(false);
        onClose();
      }, REWARD_MODAL_SUCCESS_DURATION);
      
      return () => clearTimeout(timer);
    }
  }, [claimed, onClose]);

  const handleClose = () => {
    if (!isClaiming) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {!claimed ? (
              <>
                {/* Celebration icon */}
                <View style={styles.iconContainer}>
                  <Text style={styles.celebrationIcon}>🎉</Text>
                </View>
                
                {/* Title */}
                <Text style={styles.title}>
                  {t('streaks.reward.title')}
                </Text>

                {/* Streak achieved */}
                <View style={styles.streakBadge}>
                  <Text style={styles.fireIcon}>🔥</Text>
                  <Text style={styles.streakText}>{currentStreak} {t('streaks.days')}</Text>
                </View>

                {/* Reward description */}
                <View style={styles.rewardCard}>
                  <Text style={styles.rewardIcon}>🚀</Text>
                  <Text style={styles.rewardTitle}>
                    {t('streaks.reward.adFreeTitle')}
                  </Text>
                  <Text style={styles.rewardDescription}>
                    {t('streaks.reward.description')}
                  </Text>
                </View>

                {/* Note about streak reset */}
                <View style={styles.noteCard}>
                  <Text style={styles.noteText}>
                    {t('streaks.reward.streakResetNote')}
                  </Text>
                </View>

                {/* Claim button */}
                <TouchableOpacity
                  style={[styles.claimButton, isClaiming && styles.claimButtonDisabled]}
                  onPress={handleClaim}
                  disabled={isClaiming}
                >
                  {isClaiming ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.claimButtonText}>
                      {t('streaks.reward.claim')}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Later button */}
                {!isClaiming && (
                  <TouchableOpacity
                    style={styles.laterButton}
                    onPress={handleClose}
                  >
                    <Text style={styles.laterButtonText}>
                      {t('common.later')}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                {/* Success state */}
                <View style={styles.successContainer}>
                  <Text style={styles.successIcon}>✨</Text>
                  <Text style={styles.successTitle}>
                    {t('streaks.reward.activated')}
                  </Text>
                  <Text style={styles.successMessage}>
                    {t('streaks.reward.enjoyAdFree')}
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.padding.lg,
  },
  modalContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: spacing.borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...spacing.shadow.lg,
  },
  scrollContent: {
    padding: spacing.padding.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.margin.md,
  },
  celebrationIcon: {
    fontSize: 80,
  },
  title: {
    ...typography.textStyles.h2,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.lg,
    textAlign: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[100],
    paddingHorizontal: spacing.padding.lg,
    paddingVertical: spacing.padding.md,
    borderRadius: spacing.borderRadius.full,
    marginBottom: spacing.margin.xl,
  },
  fireIcon: {
    fontSize: 32,
    marginRight: spacing.margin.sm,
  },
  streakText: {
    ...typography.textStyles.h3,
    color: colors.warning[700],
    fontWeight: typography.fontWeight.bold,
  },
  rewardCard: {
    backgroundColor: colors.success[50],
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.margin.lg,
    borderWidth: 2,
    borderColor: colors.success[200],
  },
  rewardIcon: {
    fontSize: 48,
    marginBottom: spacing.margin.sm,
  },
  rewardTitle: {
    ...typography.textStyles.h4,
    color: colors.success[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.xs,
    textAlign: 'center',
  },
  rewardDescription: {
    ...typography.textStyles.body,
    color: colors.success[600],
    textAlign: 'center',
    lineHeight: 22,
  },
  noteCard: {
    backgroundColor: colors.secondary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    width: '100%',
    marginBottom: spacing.margin.lg,
  },
  noteText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  claimButton: {
    backgroundColor: colors.success[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.xl,
    borderRadius: spacing.borderRadius.lg,
    width: '100%',
    alignItems: 'center',
    ...spacing.shadow.md,
    marginBottom: spacing.margin.sm,
  },
  claimButtonDisabled: {
    opacity: 0.7,
  },
  claimButtonText: {
    ...typography.textStyles.body,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
    fontSize: 16,
  },
  laterButton: {
    paddingVertical: spacing.padding.sm,
    paddingHorizontal: spacing.padding.md,
  },
  laterButtonText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing.padding.xl,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: spacing.margin.md,
  },
  successTitle: {
    ...typography.textStyles.h2,
    color: colors.success[600],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.sm,
    textAlign: 'center',
  },
  successMessage: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default StreakRewardModal;

