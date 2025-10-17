import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../theme';

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t('profile.title')}</Text>
        <Text style={styles.comingSoon}>Profile features coming soon...</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.padding.lg,
  },
  title: {
    ...typography.textStyles.h2,
    color: colors.text.primary,
    marginBottom: spacing.margin.lg,
  },
  comingSoon: {
    ...typography.textStyles.body,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default ProfileScreen;
