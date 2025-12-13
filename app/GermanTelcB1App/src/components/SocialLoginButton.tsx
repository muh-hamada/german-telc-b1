import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator} from 'react-native';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCustomTranslation } from '../hooks/useCustomTranslation';

interface SocialLoginButtonProps {
  provider: 'google' | 'apple' | 'twitter';
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
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const getProviderConfig = () => {
    switch (provider) {
      case 'google':
        return {
          title: t('auth.continueWithGoogle'),
          backgroundColor: colors.social.google,
          textColor: colors.white,
          icon: 'G',
        };
      case 'twitter':
        return {
          title: t('auth.continueWithTwitter'),
          backgroundColor: colors.social.twitter,
          textColor: colors.white,
          icon: '𝕏',
        };
      case 'apple':
        return {
          title: t('auth.continueWithApple'),
          backgroundColor: colors.text.primary,
          textColor: colors.white,
          icon: <Icon name="apple" size={20} color={colors.white} />
        };
      default:
        return {
          title: t('auth.continue'),
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      direction: 'ltr',
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
