import React, { useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import mobileAds from 'react-native-google-mobile-ads';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';
import Card from '../components/Card';
import HomeProgressCard from '../components/HomeProgressCard';
import HomeHeader from '../components/HomeHeader';
import AnimatedGradientBorder from '../components/AnimatedGradientBorder';
import SupportAdButton from '../components/SupportAdButton';
import { HomeStackNavigationProp } from '../types/navigation.types';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation.types';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import attService, { TrackingStatus } from '../services/app-tracking-transparency.service';
import consentService, { AdsConsentStatus } from '../services/consent.service';
import { useModalQueue } from '../contexts/ModalQueueContext';
import LoginModal from '../components/LoginModal';
import { usePremium } from '../contexts/PremiumContext';

type HomeScreenNavigationProp = CompositeNavigationProp<
  HomeStackNavigationProp,
  BottomTabNavigationProp<MainTabParamList>
>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { t } = useCustomTranslation();
  const { enqueue } = useModalQueue();
  const { isPremium, isLoading: isPremiumLoading } = usePremium();
  const insets = useSafeAreaInsets();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    // Initialize ads with consent flow when user lands on home screen
    // This ensures onboarding is complete and user is "in" the app
    initializeAdsWithConsent();
  }, []);

  /**
   * Initialize Google Mobile Ads with ATT and UMP consent flow
   * 
   * Order of operations (CRITICAL for Apple compliance):
   * 1. Request GDPR/CCPA consent (UMP)
   * 2. Request App Tracking Transparency (ATT) permission (iOS only)
   * 3. Initialize ads SDK
   */
  const initializeAdsWithConsent = async () => {
    try {
      // Check if consent is already handled to avoid unnecessary processing
      const currentConsent = consentService.getConsentStatus();
      if (currentConsent === AdsConsentStatus.OBTAINED || currentConsent === AdsConsentStatus.NOT_REQUIRED) {
        // If already consented/not required, just ensure ads are initialized
        // We don't want to show forms again if not needed
        await mobileAds().initialize();
        return;
      }

      // Step 1: Request and handle user consent (GDPR/US Privacy) - Show this FIRST
      // Apple Guideline 5.1.1: If the app shows the GDPR prompt before showing the App Tracking Transparency permission request, there is no need to modify the wording of the GDPR prompt.
      console.log('[HomeScreen] Starting UMP consent flow...');
      
      const consentStatus = await consentService.requestConsent();
      console.log('[HomeScreen] UMP consent flow completed with status:', consentStatus);

      // Step 2: Request App Tracking Transparency (ATT) permission (iOS 14+)
      // We request this AFTER the GDPR form to avoid confusing the user (asking for tracking after they might have just said no in ATT)
      let attStatus: TrackingStatus = 'not-determined';
      
      if (consentStatus === AdsConsentStatus.OBTAINED || consentStatus === AdsConsentStatus.NOT_REQUIRED) {
        console.log('[HomeScreen] Requesting App Tracking Transparency permission...');
        // Add a small delay to ensure the UMP dialog is fully dismissed before showing ATT
        // This prevents UI conflicts and ensures the user is ready for the next prompt
        await new Promise<void>(resolve => setTimeout(resolve, 500));
        attStatus = await attService.requestPermission();
        console.log('[HomeScreen] ATT permission status:', attStatus);
      } else {
        console.log('[HomeScreen] Skipping ATT permission request due to consent status:', consentStatus);
      }
      
      // Step 3: Initialize Google Mobile Ads SDK after all consents
      console.log('[HomeScreen] Initializing Google Mobile Ads...');
      const adapterStatuses = await mobileAds().initialize();
      console.log('[HomeScreen] Mobile Ads initialized:', adapterStatuses);
      
      // Log tracking and personalization status
      if (consentService.canShowPersonalizedAds() && attStatus === 'authorized') {
        console.log('[HomeScreen] ✓ Full tracking enabled - personalized ads allowed');
      } else {
        console.log('[HomeScreen] ⚠ Limited ad personalization');
      }
    } catch (error) {
      console.error('[HomeScreen] Error during ads initialization:', error);
      // Even if consent fails, try to initialize ads (will use non-personalized)
      try {
        await mobileAds().initialize();
      } catch (adsError) {
        console.error('[HomeScreen] Failed to initialize Mobile Ads:', adsError);
      }
    }
  };

  const handleExamStructurePress = () => {
    logEvent(AnalyticsEvents.EXAM_STRUCTURE_OPENED);
    navigation.navigate('ExamStructure');
  };

  const handleSolveQuestionsPress = () => {
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'practice_menu' });
    navigation.navigate('PracticeMenu');
  };

  const handleListeningPracticePress = () => {
    logEvent(AnalyticsEvents.LISTENING_PRACTICE_SECTION_OPENED);
    navigation.navigate('ListeningPracticeList');
  };

  const handleVocabularyPress = () => {
    logEvent(AnalyticsEvents.VOCABULARY_HOME_OPENED);
    // Check if user has completed onboarding (has persona set)
    // For now, navigate directly to VocabularyHome
    navigation.navigate('VocabularyHome');
  };

  const handleLoginPress = () => {
    logEvent(AnalyticsEvents.PROGRESS_CARD_LOGIN_NAVIGATED);
    setShowLoginModal(true);
  };

  const handleViewFullStats = () => {
    logEvent(AnalyticsEvents.PROGRESS_CARD_VIEW_FULL_STATS);
    navigation.navigate('ProfileStack', { screen: 'Profile' });
  };

  const handleGrammarStudyPress = () => {
    logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'grammar_study' });
    navigation.navigate('GrammarStudy');
  };

  const handleNavigateToPremium = () => {
    // open premium modal
    // enqueue premium modal
    logEvent(AnalyticsEvents.PREMIUM_HOME_BUTTON_CLICKED);
    enqueue('premium-upsell');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />

        <HomeProgressCard
          onLoginPress={handleLoginPress}
          onViewFullStats={handleViewFullStats}
        />

        <Card style={styles.card} onPress={handleExamStructurePress}>
          <Text style={styles.cardTitle}>{t('home.examStructure')}</Text>
          <Text style={styles.cardDescription}>
            {t('home.descriptions.examStructure')}
          </Text>
        </Card>

        <Card style={styles.card} onPress={handleSolveQuestionsPress}>
          <Text style={styles.cardTitle}>{t('home.solve')}</Text>
          <Text style={styles.cardDescription}>
            {t('home.descriptions.solve')}
          </Text>
        </Card>

        <AnimatedGradientBorder
          borderWidth={2}
          borderRadius={12}
          colors={['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#667eea']}
          duration={4000}
          style={{ ...styles.card, ...styles.animatedCard }}
        >
          <Card style={styles.cardInner} onPress={handleListeningPracticePress}>
            <Text style={styles.newLabel}>{t('home.newLabel')}</Text>
            <Text style={styles.cardTitle}>{t('home.listeningPractice')}</Text>
            <Text style={styles.cardDescription}>
              {t('home.descriptions.listeningPractice')}
            </Text>
          </Card>
        </AnimatedGradientBorder>

        <AnimatedGradientBorder
          borderWidth={2}
          borderRadius={12}
          colors={['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#667eea']}
          duration={4000}
          style={{ ...styles.card, ...styles.animatedCard }}
        >
          <Card style={styles.cardInner} onPress={handleVocabularyPress}>
            <Text style={styles.newLabel}>{t('home.newLabel')}</Text>
            <Text style={styles.cardTitle}>{t('home.vocabulary')}</Text>
            <Text style={styles.cardDescription}>
              {t('home.descriptions.vocabulary')}
            </Text>
          </Card>
        </AnimatedGradientBorder>

        {/* Support Ad Button */}
        <SupportAdButton screen="home" style={styles.supportAdButton} />

        {/* Grammar Study Card */}
        <Card style={styles.card} onPress={handleGrammarStudyPress}>
          <Text style={styles.cardTitle}>{t('practice.grammar.study.title')}</Text>
          <Text style={styles.cardDescription}>
            {t('practice.grammar.study.description')}
          </Text>
        </Card>
      </ScrollView>

      {!isPremium && !isPremiumLoading && (
        <View style={[styles.premiumButtonWrapper, { top: insets.top + spacing.margin.md }]}>
          <AnimatedGradientBorder
            borderWidth={2}
            borderRadius={32}
            colors={['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#667eea']} 
            duration={500}
            style={styles.premiumButtonContainer}
          >
            <TouchableOpacity onPress={handleNavigateToPremium} style={styles.premiumButtonTouch}>
              <Image source={require('../../assets/images/diamond.gif')} style={styles.diamondImage} />
            </TouchableOpacity>
          </AnimatedGradientBorder>
        </View>
      )}

      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
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
    position: 'relative',
  },
  scrollContent: {
    padding: spacing.padding.lg,
    paddingTop: 0,
    gap: spacing.margin.md,
  },
  card: {
    minHeight: 120,
    justifyContent: 'center',
  },
  animatedCard: {
    // ...spacing.shadow.xs,
  },
  cardInner: {
    minHeight: 120,
    justifyContent: 'center',
    borderWidth: 0,
  },
  newLabel: {
    position: 'absolute',
    top: 10,
    right: 11,
    textTransform: 'uppercase',
    color: colors.black,
    fontSize: 10,
  },
  cardTitle: {
    ...typography.textStyles.h3,
    color: colors.primary[500],
    marginBottom: spacing.margin.sm,
    textAlign: 'left',
  },
  cardDescription: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    lineHeight: 24,
    textAlign: 'left',
  },
  supportAdButton: {
    marginTop: spacing.margin.sm,
  },
  premiumButtonWrapper: {
    position: 'absolute',
    right: spacing.margin.lg,
    zIndex: 1000,
    ...spacing.shadow.lg,
  },
  premiumButtonContainer: {
    height: 60,
    width: 60,
  },
  premiumButtonTouch: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  diamondImage: {
    width: 50,
    height: 50,
  },
});

export default HomeScreen;
