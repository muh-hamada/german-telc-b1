/**
 * Ad-Free Gift Modal
 * 
 * Two-state modal for the ad-free day loyalty gift:
 * 1. Gift state: Thanks user and offers to claim 1 ad-free day
 * 2. Review state: Asks user to write a review after claiming
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AdFreeGiftModalProps {
  visible: boolean;
  onClaim: () => Promise<boolean>;
  onWriteReview: () => void;
  onMaybeLater: () => void;
  onClose: () => void;
}

enum ModalState {
  GIFT = 'gift',
  CLAIMED = 'claimed',
  REVIEW = 'review',
}

const CLAIMED_DURATION_MS = 5000; // Show success message for 2 seconds

const AdFreeGiftModal: React.FC<AdFreeGiftModalProps> = ({
  visible,
  onClaim,
  onWriteReview,
  onMaybeLater,
  onClose,
}) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [state, setState] = useState<ModalState>(ModalState.GIFT);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const confettiRef = useRef<any>(null);

  // Reset state when modal becomes visible
  useEffect(() => {
    if (visible) {
      setState(ModalState.GIFT);
      setIsClaiming(false);
    }
  }, [visible]);

  const handleClaim = async () => {
    // Check if user is logged in
    if (!user) {
      console.log('[AdFreeGiftModal] No user, showing login modal');
      setShowLoginModal(true);
      return;
    }

    console.log('[AdFreeGiftModal] User found, claiming reward. User ID:', user.uid);

    setIsClaiming(true);
    const success = await onClaim();
    setIsClaiming(false);

    console.log('[AdFreeGiftModal] Claim result:', success);

    if (success) {
      setState(ModalState.CLAIMED);

      // Trigger confetti animation
      if (confettiRef.current) {
        confettiRef.current.start();
      }

      // After showing success, transition to review state
      setTimeout(() => {
        setState(ModalState.REVIEW);
      }, CLAIMED_DURATION_MS);
    }
  };

  const handleWriteReview = () => {
    onWriteReview();
    onClose();
  };

  const handleMaybeLater = () => {
    onMaybeLater();
    onClose();
  };

  const handleBackdropPress = () => {
    // Only allow closing in gift state, not during claim or review
    if (state === ModalState.GIFT && !isClaiming) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleBackdropPress}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handleBar} />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* GIFT STATE */}
            {state === ModalState.GIFT && (
              <View style={styles.content}>
                {/* Thank you message */}
                <View style={styles.headerSection}>
                  <Text style={styles.title}>
                    {t('adFreeGift.congratulations')}
                  </Text>
                  <Text style={styles.subtitle}>
                    {t('adFreeGift.youEarned')}
                  </Text>
                  <Text style={styles.emoji}>🎁</Text>
                </View>

                {/* Reward card */}
                <View style={styles.rewardCard}>
                  <Text style={styles.rewardTitle}>
                    {t('adFreeGift.rewardTitle')}
                  </Text>
                  <Text style={styles.description}>
                    {t('adFreeGift.rewardDescription')}
                  </Text>
                </View>

                {/* Claim button */}
                <TouchableOpacity
                  style={[styles.primaryButton, isClaiming && styles.buttonDisabled]}
                  onPress={handleClaim}
                  disabled={isClaiming}
                  activeOpacity={0.8}
                >
                  {isClaiming ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {t('adFreeGift.claimButton')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* CLAIMED STATE */}
            {state === ModalState.CLAIMED && (
              <View style={styles.content}>
                <View style={styles.successContainer}>
                  <Text style={styles.successEmoji}>✨</Text>
                  <Text style={styles.successTitle}>
                    {t('adFreeGift.claimed')}
                  </Text>
                  <Text style={styles.successMessage}>
                    {t('adFreeGift.claimedMessage')}
                  </Text>
                </View>
              </View>
            )}

            {/* REVIEW STATE */}
            {state === ModalState.REVIEW && (
              <View style={styles.content}>
                {/* Review request */}
                <View style={styles.headerSection}>
                  <Text style={styles.title}>
                    {t('adFreeGift.reviewTitle')}
                  </Text>
                  <Text style={[styles.emoji, styles.starEmoji]}>⭐⭐⭐⭐⭐</Text>
                  <Text style={[styles.description, styles.reviewMessage]}>
                    {t('adFreeGift.reviewMessage')}
                  </Text>
                </View>

                {/* Write review button */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleWriteReview}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>
                    {t('adFreeGift.writeReviewButton')}
                  </Text>
                </TouchableOpacity>

                {/* Maybe later button */}
                <TouchableOpacity
                  style={styles.laterButton}
                  onPress={handleMaybeLater}
                  activeOpacity={0.7}
                >
                  <Text style={styles.laterButtonText}>
                    {t('adFreeGift.maybeLaterButton')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </TouchableOpacity>

        {/* Confetti Animation */}
        {state === ModalState.CLAIMED && (
          <ConfettiCannon
            ref={confettiRef}
            count={150}
            origin={{ x: Dimensions.get('window').width / 2, y: 0 }}
            autoStart={false}
            fadeOut={true}
          />
        )}
      </TouchableOpacity>

      {/* Login Modal */}
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          // After successful login, automatically trigger claim
          handleClaim();
        }}
      />
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.background.primary,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: SCREEN_HEIGHT * 0.85,
      minHeight: 200, // Ensure minimum height so modal is visible
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 10,
    },
    handleBar: {
      width: 40,
      height: 4,
      backgroundColor: colors.text.tertiary,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: spacing.margin.md,
      marginBottom: spacing.margin.sm,
    },
    scrollView: {
      flexGrow: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 20, // Add padding to ensure content is visible
    },
    content: {
      padding: spacing.padding.xl,
      paddingBottom: spacing.padding['2xl'],
    },

    // Header section
    headerSection: {
      alignItems: 'center',
      marginBottom: spacing.margin.sm,
    },
    emoji: {
      marginTop: spacing.margin.sm,
      fontSize: 164,
    },
    starEmoji: {
      fontSize: 48,
      marginBottom: spacing.margin.sm,
    },
    title: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: spacing.margin.sm,
    },
    subtitle: {
      fontSize: typography.fontSize['2xl'],
      textAlign: 'center',
      // marginTop: spacing.margin.sm,
    },

    // Reward card
    rewardCard: {
      marginBottom: spacing.margin.xl,
    },
    rewardTitle: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
      color: colors.black,
      textAlign: 'center',
      marginBottom: spacing.margin.md,
    },
    description: {
      fontSize: typography.fontSize.base,
      textAlign: 'center',
      color: colors.black,
      lineHeight: 22,
      paddingHorizontal: spacing.padding.md,
    },

    reviewMessage: {
      marginVertical: spacing.margin.md,
    },

    // Success state
    successContainer: {
      alignItems: 'center',
      paddingVertical: spacing.padding['2xl'],
    },
    successEmoji: {
      fontSize: 72,
      marginBottom: spacing.margin.lg,
    },
    successTitle: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
      color: colors.success[600],
      textAlign: 'center',
      marginBottom: spacing.margin.md,
    },
    successMessage: {
      fontSize: typography.fontSize.base,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 22,
    },

    // Buttons
    primaryButton: {
      backgroundColor: colors.primary[500],
      borderRadius: 12,
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      color: colors.white,
    },
    laterButton: {
      marginTop: spacing.margin.md,
      paddingVertical: spacing.padding.sm,
      alignItems: 'center',
    },
    laterButtonText: {
      fontSize: typography.fontSize.sm,
      color: colors.text.tertiary,
    },
  });

export default AdFreeGiftModal;
