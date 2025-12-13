import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, ThemeColors, typography } from '../theme';
import { DEMO_MODE } from '../config/development.config';
import { useAppTheme } from '../contexts/ThemeContext';

interface HomeHeaderProps {
  // You can add props here if needed in the future
}

const HomeHeader: React.FC<HomeHeaderProps> = () => {
  const { t } = useCustomTranslation();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.textContainer} >
      <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
        {user ? t('home.welcomeUser', { name: DEMO_MODE ? 'Sarah Johnson' : user.displayName }) : t('home.welcomeGuest')}
      </Text>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  textContainer: {
    flex: 1,
    marginTop: spacing.margin.md,
  },
  title: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    textAlign: 'left',
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