/**
 * Premium Screen
 * 
 * Full purchase screen for premium features.
 * Uses shared PremiumContent component.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  I18nManager,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import LoginModal from '../components/LoginModal';
import PremiumContent from '../components/PremiumContent';
import AlreadyPremiumView from '../components/AlreadyPremiumView';

const PremiumScreen: React.FC = () => {
  const { t } = useCustomTranslation();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isPremium, isPurchasing, purchasePremium, restorePurchases, productPrice, productCurrency } = usePremium();
  const [isRestoring, setIsRestoring] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  React.useEffect(() => {
    logEvent(AnalyticsEvents.PREMIUM_SCREEN_OPENED, {
      price: productPrice,
      currency: productCurrency,
    });
  }, [productPrice, productCurrency]);

  const handlePurchase = async () => {
    logEvent(AnalyticsEvents.PREMIUM_SCREEN_PURCHASE_CLICKED, {
      price: productPrice,
      currency: productCurrency,
    });
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    await purchasePremium();
  };

  const handleRestore = async () => {
    logEvent(AnalyticsEvents.PREMIUM_SCREEN_RESTORE_CLICKED, {
      price: productPrice,
      currency: productCurrency,
    });
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    setIsRestoring(true);
    const success = await restorePurchases();
    setIsRestoring(false);

    if (success) {
      Alert.alert(t('common.success'), t('premium.screen.restoreSuccess'));
    } else {
      Alert.alert(t('common.error'), t('premium.screen.noRestoreFound'));
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Already premium view
  if (isPremium) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity onPress={handleBack} style={[styles.backButton, { top: insets.top + spacing.margin.md }]}>
          <Icon name={I18nManager.isRTL ? "chevron-right" : "chevron-left"} size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <AlreadyPremiumView />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Back button */}
      <TouchableOpacity onPress={handleBack} style={[styles.backButton, { top: insets.top + spacing.margin.md }]}>
        <Icon name={I18nManager.isRTL ? "chevron-right" : "chevron-left"} size={20} color={colors.text.primary} />
      </TouchableOpacity>

      {/* Shared content */}
      <View style={styles.contentContainer}>
        <PremiumContent
          onPurchase={handlePurchase}
          onRestore={handleRestore}
          isPurchasing={isPurchasing}
          isRestoring={isRestoring}
          showRestoreButton={true}
        />
      </View>

      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    flex: 1,
    marginTop: 40,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default PremiumScreen;
