import React from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import Card from '../../components/Card';
import { HomeStackNavigationProp } from '../../types/navigation.types';
import AdBanner from '../../components/AdBanner';
import { HIDE_ADS } from '../../config/development.config';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';

const ListeningMenuScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useTranslation();

  const handlePart1Press = () => navigation.navigate('ListeningPart1');
  const handlePart2Press = () => navigation.navigate('ListeningPart2');
  const handlePart3Press = () => navigation.navigate('ListeningPart3');

  React.useEffect(() => {
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'listening' });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card} onPress={handlePart1Press}>
          <Text style={styles.cardTitle}>{t('practice.listening.part1')}</Text>
          <Text style={styles.cardDescription}>{t('practice.listening.part1Description')}</Text>
        </Card>
        <Card style={styles.card} onPress={handlePart2Press}>
          <Text style={styles.cardTitle}>{t('practice.listening.part2')}</Text>
          <Text style={styles.cardDescription}>{t('practice.listening.part2Description')}</Text>
        </Card>
        <Card style={styles.card} onPress={handlePart3Press}>
          <Text style={styles.cardTitle}>{t('practice.listening.part3')}</Text>
          <Text style={styles.cardDescription}>{t('practice.listening.part3Description')}</Text>
        </Card>
      </ScrollView>
      {!HIDE_ADS && <AdBanner />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1 },
  scrollContent: { padding: spacing.padding.lg },
  card: { marginBottom: spacing.margin.lg, minHeight: 100, justifyContent: 'center' },
  cardTitle: { ...typography.textStyles.h3, color: colors.primary[500], marginBottom: spacing.margin.sm },
  cardDescription: { ...typography.textStyles.body, color: colors.text.secondary, lineHeight: 24 },
});

export default ListeningMenuScreen;
