import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  I18nManager,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';
import Button from './Button';

interface EmailLoginFormProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onCreateAccount: (email: string, password: string, displayName?: string) => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
  loading?: boolean;
}

const EmailLoginForm: React.FC<EmailLoginFormProps> = ({
  onSignIn,
  onCreateAccount,
  onForgotPassword,
  loading = false,
}) => {
  const { t } = useCustomTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('common.alerts.fillRequiredFields'));
      return;
    }

    if (isSignUp) {
      if (!displayName.trim()) {
        Alert.alert(t('common.error'), t('common.alerts.enterName'));
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert(t('common.error'), t('common.alerts.passwordsNoMatch'));
        return;
      }
      if (password.length < 6) {
        Alert.alert(t('common.error'), t('common.alerts.passwordTooShort'));
        return;
      }
      await onCreateAccount(email.trim(), password, displayName.trim());
    } else {
      await onSignIn(email.trim(), password);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('common.alerts.enterEmailFirst'));
      return;
    }
    await onForgotPassword(email.trim());
  };

  return (
    <View style={styles.container}>
      {isSignUp && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('common.labels.name')}</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t('common.placeholders.enterName')}
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('common.labels.email')}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder={t('common.placeholders.enterEmail')}
          placeholderTextColor={colors.text.tertiary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('common.labels.password')}</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder={t('common.placeholders.enterPassword')}
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {isSignUp && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('common.labels.confirmPassword')}</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t('common.placeholders.confirmPassword')}
            placeholderTextColor={colors.text.tertiary}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )}

      <Button
        title={isSignUp ? t('auth.createAccount') : t('auth.signIn')}
        onPress={handleSubmit}
        loading={loading}
        style={styles.submitButton}
      />

      {!isSignUp && (
        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
          <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => setIsSignUp(!isSignUp)}
        style={styles.switchButton}
      >
        <Text style={styles.switchText}>
          {isSignUp
            ? t('auth.alreadyHaveAccount')
            : t('auth.noAccount')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.margin.xl,
  },
  inputContainer: {
    marginBottom: spacing.margin.lg,
  },
  label: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'left',
  },
  input: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.md,
    paddingVertical: spacing.padding.md,
    lineHeight: 17,
    paddingHorizontal: spacing.padding.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  submitButton: {
    marginTop: spacing.margin.sm,
  },
  forgotButton: {
    alignSelf: 'center',
    marginTop: spacing.margin.md,
  },
  forgotText: {
    ...typography.textStyles.bodySmall,
    color: colors.primary[500],
    textDecorationLine: 'underline',
  },
  switchButton: {
    alignSelf: 'center',
    marginTop: spacing.margin.md,
  },
  switchText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default EmailLoginForm;
