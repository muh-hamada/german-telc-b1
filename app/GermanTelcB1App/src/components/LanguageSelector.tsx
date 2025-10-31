import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../theme';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
];

interface LanguageSelectorProps {
  onLanguageSelect?: (languageCode: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  onLanguageSelect,
}) => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    i18n.changeLanguage(languageCode);
    onLanguageSelect?.(languageCode);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('onboarding.selectLanguage')}</Text>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {languages.map((language) => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.languageItem,
              selectedLanguage === language.code && styles.selectedLanguageItem,
            ]}
            onPress={() => handleLanguageSelect(language.code)}
            activeOpacity={0.7}
          >
            <Text style={styles.flag}>{language.flag}</Text>
            <View style={styles.languageContent}>
              <Text
                style={[
                  styles.languageName,
                  selectedLanguage === language.code && styles.selectedLanguageName,
                ]}
              >
                {language.nativeName}
              </Text>
              <Text
                style={[
                  styles.languageCode,
                  selectedLanguage === language.code && styles.selectedLanguageCode,
                ]}
              >
                {language.name}
              </Text>
            </View>
            {selectedLanguage === language.code && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.padding.lg,
    width: '100%',
  },
  title: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.margin.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.padding.lg,
    alignSelf: 'center',
  },
  languageItem: {
    width: '80%',
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    marginBottom: spacing.margin.sm,
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  flag: {
    fontSize: 32,
    marginRight: spacing.margin.md,
  },
  selectedLanguageItem: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  languageContent: {
    flex: 1,
  },
  languageName: {
    ...typography.textStyles.bodyLarge,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 0,
  },
  selectedLanguageName: {
    color: colors.primary[700],
  },
  languageCode: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    marginBottom: 0,
  },
  selectedLanguageCode: {
    color: colors.primary[600],
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
  },
});

export default LanguageSelector;
