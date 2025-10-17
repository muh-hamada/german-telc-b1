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

const ExamStructureScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t('examStructure.title')}</Text>
        <Text style={styles.description}>{t('examStructure.description')}</Text>
        <Text style={styles.comingSoon}>{t('examStructure.comingSoon')}</Text>
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
  description: {
    ...typography.textStyles.bodyLarge,
    color: colors.text.secondary,
    marginBottom: spacing.margin.xl,
    lineHeight: 28,
  },
  comingSoon: {
    ...typography.textStyles.body,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default ExamStructureScreen;
