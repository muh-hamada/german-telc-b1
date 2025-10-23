import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import RNRestart from 'react-native-restart';
import { colors, spacing, typography } from '../theme';
import Button from '../components/Button';
import ProgressCard from '../components/ProgressCard';
import CompletionStatsCard from '../components/CompletionStatsCard';
import LoginModal from '../components/LoginModal';
import LanguageSelectorModal from '../components/LanguageSelectorModal';
import { useProgress } from '../contexts/ProgressContext';
import { useAuth } from '../contexts/AuthContext';
import { useCompletion } from '../contexts/CompletionContext';
import { DEMO_MODE } from '../config/demo.config';
import { checkRTLChange } from '../utils/i18n';

const ProfileScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { clearUserProgress, isLoading } = useProgress();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { allStats, isLoading: statsLoading } = useCompletion();
  const [isClearing, setIsClearing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const handleClearProgress = () => {
    Alert.alert(
      t('profile.alerts.clearProgressTitle'),
      t('profile.alerts.clearProgressMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.alerts.clear'),
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            const success = await clearUserProgress();
            setIsClearing(false);
            
            if (success) {
              Alert.alert(t('common.success'), t('profile.alerts.progressCleared'));
            } else {
              Alert.alert(t('common.error'), t('profile.alerts.clearFailed'));
            }
          },
        },
      ]
    );
  };

  const handleLanguageChange = () => {
    setShowLanguageModal(true);
  };

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      const needsRestart = checkRTLChange(languageCode);
      await i18n.changeLanguage(languageCode);
      
      if (needsRestart) {
        // Switching between RTL and LTR requires app restart
        const isGoingToRTL = languageCode === 'ar';
        Alert.alert(
          t('common.success'),
          isGoingToRTL 
            ? 'اللغة تم تغييرها بنجاح. سيتم إعادة تشغيل التطبيق الآن لتطبيق اتجاه النص من اليمين إلى اليسار.\n\nLanguage changed successfully. The app will restart now to apply right-to-left layout.'
            : 'Language changed successfully. The app will restart now to apply left-to-right layout.\n\nتم تغيير اللغة بنجاح. سيتم إعادة تشغيل التطبيق الآن لتطبيق اتجاه النص.',
          [
            {
              text: t('common.cancel'),
              style: 'cancel',
            },
            {
              text: 'Restart / إعادة التشغيل',
              style: 'default',
              onPress: () => {
                // Give a small delay to ensure language is saved
                setTimeout(() => {
                  RNRestart.restart();
                }, 100);
              },
            },
          ]
        );
      } else {
        Alert.alert(t('common.success'), t('profile.alerts.languageChanged'));
      }
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(t('common.error'), t('profile.alerts.languageChangeFailed'));
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      t('profile.alerts.signOutTitle'),
      t('profile.alerts.signOutMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.signOut'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              Alert.alert(t('common.success'), t('profile.alerts.signedOut'));
            } catch (error) {
              Alert.alert(t('common.error'), t('profile.alerts.signOutFailed'));
            }
          },
        },
      ]
    );
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    Alert.alert(t('common.success'), t('profile.alerts.signedInSuccess'));
  };

  const handleLoginFailure = () => {
    Alert.alert(t('common.error'), t('profile.alerts.signInFailed'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t('profile.title')}</Text>
        
        {/* User Info Section */}
        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
            <View style={styles.userInfo}>
              {user.photoURL && (
                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
              )}
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user.displayName || t('common.user')}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userProvider}>
                  {t('profile.signedInWith')} {user.provider.charAt(0).toUpperCase() + user.provider.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Progress Section */}
        <View style={styles.section}>
          <ProgressCard showDetails={true} />
        </View>

        {/* Completion Statistics Section */}
        {user && (
          <View style={styles.section}>
            <CompletionStatsCard stats={allStats} isLoading={statsLoading} />
          </View>
        )}

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
          
          <Button
            title={t('profile.changeLanguage')}
            onPress={handleLanguageChange}
            variant="outline"
            style={styles.settingButton}
          />
          
          <Button
            title={t('profile.clearProgress')}
            onPress={handleClearProgress}
            variant="outline"
            style={[styles.settingButton, styles.dangerButton]}
            disabled={isClearing || isLoading}
          />
        </View>

        {/* Authentication Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
          
          {user ? (
            <Button
              title={t('profile.signOut')}
              onPress={handleSignOut}
              variant="outline"
              style={[styles.settingButton, styles.dangerButton]}
              disabled={authLoading}
            />
          ) : (
            <Button
              title={t('profile.signIn')}
              onPress={() => setShowLoginModal(true)}
              variant="outline"
              style={styles.settingButton}
            />
          )}
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.about')}</Text>
          <Text style={styles.aboutText}>
            {t('profile.appName')}
          </Text>
          <Text style={styles.versionText}>{t('profile.version')}</Text>
        </View>
      </ScrollView>

      {/* Login Modal */}
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
        onFailure={handleLoginFailure}
      />

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        onLanguageSelect={handleLanguageSelect}
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
  },
  scrollContent: {
    padding: spacing.padding.lg,
  },
  title: {
    ...typography.textStyles.h2,
    color: colors.text.primary,
    marginBottom: spacing.margin.lg,
  },
  section: {
    marginBottom: spacing.margin.xl,
  },
  sectionTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.md,
  },
  settingButton: {
    marginBottom: spacing.margin.sm,
  },
  dangerButton: {
    borderColor: colors.error[500],
  },
  aboutText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.margin.xs,
  },
  versionText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.tertiary,
  },
  userInfo: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.margin.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  userEmail: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.margin.xs,
  },
  userProvider: {
    ...typography.textStyles.bodySmall,
    color: colors.text.tertiary,
  },
});

export default ProfileScreen;
