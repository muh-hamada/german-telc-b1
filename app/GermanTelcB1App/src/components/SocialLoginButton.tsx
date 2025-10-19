import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface SocialLoginButtonProps {
  provider: 'google' | 'facebook' | 'apple' | 'twitter';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  onPress,
  loading = false,
  disabled = false,
}) => {
  const getProviderConfig = () => {
    switch (provider) {
      case 'google':
        return {
          title: 'Continue with Google',
          backgroundColor: '#4285F4',
          textColor: colors.white,
          icon: 'G',
        };
      case 'facebook':
        return {
          title: 'Continue with Facebook',
          backgroundColor: '#1877F2',
          textColor: colors.white,
          icon: 'f',
        };
      case 'twitter':
        return {
          title: 'Continue with Twitter',
          backgroundColor: '#1DA1F2',
          textColor: colors.white,
          icon: '𝕏',
        };
      case 'apple':
        return {
          title: 'Continue with Apple',
          backgroundColor: colors.text.primary,
          textColor: colors.white,
          icon: '🍎',
        };
      default:
        return {
          title: 'Continue',
          backgroundColor: colors.primary[500],
          textColor: colors.white,
          icon: '?',
        };
    }
  };

  const config = getProviderConfig();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: config.backgroundColor },
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={config.textColor} size="small" />
        ) : (
          <>
            <Text style={[styles.icon, { color: config.textColor }]}>
              {config.icon}
            </Text>
            <Text style={[styles.title, { color: config.textColor }]}>
              {config.title}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: spacing.borderRadius.lg,
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    marginVertical: spacing.margin.sm,
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    marginRight: spacing.margin.sm,
  },
  title: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.medium,
  },
});

export default SocialLoginButton;
