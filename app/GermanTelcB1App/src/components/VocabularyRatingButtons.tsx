/**
 * Vocabulary Rating Buttons Component
 * 
 * Four-button rating interface for SM-2 spaced repetition feedback.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Rating } from '../types/vocabulary.types';
import { useCustomTranslation } from '../hooks/useCustomTranslation';

interface VocabularyRatingButtonsProps {
  onRate: (rating: Rating) => void;
}

const VocabularyRatingButtons: React.FC<VocabularyRatingButtonsProps> = ({ onRate }) => {
  const { t } = useCustomTranslation();

  const handleRate = (rating: Rating) => {
    Vibration.vibrate(10); // Haptic feedback
    onRate(rating);
  };

  const buttons = [
    {
      rating: 1 as Rating,
      label: t('vocabulary.ratings.again'),
      color: colors.error[500],
      backgroundColor: colors.error[50],
      description: '<1 min',
    },
    {
      rating: 2 as Rating,
      label: t('vocabulary.ratings.hard'),
      color: colors.warning[500],
      backgroundColor: colors.warning[50],
      description: '<10 min',
    },
    {
      rating: 3 as Rating,
      label: t('vocabulary.ratings.good'),
      color: colors.success[500],
      backgroundColor: colors.success[50],
      description: '<1 day',
    },
    {
      rating: 4 as Rating,
      label: t('vocabulary.ratings.easy'),
      color: colors.primary[400],
      backgroundColor: colors.primary[50],
      description: '~4 days',
    },
  ];

  return (
    <View style={styles.container}>
      {buttons.map((button) => (
        <TouchableOpacity
          key={button.rating}
          style={[styles.button, { backgroundColor: button.backgroundColor }]}
          onPress={() => handleRate(button.rating)}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonLabel, { color: button.color }]}>
            {button.label}
          </Text>
          <Text style={[styles.buttonDescription, { color: button.color }]}>
            {button.description}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.margin.sm,
    paddingHorizontal: spacing.padding.lg,
  },
  button: {
    flex: 1,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.padding.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonLabel: {
    ...typography.textStyles.body,
    fontWeight: '600',
    marginBottom: spacing.margin.xs,
  },
  buttonDescription: {
    ...typography.textStyles.caption,
    fontSize: 10,
  },
});

export default VocabularyRatingButtons;

