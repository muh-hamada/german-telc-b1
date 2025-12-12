import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { useVocabulary } from '../contexts/VocabularyContext';
import { useStreak } from '../contexts/StreakContext';
import { useModalQueue } from '../contexts/ModalQueueContext';
import { useRemoteConfig } from '../contexts/RemoteConfigContext';
import { usePremium } from '../contexts/PremiumContext';
import { useAuth } from '../contexts/AuthContext';
import VocabularyCard from '../components/VocabularyCard';
import VocabularyAdCard from '../components/VocabularyAdCard';
import VocabularyCompletionModal from '../components/VocabularyCompletionModal';
import Button from '../components/Button';
import { VocabularyWord } from '../types/vocabulary.types';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import vocabularyProgressService from '../services/vocabulary-progress.service';

const VocabularyStudyNewScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useCustomTranslation();
  const { progress, getNewWords, markWordAsLearned, loadProgress } = useVocabulary();
  const { recordActivity, setStreakModalVisibility, adFreeStatus } = useStreak();
  const { setContextualModalActive } = useModalQueue();
  const { getVocabularyNativeAdConfig, isStreaksEnabledForUser } = useRemoteConfig();
  const { isPremium } = usePremium();
  const { user } = useAuth();
  
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [wordsStudiedToday, setWordsStudiedToday] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [shouldShowStreakModalAfterCompletionModal, setShouldShowStreakModalAfterCompletionModal] = useState(false);
  
  // Native ad state
  const [showAdCard, setShowAdCard] = useState(false);

  const dailyLimit = progress ? vocabularyProgressService.getDailyLimit(progress.persona) : 20;
  
  // Get native ad config from remote config
  const nativeAdConfig = getVocabularyNativeAdConfig();
  
  // Check if user should see ads (not premium and no active streak reward)
  const shouldShowAds = useCallback(() => {
    // Skip ads if premium
    if (isPremium) {
      console.log('[VocabularyStudyNewScreen] Premium user - skipping ads');
      logEvent(AnalyticsEvents.VOCABULARY_NATIVE_AD_SKIPPED, { reason: 'premium' });
      return false;
    }
    
    // Skip ads if streak reward (ad-free) is active
    if (isStreaksEnabledForUser(user?.uid) && adFreeStatus.isActive) {
      console.log('[VocabularyStudyNewScreen] Streak reward active - skipping ads');
      logEvent(AnalyticsEvents.VOCABULARY_NATIVE_AD_SKIPPED, { reason: 'streak_reward' });
      return false;
    }
    
    // Skip if feature is disabled
    if (!nativeAdConfig.enabled) {
      console.log('[VocabularyStudyNewScreen] Native ad feature disabled');
      return false;
    }
    
    return true;
  }, [isPremium, isStreaksEnabledForUser, user?.uid, adFreeStatus.isActive, nativeAdConfig.enabled]);
  
  // Check if we should show an ad at the current word index
  const shouldShowAdAtIndex = useCallback((index: number) => {
    if (!shouldShowAds()) return false;
    
    // Show ad after every N words (interval)
    // e.g., if interval is 5, show ad after words 5, 10, 15, etc.
    const wordNumber = index + 1; // 1-indexed word number
    return wordNumber > 0 && wordNumber % nativeAdConfig.interval === 0;
  }, [shouldShowAds, nativeAdConfig.interval]);

  useEffect(() => {
    loadNewWords();
  }, []);
  
  // Handle native ad loaded
  const handleAdLoaded = useCallback(() => {
    console.log('[VocabularyStudyNewScreen] Native ad loaded successfully');
  }, []);
  
  // Handle native ad failed to load
  const handleAdFailedToLoad = useCallback((error: any) => {
    console.log('[VocabularyStudyNewScreen] Native ad failed to load:', error);
    // If ad fails to load, we'll skip showing the ad card
  }, []);
  
  // State to track if we need to complete after ad
  const [completeAfterAd, setCompleteAfterAd] = useState(false);
  
  const getLocalDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle completion - defined early so it can be used in useEffect
  const handleComplete = useCallback(async (totalWordsStudied: number) => {
    logEvent(AnalyticsEvents.VOCABULARY_DAILY_GOAL_COMPLETED, {
      wordsStudied: totalWordsStudied,
    });

    // Record streak activity for completing daily vocabulary goal
    if (totalWordsStudied >= 10) {
      const result = await recordActivity({
        activityType: 'vocabulary_study',
        activityId: `vocab_daily_${getLocalDateString()}`,
        score: totalWordsStudied,
        options: { shouldSuppressStreakModal: true },
      });

      setShouldShowStreakModalAfterCompletionModal(result.shouldShowModal);
    }

    // Pause global modal queue and show completion modal
    setContextualModalActive(true);
    setShowCompletionModal(true);
  }, [recordActivity, setContextualModalActive]);
  
  // Handle continue from ad card
  const handleAdContinue = useCallback(() => {
    console.log('[VocabularyStudyNewScreen] User continued from ad card');
    logEvent(AnalyticsEvents.VOCABULARY_NATIVE_AD_CLOSED, {
      wordIndex: currentIndex,
      wordsStudied: wordsStudiedToday,
    });
    
    setShowAdCard(false);
    
    // Move to next word after ad
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      // Completed all words - set flag to trigger completion
      setCompleteAfterAd(true);
    }
  }, [currentIndex, wordsStudiedToday, words.length]);

  // Handle completion after ad is dismissed
  useEffect(() => {
    if (completeAfterAd) {
      setCompleteAfterAd(false);
      handleComplete(wordsStudiedToday);
    }
  }, [completeAfterAd, wordsStudiedToday, handleComplete]);

  const loadNewWords = async () => {
    try {
      setIsLoading(true);
      const newWords = await getNewWords(dailyLimit);
      setWords(newWords);
      
      if (newWords.length === 0) {
        // No new words available, go back
        navigation.goBack();
      }
    } catch (error) {
      console.error('[VocabularyStudyNewScreen] Error loading words:', error);
      navigation.goBack();
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
      
      logEvent(AnalyticsEvents.VOCABULARY_NEW_WORD_STUDIED, {
        wordId: currentWord.id,
        word: currentWord.word,
      });

      const newWordsStudied = wordsStudiedToday + 1;
      setWordsStudiedToday(newWordsStudied);

      // Check if we should show an ad after this word
      console.log('[VocabularyStudyNewScreen] shouldShowAdAtIndex', shouldShowAdAtIndex(currentIndex));
      if (shouldShowAdAtIndex(currentIndex)) {
        console.log('[VocabularyStudyNewScreen] Showing ad card after word', currentIndex + 1);
        logEvent(AnalyticsEvents.VOCABULARY_NATIVE_AD_DISPLAYED, {
          wordIndex: currentIndex,
          wordsStudied: newWordsStudied,
          interval: nativeAdConfig.interval,
        });
        setShowAdCard(true);
        setIsFlipped(false);
        return; // Wait for user to continue from ad
      }

      // Move to next word
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        // Completed all words
        handleComplete(newWordsStudied);
      }
    } catch (error) {
      console.error('[VocabularyStudyNewScreen] Error marking word as learned:', error);
    }
  };

  const handleModalClose = () => {
    setShowCompletionModal(false);
    // Resume global modal queue
    setContextualModalActive(false);
    loadProgress();

    if (shouldShowStreakModalAfterCompletionModal) {
      setShouldShowStreakModalAfterCompletionModal(false);
      setStreakModalVisibility(true);
    }

    navigation.goBack();
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

      {/* Flashcard or Ad Card */}
      <View style={styles.cardContainer}>
        {showAdCard ? (
          <VocabularyAdCard
            onAdLoaded={handleAdLoaded}
            onAdFailedToLoad={handleAdFailedToLoad}
          />
        ) : (
          <VocabularyCard
            word={currentWord}
            isFlipped={isFlipped}
            onFlip={handleFlip}
          />
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {showAdCard ? (
          <Button
            title={t('common.continue')}
            onPress={handleAdContinue}
            style={styles.button}
          />
        ) : !isFlipped ? (
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
      
      {/* Completion Modal */}
      <VocabularyCompletionModal
        visible={showCompletionModal}
        wordsCount={wordsStudiedToday}
        type="study"
        onClose={handleModalClose}
      />
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

