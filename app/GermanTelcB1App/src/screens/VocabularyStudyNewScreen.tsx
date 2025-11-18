/**
 * Vocabulary Study New Screen
 * 
 * Screen for studying new vocabulary words.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { useVocabulary } from '../contexts/VocabularyContext';
import { useStreak } from '../contexts/StreakContext';
import VocabularyCard from '../components/VocabularyCard';
import Button from '../components/Button';
import { VocabularyWord } from '../types/vocabulary.types';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import vocabularyProgressService from '../services/vocabulary-progress.service';

const VocabularyStudyNewScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useCustomTranslation();
  const { progress, getNewWords, markWordAsLearned, loadProgress } = useVocabulary();
  const { recordActivity } = useStreak();
  
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [wordsStudiedToday, setWordsStudiedToday] = useState(0);

  const dailyLimit = progress ? vocabularyProgressService.getDailyLimit(progress.persona) : 20;

  useEffect(() => {
    loadNewWords();
  }, []);

  const loadNewWords = async () => {
    try {
      setIsLoading(true);
      const newWords = await getNewWords(dailyLimit);
      setWords(newWords);
      
      if (newWords.length === 0) {
        Alert.alert(
          t('vocabulary.noNewWords'),
          t('vocabulary.noNewWordsDesc'),
          [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('[VocabularyStudyNewScreen] Error loading words:', error);
      Alert.alert(t('common.error'), t('vocabulary.errorLoadingWords'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMarkAsLearned = async () => {
    const currentWord = words[currentIndex];
    
    try {
      await markWordAsLearned(currentWord.id);
      setWordsStudiedToday(prev => prev + 1);
      
      logEvent(AnalyticsEvents.VOCABULARY_NEW_WORD_STUDIED, {
        wordId: currentWord.id,
        word: currentWord.word,
      });

      // Move to next word
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        // Completed all words
        handleComplete();
      }
    } catch (error) {
      console.error('[VocabularyStudyNewScreen] Error marking word as learned:', error);
      Alert.alert(t('common.error'), t('vocabulary.errorSavingProgress'));
    }
  };

  const handleComplete = async () => {
    logEvent(AnalyticsEvents.VOCABULARY_DAILY_GOAL_COMPLETED, {
      wordsStudied: wordsStudiedToday,
    });

    // Record streak activity for completing daily vocabulary goal
    if (wordsStudiedToday >= 10) {
      await recordActivity('vocabulary_study', `vocab_daily_${getLocalDateString()}`, wordsStudiedToday);
    }

    Alert.alert(
      t('vocabulary.celebration'),
      t('vocabulary.celebrationMessage', { count: wordsStudiedToday }),
      [
        {
          text: t('common.done'),
          onPress: () => {
            loadProgress();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const getLocalDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (words.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('vocabulary.noNewWords')}</Text>
        <Button title={t('common.back')} onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const currentWord = words[currentIndex];
  const studyProgress = ((currentIndex + 1) / words.length) * 100;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${studyProgress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {words.length}
        </Text>
      </View>

      {/* Flashcard */}
      <View style={styles.cardContainer}>
        <VocabularyCard
          word={currentWord}
          isFlipped={isFlipped}
          onFlip={handleFlip}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {!isFlipped ? (
          <Button
            title={t('vocabulary.showAnswer')}
            onPress={handleFlip}
            style={styles.button}
          />
        ) : (
          <View style={styles.buttonGroup}>
            <Button
              title={t('vocabulary.markAsLearned')}
              onPress={handleMarkAsLearned}
              style={styles.button}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.padding.lg,
  },
  emptyText: {
    ...typography.textStyles.h3,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.margin.lg,
  },
  progressContainer: {
    padding: spacing.padding.lg,
    gap: spacing.margin.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.secondary[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  progressText: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.padding.lg,
  },
  actionsContainer: {
    padding: spacing.padding.lg,
    gap: spacing.margin.md,
  },
  button: {
    marginHorizontal: 0,
  },
  buttonGroup: {
    gap: spacing.margin.sm,
  },
});

export default VocabularyStudyNewScreen;

