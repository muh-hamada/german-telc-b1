import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import SocialLoginButton from './SocialLoginButton';
import EmailLoginForm from './EmailLoginForm';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const {
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
    signInWithEmail,
    createAccountWithEmail,
    sendPasswordResetEmail,
    isLoading,
    error,
    clearError,
  } = useAuth();

  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      clearError();
      
      switch (provider) {
        case 'google':
          await signInWithGoogle();
          break;
        case 'facebook':
          await signInWithFacebook();
          break;
        case 'apple':
          await signInWithApple();
          break;
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const handleCreateAccount = async (email: string, password: string, displayName?: string) => {
    try {
      await createAccountWithEmail(email, password, displayName);
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(email);
      Alert.alert(
        'Password Reset',
        'A password reset email has been sent to your email address.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const handleClose = () => {
    clearError();
    setShowEmailForm(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {showEmailForm ? 'Sign In / Create Account' : 'Welcome Back'}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Content */}
            <View style={styles.content}>
              {showEmailForm ? (
                <EmailLoginForm
                  onSignIn={handleEmailSignIn}
                  onCreateAccount={handleCreateAccount}
                  onForgotPassword={handleForgotPassword}
                  loading={isLoading}
                />
              ) : (
                <>
                  <Text style={styles.subtitle}>
                    Sign in to save your progress and sync across devices
                  </Text>

                  <View style={styles.socialButtons}>
                    <SocialLoginButton
                      provider="google"
                      onPress={() => handleSocialLogin('google')}
                      loading={isLoading}
                    />
                    
                    <SocialLoginButton
                      provider="facebook"
                      onPress={() => handleSocialLogin('facebook')}
                      loading={isLoading}
                    />
                    
                    <SocialLoginButton
                      provider="apple"
                      onPress={() => handleSocialLogin('apple')}
                      loading={isLoading}
                    />
                  </View>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity
                    style={styles.emailButton}
                    onPress={() => setShowEmailForm(true)}
                  >
                    <Text style={styles.emailButtonText}>
                      Continue with Email
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {showEmailForm && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setShowEmailForm(false)}
                >
                  <Text style={styles.backButtonText}>
                    ← Back to social login
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
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
    padding: spacing.padding.lg,
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadius.xl,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 400,
  },
  scrollView: {
    maxHeight: '100%',
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
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  errorContainer: {
    backgroundColor: colors.error[50],
    margin: spacing.margin.lg,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.error[500],
  },
  errorText: {
    ...typography.textStyles.body,
    color: colors.error[700],
  },
  content: {
    padding: spacing.padding.lg,
  },
  subtitle: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.margin.xl,
    lineHeight: 24,
  },
  socialButtons: {
    marginBottom: spacing.margin.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.margin.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.tertiary,
    marginHorizontal: spacing.margin.md,
  },
  emailButton: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  emailButtonText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  backButton: {
    alignSelf: 'center',
    marginTop: spacing.margin.lg,
  },
  backButtonText: {
    ...typography.textStyles.bodySmall,
    color: colors.primary[500],
    textDecorationLine: 'underline',
  },
});

export default LoginModal;
