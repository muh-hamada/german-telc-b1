import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { useRemoteConfig } from '../contexts/RemoteConfigContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import Button from '../components/Button';
import { spacing, type ThemeColors } from '../theme';
import { RootStackParamList } from '../types/navigation.types';
import { OnboardingReview } from '../types/remote-config.types';
import { useCustomTranslation } from '../hooks/useCustomTranslation';

type Props = StackScreenProps<RootStackParamList, 'OnboardingSuccessStories'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Animation constants (all values from PRD)
const CARD_WIDTH = SCREEN_WIDTH * 0.78;
const CARD_HEIGHT_ESTIMATE = 110;
const VERTICAL_SPEED = 60; // px/s
const SINE_AMPLITUDE = 20; // px
const SINE_PERIOD_MS = 6000; // 6 s full cycle

// Card travel range
// Keep animations inside the container to avoid overflow rendering issues
const CONTENT_HEIGHT = SCREEN_HEIGHT - 240; // rough bounds of onboarding content container
const SPAWN_Y = CONTENT_HEIGHT; 
const DEATH_Y = 10; 
const FOOTER_PX = 140;

const TRAVEL_DISTANCE = SPAWN_Y - DEATH_Y;
const TRAVEL_DURATION_MS = (TRAVEL_DISTANCE / VERTICAL_SPEED) * 1000;

// Opacity thresholds (relative to SPAWN and DEATH)
const FADE_IN_ZONE_TOP = SPAWN_Y - 80; 
const FADE_OUT_ZONE_BOTTOM = DEATH_Y + CARD_HEIGHT_ESTIMATE + 10;

interface CardState {
  review: OnboardingReview;
  /** Unique key per card instance (review id + spawn count) */
  instanceKey: string;
  /** Randomised phase offset for sine wave (0 – 2π) */
  phaseOffset: number;
  /** Horizontal centre position */
  centerX: number;
  /** Animated value: 0 = spawned at bottom, 1 = reached death zone */
  progress: Animated.Value;
  animation: Animated.CompositeAnimation;
}

