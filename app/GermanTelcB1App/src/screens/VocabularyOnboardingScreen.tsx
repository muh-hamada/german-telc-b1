/**
 * Vocabulary Onboarding Screen
 * 
 * One-time persona selection for vocabulary learning pace.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { useVocabulary } from '../contexts/VocabularyContext';
import { UserPersona } from '../types/vocabulary.types';
import Button from '../components/Button';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

const VocabularyOnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useCustomTranslation();
  const { setUserPersona } = useVocabulary();
  const [selectedPersona, setSelectedPersona] = useState<UserPersona>('serious');
  const [isLoading, setIsLoading] = useState(false);

  const personas: Array<{
    type: UserPersona;
    icon: string;
    dailyWords: number;
    description: string;
  }> = [
    {
      type: 'casual',
      icon: 'self-improvement',
      dailyWords: 5,
      description: t('vocabulary.onboarding.casualDesc'),
    },
    {
      type: 'beginner',
      icon: 'school',
      dailyWords: 10,
      description: t('vocabulary.onboarding.beginnerDesc'),
    },
    {
      type: 'serious',
      icon: 'trending-up',
      dailyWords: 20,
      description: t('vocabulary.onboarding.seriousDesc'),
    },
  ];

  const handleContinue = async () => {
    try {
      setIsLoading(true);
      await setUserPersona(selectedPersona);
      
      logEvent(AnalyticsEvents.VOCABULARY_PERSONA_SELECTED, {
        persona: selectedPersona,
      });

      navigation.replace('VocabularyHome' as never);
    } catch (error) {
      console.error('[VocabularyOnboardingScreen] Error setting persona:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('vocabulary.onboarding.title')}</Text>
          <Text style={styles.subtitle}>{t('vocabulary.onboarding.subtitle')}</Text>
        </View>

        {/* Persona Cards */}
        <View style={styles.personaContainer}>
          {personas.map((persona) => (
            <TouchableOpacity
              key={persona.type}
              style={[
                styles.personaCard,
                selectedPersona === persona.type && styles.personaCardSelected,
              ]}
              onPress={() => setSelectedPersona(persona.type)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  selectedPersona === persona.type && styles.iconContainerSelected,
                ]}
              >
                <Icon
                  name={persona.icon}
                  size={36}
                  color={
                    selectedPersona === persona.type
                      ? colors.white
                      : colors.primary[500]
                  }
                />
              </View>
              <Text style={styles.personaTitle}>
                {t(`vocabulary.persona.${persona.type}`)}
              </Text>
              <Text style={styles.dailyWords}>
                {t('vocabulary.onboarding.dailyWords', { count: persona.dailyWords })}
              </Text>
              <Text style={styles.personaDescription}>{persona.description}</Text>
              
              {selectedPersona === persona.type && (
                <View style={styles.checkmark}>
                  <Icon name="check-circle" size={24} color={colors.primary[500]} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Icon name="info-outline" size={20} color={colors.primary[500]} />
          <Text style={styles.infoText}>
            {t('vocabulary.onboarding.info')}
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <Button
          title={t('common.continue')}
          onPress={handleContinue}
          disabled={isLoading}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.padding.lg,
  },
  header: {
    marginBottom: spacing.margin.xl,
  },
  title: {
    ...typography.textStyles.h1,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  personaContainer: {
    gap: spacing.margin.md,
    marginBottom: spacing.margin.xl,
  },
  personaCard: {
    padding: spacing.padding.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.secondary[200],
    alignItems: 'center',
    position: 'relative',
  },
  personaCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.margin.md,
  },
  iconContainerSelected: {
    backgroundColor: colors.primary[500],
  },
  personaTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  dailyWords: {
    ...typography.textStyles.body,
    color: colors.primary[500],
    fontWeight: '600',
    marginBottom: spacing.margin.sm,
  },
  personaDescription: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: spacing.padding.md,
    right: spacing.padding.md,
  },
  infoBox: {
    flexDirection: 'row',
    padding: spacing.padding.md,
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    gap: spacing.margin.sm,
  },
  infoText: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  footer: {
    padding: spacing.padding.lg,
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.secondary[200],
  },
});

export default VocabularyOnboardingScreen;

