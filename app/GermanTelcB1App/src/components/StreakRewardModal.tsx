import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';
import { REWARD_MODAL_SUCCESS_DURATION, calculateRewardDays } from '../constants/streak.constants';

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

  // Calculate the reward days based on current streak
  const rewardDays = calculateRewardDays(currentStreak);

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
                  <Text style={styles.streakText}>{t('streaks.reward.title', { days: currentStreak })}</Text>
                </View>

                {/* Reward description */}
                <View style={styles.rewardCard}>
                  <Text style={styles.rewardIcon}>🎁</Text>
                  <Text style={styles.rewardDescription}>
                    {t('streaks.reward.description', { days: rewardDays })}
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
                    {t('streaks.reward.activated', { days: rewardDays })}
                  </Text>
                  <Text style={styles.successMessage}>
                    {t('streaks.reward.enjoyAdFree', { days: rewardDays })}
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
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: spacing.margin.md,
  },
  celebrationIcon: {
    fontSize: 80,
  },
  streakText: {
    ...typography.textStyles.h3,
    color: colors.warning[700],
    fontWeight: typography.fontWeight.bold,
  },
  rewardCard: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.success[50],
    borderRadius: spacing.borderRadius.lg,
    width: '100%',
    marginBottom: spacing.margin.lg,
    borderWidth: 2,
    borderColor: colors.success[100],
    gap: spacing.md,
    paddingHorizontal: spacing.padding.md,
    paddingVertical: spacing.padding.md,
    flex: 1,
    flexShrink: 1,
  },
  rewardIcon: {
    fontSize: 28,
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
    ...typography.textStyles.h5,
    color: colors.success[600],
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    flexShrink: 1,
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

