/**
 * Vocabulary Home Screen
 * 
 * Main hub for vocabulary learning with study and review options.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { useVocabulary } from '../contexts/VocabularyContext';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import StatsGrid from '../components/StatsGrid';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LoginModal from '../components/LoginModal';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import type { HomeStackNavigationProp } from '../types/navigation.types';

const VocabularyHomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useCustomTranslation();
  const { user } = useAuth();
  const { stats, progress, isLoading, newWordsCount, dueReviewsCount, loadProgress } = useVocabulary();
  const [showLoginModal, setShowLoginModal] = useState(false);

  React.useEffect(() => {
    logEvent(AnalyticsEvents.VOCABULARY_HOME_OPENED);
  }, []);

  // Check if user needs onboarding
  React.useEffect(() => {
    if (!isLoading && progress && !progress.persona) {
      // User hasn't completed onboarding, redirect to onboarding
      navigation.replace('VocabularyOnboarding');
    }
  }, [isLoading, progress, navigation]);

  const handleStudyNew = () => {
    if (newWordsCount === 0) {
      return;
    }
    logEvent(AnalyticsEvents.VOCABULARY_STUDY_NEW_STARTED);
    navigation.navigate('VocabularyStudyNew');
  };

  const handleReview = () => {
    if (dueReviewsCount === 0) {
      return;
    }
    logEvent(AnalyticsEvents.VOCABULARY_REVIEW_STARTED);
    navigation.navigate('VocabularyReview');
  };

  const handleViewProgress = () => {
    logEvent(AnalyticsEvents.VOCABULARY_PROGRESS_OPENED);
    navigation.navigate('VocabularyProgress');
  };

  const handleViewStudiedWords = () => {
    navigation.navigate('VocabularyStudiedList');
  };

  const handleSignIn = () => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = async () => {
    setShowLoginModal(false);
    // Reload progress after successful login
    if (loadProgress) {
      await loadProgress();
    }
  };

  const handleLoginClose = () => {
    setShowLoginModal(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.centerContent}
          showsVerticalScrollIndicator={false}
        >
          <Icon name="book" size={80} color={colors.primary[300]} />
          <Text style={styles.signInTitle}>{t('vocabulary.signInRequired')}</Text>
          <Text style={styles.signInMessage}>{t('vocabulary.signInMessage')}</Text>
          
          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Icon name="login" size={24} color={colors.white} />
            <Text style={styles.signInButtonText}>{t('vocabulary.signInButton')}</Text>
          </TouchableOpacity>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color={colors.success[500]} />
              <Text style={styles.featureText}>{t('vocabulary.features.saveProgress')}</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color={colors.success[500]} />
              <Text style={styles.featureText}>{t('vocabulary.features.trackWords')}</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color={colors.success[500]} />
              <Text style={styles.featureText}>{t('vocabulary.features.spacedRepetition')}</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color={colors.success[500]} />
              <Text style={styles.featureText}>{t('vocabulary.features.syncDevices')}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Login Modal */}
        <LoginModal
          visible={showLoginModal}
          onClose={handleLoginClose}
          onSuccess={handleLoginSuccess}
        />
      </View>
    );
  }

  // Show error state if data failed to load
  if (!stats || !progress) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{t('vocabulary.errorLoading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Stats */}
        <Card style={styles.header}>
          <Text style={styles.headerTitle}>{t('vocabulary.yourProgress')}</Text>
          <StatsGrid
            stats={[
              {
                value: stats.masteredWords,
                label: t('vocabulary.progress.mastered'),
                valueColor: colors.primary[500],
              },
              {
                value: stats.learningWords,
                label: t('vocabulary.progress.learning'),
                valueColor: colors.warning[500],
              },
            ]}
            variant="compact"
            backgroundColor={colors.background.primary}
          />
        </Card>

        {/* Study New Words Card */}
        <Card
          style={StyleSheet.flatten([
            styles.actionCard,
            newWordsCount === 0 && styles.disabledCard,
          ])}
          onPress={handleStudyNew}
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.success[100] }]}>
              <Icon name="school" size={32} color={colors.success[500]} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{t('vocabulary.studyNew')}</Text>
              <Text style={styles.cardDescription}>
                {t('vocabulary.newWordsAvailable', { count: newWordsCount })}
              </Text>
            </View>
            {newWordsCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.success[500] }]}>
                <Text style={styles.badgeText}>{newWordsCount}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Review Card */}
        <Card
          style={StyleSheet.flatten([
            styles.actionCard,
            dueReviewsCount === 0 && styles.disabledCard,
          ])}
          onPress={handleReview}
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.warning[100] }]}>
              <Icon name="refresh" size={32} color={colors.warning[500]} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{t('vocabulary.review')}</Text>
              <Text style={styles.cardDescription}>
                {t('vocabulary.dueReviews', { count: dueReviewsCount })}
              </Text>
            </View>
            {dueReviewsCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.warning[500] }]}>
                <Text style={styles.badgeText}>{dueReviewsCount}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Progress Card */}
        <Card style={styles.actionCard} onPress={handleViewProgress}>
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary[100] }]}>
              <Icon name="trending-up" size={32} color={colors.primary[500]} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{t('vocabulary.viewProgress')}</Text>
              <Text style={styles.cardDescription}>
                {t('vocabulary.viewProgressDesc')}
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
          </View>
        </Card>

        {/* Studied Words Card */}
        <Card style={styles.actionCard} onPress={handleViewStudiedWords}>
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.secondary[100] }]}>
              <Icon name="menu-book" size={32} color={colors.secondary[500]} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{t('vocabulary.studiedWordsList')}</Text>
              <Text style={styles.cardDescription}>
                {t('vocabulary.studiedWordsListDesc')}
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
          </View>
        </Card>
      </ScrollView>

      {/* Login Modal */}
      <LoginModal
        visible={showLoginModal}
        onClose={handleLoginClose}
        onSuccess={handleLoginSuccess}
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
  errorText: {
    ...typography.textStyles.body,
    color: colors.error[500],
    textAlign: 'center',
    paddingHorizontal: spacing.padding.xl,
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.padding.xl,
  },
  signInTitle: {
    ...typography.textStyles.h2,
    color: colors.text.primary,
    marginTop: spacing.margin.lg,
    marginBottom: spacing.margin.sm,
    textAlign: 'center',
  },
  signInMessage: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.margin.xl,
    paddingHorizontal: spacing.padding.md,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.padding.xl,
    paddingVertical: spacing.padding.md,
    borderRadius: 12,
    gap: spacing.margin.sm,
    marginBottom: spacing.margin.xl,
  },
  signInButtonText: {
    ...typography.textStyles.body,
    color: colors.white,
    fontWeight: 'bold',
  },
  featuresList: {
    width: '100%',
    marginTop: spacing.margin.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.margin.md,
    marginBottom: spacing.margin.md,
  },
  featureText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.padding.lg,
    gap: spacing.margin.md,
  },
  header: {
    paddingVertical: spacing.padding.md,
  },
  headerTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
    textAlign: 'center',
  },
  title: {
    ...typography.textStyles.h1,
    color: colors.text.primary,
    marginBottom: spacing.margin.lg,
  },
  actionCard: {
  },
  disabledCard: {
    opacity: 0.5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.margin.md,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  cardDescription: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
  },
  badge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.padding.sm,
  },
  badgeText: {
    ...typography.textStyles.caption,
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default VocabularyHomeScreen;

