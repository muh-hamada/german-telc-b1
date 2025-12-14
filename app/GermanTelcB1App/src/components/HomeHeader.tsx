import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, ThemeColors, typography } from '../theme';
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
});

export default HomeHeader;