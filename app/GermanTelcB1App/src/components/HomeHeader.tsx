import React from 'react';
import { View, Text, StyleSheet, Platform, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
import LinearGradient from 'react-native-linear-gradient';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { useAuth } from '../contexts/AuthContext';

interface HomeHeaderProps {
  // You can add props here if needed in the future
}

const HomeHeader: React.FC<HomeHeaderProps> = () => {
  const { t } = useCustomTranslation();
  const { user } = useAuth();

  return (
    <SafeAreaView edges={['top']} style={styles.header}>

      <View style={styles.textContainer} >
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {user ? t('home.welcomeUser', { name: user.displayName }) : t('home.welcomeGuest')}
        </Text>
      </View>
    </SafeAreaView>

  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.margin.md,
    padding: 0,
  },
  textContainer: {
    // flex: 1,
    justifyContent: 'center',
    paddingTop: spacing.padding.lg,
    paddingHorizontal: spacing.padding.lg,
  },
  title: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  imageContainer: {
    flex: 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    width: '80%',
    aspectRatio: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  placeholderText: {
    ...typography.textStyles.body,
    color: colors.primary[500],
    fontSize: 12,
  },
});

export default HomeHeader;