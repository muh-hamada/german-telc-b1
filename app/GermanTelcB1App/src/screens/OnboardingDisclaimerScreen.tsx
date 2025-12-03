import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../types/navigation.types';
import { colors, spacing, typography } from '../theme';
import Button from '../components/Button';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCustomTranslation } from '../hooks/useCustomTranslation';

type OnboardingDisclaimerScreenProps = StackScreenProps<RootStackParamList, 'OnboardingDisclaimer'>;

const OnboardingDisclaimerScreen: React.FC<OnboardingDisclaimerScreenProps> = ({ navigation }) => {
  const { t } = useCustomTranslation();
  const [isChecked, setIsChecked] = useState(false);

  const handleContinue = async () => {
    if (!isChecked) return;

    try {
      logEvent(AnalyticsEvents.ONBOARDING_DISCLAIMER_ACCEPTED, { accepted: true });
      await AsyncStorage.setItem('hasLaunched', 'true');
      await AsyncStorage.setItem('disclaimerAccepted', 'true');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.log('Error saving launch state:', error);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };

  const toggleCheckbox = () => {
    setIsChecked(!isChecked);
    logEvent(AnalyticsEvents.ONBOARDING_DISCLAIMER_TOGGLED, { checked: !isChecked });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.iconContainer}>
          <Icon name="info-outline" size={30} color={colors.primary[500]} />

          <Text style={styles.title}>
            {t('onboarding.disclaimer.title')}
          </Text>
        </View>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            {t('onboarding.disclaimer.text1', { cleanText: false })}
          </Text>

          <Text style={[styles.disclaimerText, styles.disclaimerTextSpacing]}>
            {t('onboarding.disclaimer.text2', { cleanText: false })}
          </Text>

          <Text style={[styles.disclaimerText, styles.disclaimerTextSpacing]}>
            {t('onboarding.disclaimer.text3', { cleanText: false })}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={toggleCheckbox}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
            {isChecked && (
              <Icon name="check" size={20} color={colors.white} />
            )}
          </View>
          <Text style={styles.checkboxLabel}>
            {t('onboarding.disclaimer.checkboxLabel', { cleanText: false })}
          </Text>
        </TouchableOpacity>

        <Button
          title={t('common.continue')}
          onPress={handleContinue}
          style={styles.continueButton}
          disabled={!isChecked}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.textStyles.h3,
    color: colors.primary[500],
    textAlign: 'center',
    marginLeft: spacing.sm,
    marginRight: 0,
  },
  disclaimerBox: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  disclaimerText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
    textAlign: 'left',
  },
  disclaimerTextSpacing: {
    marginTop: spacing.md,
  },
  bottomContainer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.white,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary[500],
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary[500],
  },
  checkboxLabel: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 20,
  },
  continueButton: {
    width: '100%',
  },
});

export default OnboardingDisclaimerScreen;

