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

const PracticeMenuScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useTranslation();

  const handleReadingPress = () => {
    navigation.navigate('ReadingMenu');
  };

  const handleListeningPress = () => {
    navigation.navigate('ListeningMenu');
  };

  const handleWritingPress = () => {
    navigation.navigate('Writing');
  };

  const handleSpeakingPress = () => {
    navigation.navigate('SpeakingMenu');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card} onPress={handleReadingPress}>
          <Text style={styles.cardTitle}>{t('practice.reading.title')}</Text>
          <Text style={styles.cardDescription}>
            Practice reading comprehension with various text types
          </Text>
        </Card>

        <Card style={styles.card} onPress={handleListeningPress}>
          <Text style={styles.cardTitle}>{t('practice.listening.title')}</Text>
          <Text style={styles.cardDescription}>
            {t('practice.listening.comingSoon')}
          </Text>
        </Card>

        <Card style={styles.card} onPress={handleWritingPress}>
          <Text style={styles.cardTitle}>{t('practice.writing.title')}</Text>
          <Text style={styles.cardDescription}>
            {t('practice.writing.description')}
          </Text>
        </Card>

        <Card style={styles.card} onPress={handleSpeakingPress}>
          <Text style={styles.cardTitle}>{t('practice.speaking.title')}</Text>
          <Text style={styles.cardDescription}>
            Practice oral expression and conversation skills
          </Text>
        </Card>
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

export default PracticeMenuScreen;