// ─── Single animated card ──────────────────────────────────────────────────
interface ReviewCardProps {
  card: CardState;
  colors: ThemeColors;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ card, colors }) => {
  const styles = useMemo(() => createCardStyles(colors), [colors]);

  const translateY = card.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [SPAWN_Y, DEATH_Y],
  });

  // Sine-based X drift derived from Y position (approximated via progress)
  // We derive time from progress and use a JS-driven sine via transform
  // Since Animated.sin isn't natively available, we use a separate clock value.
  const sinX = card.progress.interpolate({
    // Approximate sine by sampling enough points across one full cycle
    inputRange: buildSineInputRange(),
    outputRange: buildSineOutputRange(card.phaseOffset),
    extrapolate: 'clamp',
  });

  const opacity = card.progress.interpolate({
    inputRange: [0, FADE_IN_PROGRESS, FADE_OUT_PROGRESS, 1],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });

  const stars = '★'.repeat(card.review.rating) + '☆'.repeat(5 - card.review.rating);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity,
          transform: [{ translateY }, { translateX: sinX }],
          start: card.centerX, // start properly handles LTR and RTL positioning
          width: CARD_WIDTH,
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.cardInner}>
        <View style={styles.avatarContainer}>
          {card.review.avatar_url ? (
            <Image
              source={{ uri: card.review.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {card.review.user_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.userName} numberOfLines={1}>{card.review.user_name}</Text>
            <Text style={styles.stars}>{stars}</Text>
          </View>
          <Text style={styles.reviewText} numberOfLines={3}>{card.review.text}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Sine interpolation helpers ────────────────────────────────────────────
// We approximate the sine wave by building a dense piecewise-linear mapping
// over the progress range [0, 1] → sampled every 1/60 (~1 frame at 60 fps).
const SINE_SAMPLES = 120;

function buildSineInputRange(): number[] {
  return Array.from({ length: SINE_SAMPLES }, (_, i) => i / (SINE_SAMPLES - 1));
}

function buildSineOutputRange(phaseOffset: number): number[] {
  return Array.from({ length: SINE_SAMPLES }, (_, i) => {
    const t = (i / (SINE_SAMPLES - 1)) * (TRAVEL_DURATION_MS / 1000);
    const B = (2 * Math.PI) / (SINE_PERIOD_MS / 1000);
    return SINE_AMPLITUDE * Math.sin(B * t + phaseOffset);
  });
}

// Progress values at which fade-in completes and fade-out begins
const FADE_IN_PROGRESS = (SPAWN_Y - FADE_IN_ZONE_TOP) / TRAVEL_DISTANCE;
const FADE_OUT_PROGRESS = (SPAWN_Y - FADE_OUT_ZONE_BOTTOM) / TRAVEL_DISTANCE;

// ─── Main screen ───────────────────────────────────────────────────────────
const OnboardingSuccessStoriesScreen: React.FC<Props> = ({ navigation }) => {
  const { globalConfig } = useRemoteConfig();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const reviews: OnboardingReview[] = globalConfig?.onboardingReviewsData ?? [];

  const handleContinue = useCallback(() => {
    logEvent(AnalyticsEvents.ONBOARDING_REVIEWS_CONTINUE_CLICKED, {});
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <OnboardingSuccessStoriesContent reviews={reviews} />
      {/* Footer gradient overlay + CTA */}
      <View style={styles.footer} pointerEvents="box-none">
        <Button
          title="CONTINUE"
          onPress={handleContinue}
          variant="primary"
          style={styles.continueButton}
        />
      </View>
    </SafeAreaView>
  );
};
export const OnboardingSuccessStoriesContent: React.FC<{ reviews: OnboardingReview[] }> = ({ reviews }) => {
  const { colors } = useAppTheme();
  const { t } = useCustomTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const activeCards = useRef<CardState[]>([]);
  const [, forceUpdate] = useReducer((c: number) => c + 1, 0);
  const spawnCounterRef = useRef(0);
  const nextReviewIndexRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    logEvent(AnalyticsEvents.ONBOARDING_REVIEWS_SCREEN_VIEWED, {});
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const spawnCard = useCallback(
    (delayMs = 0) => {
      if (!isMountedRef.current || reviews.length === 0) return;

      const reviewIndex = nextReviewIndexRef.current % reviews.length;
      nextReviewIndexRef.current += 1;
      const review = reviews[reviewIndex];

      const instanceKey = `${review.id}-${spawnCounterRef.current++}`;
      const phaseOffset = Math.random() * Math.PI * 2;
      // Randomise horizontal centre so cards don't all align
      const centerX = (SCREEN_WIDTH - CARD_WIDTH) / 2 + (Math.random() - 0.5) * 20;

      const progress = new Animated.Value(0);

      const animation = Animated.timing(progress, {
        toValue: 1,
        duration: TRAVEL_DURATION_MS + delayMs,
        easing: Easing.linear,
        useNativeDriver: true,
      });

      const card: CardState = {
        review,
        instanceKey,
        phaseOffset,
        centerX,
        progress,
        animation,
      };

      activeCards.current = [...activeCards.current, card];
      forceUpdate();

      // When animation completes, remove card and spawn the next one
      animation.start(({ finished }) => {
        if (!isMountedRef.current) return;
        if (finished) {
          activeCards.current = activeCards.current.filter(
            c => c.instanceKey !== instanceKey,
          );
          forceUpdate();
          // Spawn replacement after a tiny randomised delay so spawns feel organic
          const jitter = Math.random() * 500;
          setTimeout(() => spawnCard(0), jitter);
        }
      });
    },
    [reviews],
  );

  // Initialise: pre-fill the viewport with staggered cards
  useEffect(() => {
    if (reviews.length === 0) return;

    // Determine how many cards fit in the viewport + give each a staggered start
    const slotCount = Math.max(3, Math.ceil(TRAVEL_DISTANCE / (CARD_HEIGHT_ESTIMATE * 1.5)));
    for (let i = 0; i < slotCount; i++) {
      // Each slot starts at a different point in the travel path (pre-distributed)
      const initialProgress = i / slotCount;
      const progressValue = new Animated.Value(initialProgress);

      const reviewIndex = nextReviewIndexRef.current % reviews.length;
      nextReviewIndexRef.current += 1;
      const review = reviews[reviewIndex];

      const instanceKey = `${review.id}-${spawnCounterRef.current++}`;
      const phaseOffset = Math.random() * Math.PI * 2;
      const centerX = (SCREEN_WIDTH - CARD_WIDTH) / 2 + (Math.random() - 0.5) * 20;

      const remainingFraction = 1 - initialProgress;
      const animation = Animated.timing(progressValue, {
        toValue: 1,
        duration: TRAVEL_DURATION_MS * remainingFraction,
        easing: Easing.linear,
        useNativeDriver: true,
      });

      const card: CardState = {
        review,
        instanceKey,
        phaseOffset,
        centerX,
        progress: progressValue,
        animation,
      };

      activeCards.current = [...activeCards.current, card];

      animation.start(({ finished }) => {
        if (!isMountedRef.current) return;
        if (finished) {
          activeCards.current = activeCards.current.filter(
            c => c.instanceKey !== instanceKey,
          );
          forceUpdate();
          const jitter = Math.random() * 500;
          setTimeout(() => spawnCard(0), jitter);
        }
      });
    }

    forceUpdate();

    return () => {
      // Stop all animations on unmount
      activeCards.current.forEach(c => c.animation.stop());
      activeCards.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviews]);

  return (
    <View style={styles.contentWrapper} pointerEvents="box-none">
      {/* Static header */}
      <View style={styles.header} pointerEvents="none">
        <Text style={styles.title}>{t('onboarding.successStories.title')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.successStories.subtitle')}
        </Text>
      </View>

      {/* Floating cards layer */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {activeCards.current.map(card => (
          <ReviewCard key={card.instanceKey} card={card} colors={colors} />
        ))}
      </View>
      
      {/* Fading footer gradient will be drawn behind buttons via parent */}
      <View style={styles.footerGradientOnly} pointerEvents="none" />
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────
function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    contentWrapper: {
      flex: 1,
      width: '100%',
      // Crop animations falling outside this container
      overflow: 'hidden',
    },
    container: {
      flex: 1,
      backgroundColor: '#F8F9FA',
    },
    header: {
      paddingHorizontal: spacing[6],
      paddingTop: spacing[4],
      paddingBottom: spacing[4],
      zIndex: 10,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: '#1A1A1A',
      letterSpacing: 0.5,
      marginBottom: spacing[2],
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 15,
      fontWeight: '400',
      color: '#666666',
      lineHeight: 22,
      paddingHorizontal: spacing[4],
      textAlign: 'center',
    },
    footerGradientOnly: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: FOOTER_PX,
      // Create a fading out effect at the bottom where cards spawn before entering
      backgroundColor: 'transparent',
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: FOOTER_PX,
      justifyContent: 'flex-end',
      paddingHorizontal: spacing[6],
      paddingBottom: spacing[6],
      // Gradient-like fade: semi-transparent top, solid bottom
      backgroundColor: 'transparent',
    },
    continueButton: {
      width: '100%',
    },
  });
}

function createCardStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      position: 'absolute',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      shadowColor: '#000000',
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardInner: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: spacing[4],
    },
    avatarContainer: {
      marginEnd: spacing[3],
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    avatarFallback: {
      backgroundColor: colors.primary[100],
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primary[600],
    },
    cardContent: {
      flex: 1,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing[1],
    },
    userName: {
      fontSize: 14,
      fontWeight: '700',
      color: '#1A1A1A',
      flex: 1,
      marginEnd: spacing[2],
    },
    stars: {
      fontSize: 13,
      color: '#FFB03A',
      letterSpacing: 1,
    },
    reviewText: {
      fontSize: 13,
      fontWeight: '400',
      color: '#4A4A4A',
      lineHeight: 19,
    },
  });
}

export default OnboardingSuccessStoriesScreen;
