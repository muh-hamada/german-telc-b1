import React, { useState } from 'react';
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
import ExamSelectionModal from '../../components/ExamSelectionModal';
import writingData from '../../data/writing.json';
import AdBanner from '../../components/AdBanner';
import { DEMO_MODE } from '../../config/demo.config';

const PracticeMenuScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useTranslation();
  const [showWritingModal, setShowWritingModal] = useState(false);

  const handleReadingPress = () => {
    navigation.navigate('ReadingMenu');
  };

  const handleListeningPress = () => {
    navigation.navigate('ListeningMenu');
  };

  const handleWritingPress = () => {
    setShowWritingModal(true);
  };

  const handleSelectWritingExam = (examId: number) => {
    navigation.navigate('Writing', { examId });
  };

  const handleSpeakingPress = () => {
    navigation.navigate('SpeakingMenu');
  };

  const handleGrammarPress = () => {
    navigation.navigate('GrammarMenu');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card} onPress={handleReadingPress}>
          <Text style={styles.cardTitle}>{t('practice.reading.title')}</Text>
          <Text style={styles.cardDescription}>
            {t('practice.reading.descriptions.main')}
          </Text>
        </Card>

        <Card style={styles.card} onPress={handleListeningPress}>
          <Text style={styles.cardTitle}>{t('practice.listening.title')}</Text>
          <Text style={styles.cardDescription}>
            {t('practice.listening.comingSoon')}
          </Text>
        </Card>

        <Card style={styles.card} onPress={handleGrammarPress}>
          <Text style={styles.cardTitle}>{t('practice.grammar.title')}</Text>
          <Text style={styles.cardDescription}>
            {t('practice.grammar.descriptions.main')}
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
            {t('practice.speaking.descriptions.main')}
          </Text>
        </Card>
      </ScrollView>
      
      <ExamSelectionModal
        visible={showWritingModal}
        onClose={() => setShowWritingModal(false)}
        exams={writingData.exams}
        onSelectExam={handleSelectWritingExam}
        examType="writing"
        partNumber={1}
        title={t('practice.writing.title')}
      />

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

export default PracticeMenuScreen;
