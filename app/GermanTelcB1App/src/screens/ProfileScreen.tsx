import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../theme';
import Button from '../components/Button';
import ProgressCard from '../components/ProgressCard';
import LoginModal from '../components/LoginModal';
import LanguageSelectorModal from '../components/LanguageSelectorModal';
import { useProgress } from '../contexts/ProgressContext';
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { clearUserProgress, isLoading } = useProgress();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const [isClearing, setIsClearing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const handleClearProgress = () => {
    Alert.alert(
      'Clear Progress',
      'Are you sure you want to clear all your progress? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            const success = await clearUserProgress();
            setIsClearing(false);
            
            if (success) {
              Alert.alert('Success', 'Your progress has been cleared.');
            } else {
              Alert.alert('Error', 'Failed to clear progress. Please try again.');
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
      await i18n.changeLanguage(languageCode);
      Alert.alert('Success', 'Language changed successfully!');
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert('Error', 'Failed to change language. Please try again.');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              Alert.alert('Success', 'You have been signed out.');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    Alert.alert('Success', 'You have been signed in successfully!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t('profile.title')}</Text>
        
        {/* User Info Section */}
        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.userInfo}>
              {user.photoURL && (
                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
              )}
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user.displayName || 'User'}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userProvider}>
                  Signed in with {user.provider.charAt(0).toUpperCase() + user.provider.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <ProgressCard showDetails={true} />
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <Button
            title="Change Language"
            onPress={handleLanguageChange}
            variant="outline"
            style={styles.settingButton}
          />
          
          <Button
            title="Clear Progress"
            onPress={handleClearProgress}
            variant="outline"
            style={[styles.settingButton, styles.dangerButton]}
            disabled={isClearing || isLoading}
          />
        </View>

        {/* Authentication Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          {user ? (
            <Button
              title="Sign Out"
              onPress={handleSignOut}
              variant="outline"
              style={[styles.settingButton, styles.dangerButton]}
              disabled={authLoading}
            />
          ) : (
            <Button
              title="Sign In"
              onPress={() => setShowLoginModal(true)}
              variant="outline"
              style={styles.settingButton}
            />
          )}
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            German TELC B1 Exam Preparation App
          </Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Login Modal */}
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
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
    flexDirection: 'row',
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
