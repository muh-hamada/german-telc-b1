/**
 * Vocabulary Card Component
 * 
 * Flashcard component for displaying vocabulary words with flip animation.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { VocabularyWord } from '../types/vocabulary.types';
import { useCustomTranslation } from '../hooks/useCustomTranslation';

interface VocabularyCardProps {
  word: VocabularyWord;
  isFlipped: boolean;
  onFlip: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.padding.lg * 2;

const VocabularyCard: React.FC<VocabularyCardProps> = ({ word, isFlipped, onFlip }) => {
  const { i18n, t } = useCustomTranslation();
  const [flipAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 180 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }, [isFlipped, flipAnim]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  // Get translation in current language
  const currentLang = i18n.language;
  const translation = word.translations[currentLang as keyof typeof word.translations] || 
                      word.translations.en || 
                      '';

  // Get first example sentence translation
  const exampleSentence = word.exampleSentences[0];
  const exampleTranslation = exampleSentence?.translations[currentLang as keyof typeof exampleSentence.translations] ||
                             exampleSentence?.translations.en ||
                             '';

  // Format word with article for nouns
  const displayWord = word.article ? `${word.article} ${word.word}` : word.word;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onFlip}
      activeOpacity={0.9}
    >
      {/* Front of card */}
      <Animated.View
        style={[
          styles.card,
          styles.cardFront,
          { transform: [{ rotateY: frontInterpolate }], opacity: frontOpacity },
        ]}
      >
        <View style={styles.cardContent}>
          <Text style={styles.wordType}>{word.type}</Text>
          <Text style={styles.word}>{displayWord}</Text>
          <Text style={styles.tapHint}>{t('vocabulary.tapToSeeTranslation')}</Text>
        </View>
      </Animated.View>

      {/* Back of card */}
      <Animated.View
        style={[
          styles.card,
          styles.cardBack,
          { transform: [{ rotateY: backInterpolate }], opacity: backOpacity },
        ]}
      >
        <View style={styles.cardContent}>
          <Text style={styles.wordType}>{word.type}</Text>
          <Text style={styles.word}>{displayWord}</Text>
          <View style={styles.divider} />
          <Text style={styles.translation}>{translation}</Text>
          {exampleSentence && (
            <View style={styles.exampleContainer}>
              <Text style={styles.exampleLabel}>{t('vocabulary.example')}:</Text>
              <Text style={styles.example}>{exampleSentence.text}</Text>
              <Text style={styles.exampleTranslation}>{exampleTranslation}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: 450,
    alignSelf: 'center',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: spacing.padding.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    justifyContent: 'center',
  },
  cardBack: {
    justifyContent: 'flex-start',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordType: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.margin.sm,
  },
  word: {
    ...typography.textStyles.h1,
    color: colors.primary[500],
    textAlign: 'center',
    marginBottom: spacing.margin.md,
  },
  tapHint: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
    marginTop: spacing.margin.lg,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: colors.primary[200],
    marginVertical: spacing.margin.md,
  },
  translation: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.margin.lg,
  },
  exampleContainer: {
    marginTop: spacing.margin.md,
    padding: spacing.padding.md,
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    width: '100%',
  },
  exampleLabel: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
    marginBottom: spacing.margin.xs,
    textAlign: 'left',
  },
  example: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    fontStyle: 'italic',
    marginBottom: spacing.margin.sm,
  },
  exampleTranslation: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
    textAlign: 'left',
  },
});

export default VocabularyCard;

