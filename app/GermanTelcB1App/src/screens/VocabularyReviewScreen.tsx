/**
 * Vocabulary Review Screen
 * 
 * Screen for reviewing vocabulary words with SM-2 ratings.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { useVocabulary } from '../contexts/VocabularyContext';
import { useStreak } from '../contexts/StreakContext';
import { useModalQueue } from '../contexts/ModalQueueContext';
import VocabularyCard from '../components/VocabularyCard';
import VocabularyRatingButtons from '../components/VocabularyRatingButtons';
import VocabularyCompletionModal from '../components/VocabularyCompletionModal';
import Button from '../components/Button';
import { VocabularyWord, Rating } from '../types/vocabulary.types';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

const VocabularyReviewScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useCustomTranslation();
  const { getDueWords, reviewWord, loadProgress } = useVocabulary();
  const { recordActivity } = useStreak();
  const { setContextualModalActive } = useModalQueue();
  
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewsCompleted, setReviewsCompleted] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    loadDueWords();
  }, []);

  const loadDueWords = async () => {
    try {
      setIsLoading(true);
      const dueWords = await getDueWords();
      setWords(dueWords);
      
      if (dueWords.length === 0) {
        // No words due, go back
        navigation.goBack();
      }
    } catch (error) {
      console.error('[VocabularyReviewScreen] Error loading due words:', error);
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRate = async (rating: Rating) => {
    const currentWord = words[currentIndex];
    
    try {
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(async () => {
        await reviewWord(currentWord.id, rating);
        
        logEvent(AnalyticsEvents.VOCABULARY_WORD_REVIEWED, {
          wordId: currentWord.id,
          word: currentWord.word,
          rating,
        });

        const newReviewsCompleted = reviewsCompleted + 1;
        setReviewsCompleted(newReviewsCompleted);

        // Move to next word or complete
        if (currentIndex < words.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setIsFlipped(false);
          
          // Fade in animation
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else {
          handleComplete(newReviewsCompleted);
        }
      });
    } catch (error) {
      console.error('[VocabularyReviewScreen] Error reviewing word:', error);
      
      // Reset animation
      fadeAnim.setValue(1);
    }
  };

  const handleComplete = async (totalReviews: number) => {
    logEvent(AnalyticsEvents.VOCABULARY_DAILY_GOAL_COMPLETED, {
      reviewsCompleted: totalReviews,
    });

    // Record streak activity for completing daily reviews (10+ reviews)
    if (totalReviews >= 10) {
      await recordActivity({
        activityType: 'vocabulary_review',
        activityId: `vocab_review_${getLocalDateString()}`,
        score: totalReviews,
      });
    }

    // Pause global modal queue and show completion modal
    setContextualModalActive(true);
    setShowCompletionModal(true);
  };

  const handleModalClose = () => {
    setShowCompletionModal(false);
    // Resume global modal queue
    setContextualModalActive(false);
    loadProgress();
    navigation.goBack();
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
        <Text style={styles.emptyText}>{t('vocabulary.noDueReviews')}</Text>
        <Button title={t('common.back')} onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const currentWord = words[currentIndex];
  const reviewProgress = ((currentIndex + 1) / words.length) * 100;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${reviewProgress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {words.length}
        </Text>
      </View>

      {/* Flashcard */}
      <Animated.View style={[styles.cardContainer, { opacity: fadeAnim }]}>
        <VocabularyCard
          word={currentWord}
          isFlipped={isFlipped}
          onFlip={handleFlip}
        />
      </Animated.View>

      {/* Rating Buttons (shown after flip) */}
      <View style={styles.actionsContainer}>
        {!isFlipped ? (
          <Button
            title={t('vocabulary.showAnswer')}
            onPress={handleFlip}
            style={styles.button}
          />
        ) : (
          <VocabularyRatingButtons onRate={handleRate} />
        )}
      </View>

      {/* Completion Modal */}
      <VocabularyCompletionModal
        visible={showCompletionModal}
        wordsCount={reviewsCompleted}
        type="review"
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
    backgroundColor: colors.warning[500],
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
    paddingBottom: spacing.padding.xl,
  },
  button: {
    marginHorizontal: 0,
  },
});

export default VocabularyReviewScreen;

