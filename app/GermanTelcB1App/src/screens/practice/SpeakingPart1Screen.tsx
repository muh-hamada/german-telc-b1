import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';

const SpeakingPart1Screen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('practice.speaking.part1')}</Text>
        <Text style={styles.comingSoon}>Content coming soon...</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1, padding: spacing.padding.lg, justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.textStyles.h2, color: colors.text.primary, marginBottom: spacing.margin.lg },
  comingSoon: { ...typography.textStyles.body, color: colors.text.tertiary, fontStyle: 'italic' },
});

export default SpeakingPart1Screen;
