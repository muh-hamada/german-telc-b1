import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import Card from '../../components/Card';
import { HomeStackNavigationProp } from '../../types/navigation.types';
import AdBanner from '../../components/AdBanner';
import { DEMO_MODE } from '../../config/demo.config';

const GrammarMenuScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useTranslation();

  const handlePart1Press = () => {
    navigation.navigate('GrammarPart1');
  };

  const handlePart2Press = () => {
    navigation.navigate('GrammarPart2');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card} onPress={handlePart1Press}>
          <Text style={styles.cardTitle}>{t('practice.grammar.part1')}</Text>
          <Text style={styles.cardDescription}>
            {t('practice.grammar.descriptions.main')}
          </Text>
        </Card>

        <Card style={styles.card} onPress={handlePart2Press}>
          <Text style={styles.cardTitle}>{t('practice.grammar.part2')}</Text>
          <Text style={styles.cardDescription}>
            {t('practice.grammar.descriptions.main')}
          </Text>
        </Card>
      </ScrollView>
      {!DEMO_MODE && <AdBanner />}
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
  card: {
    marginBottom: spacing.margin.lg,
    minHeight: 100,
    justifyContent: 'center',
  },
  cardTitle: {
    ...typography.textStyles.h3,
    color: colors.primary[500],
    marginBottom: spacing.margin.sm,
  },
  cardDescription: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
});

export default GrammarMenuScreen;

