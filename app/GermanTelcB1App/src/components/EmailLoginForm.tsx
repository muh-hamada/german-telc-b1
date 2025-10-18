import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
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
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isSignUp) {
      if (!displayName.trim()) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
      await onCreateAccount(email.trim(), password, displayName.trim());
    } else {
      await onSignIn(email.trim(), password);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }
    await onForgotPassword(email.trim());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isSignUp ? 'Create Account' : 'Sign In'}
      </Text>

      {isSignUp && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your name"
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor={colors.text.tertiary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {isSignUp && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            placeholderTextColor={colors.text.tertiary}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )}

      <Button
        title={isSignUp ? 'Create Account' : 'Sign In'}
        onPress={handleSubmit}
        loading={loading}
        style={styles.submitButton}
      />

      {!isSignUp && (
        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => setIsSignUp(!isSignUp)}
        style={styles.switchButton}
      >
        <Text style={styles.switchText}>
          {isSignUp
            ? 'Already have an account? Sign In'
            : "Don't have an account? Create Account"}
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
    marginBottom: spacing.margin.sm,
    fontWeight: typography.fontWeight.medium,
  },
  input: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.md,
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  submitButton: {
    marginTop: spacing.margin.lg,
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
    marginTop: spacing.margin.lg,
  },
  switchText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default EmailLoginForm;
