import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import LoginModal from './LoginModal';

interface LoginPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
  visible,
  onClose,
  onLoginSuccess,
}) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const { hasUnsyncedProgress } = useProgress();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);

  useEffect(() => {
    const checkProgress = async () => {
      if (visible && !user) {
        const unsynced = await hasUnsyncedProgress();
        setHasProgress(unsynced);
      }
    };
    checkProgress();
  }, [visible, user, hasUnsyncedProgress]);

  const handleLoginPress = () => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    onLoginSuccess?.();
    onClose();
  };

  const handleContinueWithoutLogin = () => {
    Alert.alert(
      'Continue Without Login',
      'Your progress will only be saved locally on this device. You won\'t be able to access it from other devices or if you reinstall the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            onClose();
          },
        },
      ]
    );
  };

  const handleDismiss = () => {
    Alert.alert(
      'Dismiss Login Prompt',
      'You can always sign in later from the Profile screen to save your progress.',
      [
        { text: 'OK', onPress: onClose },
      ]
    );
  };

  if (!visible || user) {
    return null;
  }

  return (
    <>
      <Modal
        visible={visible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleDismiss}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>Save Your Progress</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>📚</Text>
              </View>

              <Text style={styles.subtitle}>
                {hasProgress 
                  ? 'You have unsaved progress!'
                  : 'Sign in to save your progress'
                }
              </Text>

              <Text style={styles.description}>
                {hasProgress
                  ? 'You have completed some exercises. Sign in to save your progress and access it from any device.'
                  : 'Sign in to save your learning progress and access it from any device. Your progress will be safely stored in the cloud.'
                }
              </Text>

              <View style={styles.benefitsContainer}>
                <Text style={styles.benefitsTitle}>Benefits of signing in:</Text>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>☁️</Text>
                  <Text style={styles.benefitText}>Cloud backup of your progress</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>📱</Text>
                  <Text style={styles.benefitText}>Access from multiple devices</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>📊</Text>
                  <Text style={styles.benefitText}>Detailed progress statistics</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>🔄</Text>
                  <Text style={styles.benefitText}>Automatic progress sync</Text>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLoginPress}
                >
                  <Text style={styles.loginButtonText}>Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleContinueWithoutLogin}
                >
                  <Text style={styles.continueButtonText}>
                    Continue Without Signing In
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.padding.lg,
    },
    modalContainer: {
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.xl,
      maxHeight: '90%',
      width: '100%',
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
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
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.secondary[100],
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: 18,
      color: colors.text.secondary,
    },
    content: {
      padding: spacing.padding.lg,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: spacing.margin.lg,
    },
    icon: {
      fontSize: 48,
    },
    subtitle: {
      ...typography.textStyles.h4,
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: spacing.margin.md,
    },
    description: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: spacing.margin.lg,
    },
    benefitsContainer: {
      backgroundColor: colors.background.primary,
      borderRadius: spacing.borderRadius.md,
      padding: spacing.padding.md,
      marginBottom: spacing.margin.lg,
    },
    benefitsTitle: {
      ...typography.textStyles.body,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      marginBottom: spacing.margin.sm,
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.margin.xs,
    },
    benefitIcon: {
      fontSize: 16,
      marginRight: spacing.margin.sm,
      width: 20,
    },
    benefitText: {
      ...typography.textStyles.bodySmall,
      color: colors.text.secondary,
      flex: 1,
    },
    buttonContainer: {
      gap: spacing.margin.sm,
    },
    loginButton: {
      backgroundColor: colors.primary[500],
      borderRadius: spacing.borderRadius.lg,
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      alignItems: 'center',
    },
    loginButtonText: {
      ...typography.textStyles.body,
      color: colors.text.inverse,
      fontWeight: typography.fontWeight.semibold,
    },
    continueButton: {
      backgroundColor: 'transparent',
      borderRadius: spacing.borderRadius.lg,
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    continueButtonText: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      fontWeight: typography.fontWeight.medium,
    },
  });

export default LoginPromptModal;
