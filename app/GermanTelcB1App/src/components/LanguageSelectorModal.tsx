import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../theme';

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onLanguageSelect: (languageCode: string) => void;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
];

const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  visible,
  onClose,
  onLanguageSelect,
}) => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageSelect(languageCode);
    onClose();
  };

  const renderLanguageItem = ({ item }: { item: Language }) => {
    const isSelected = currentLanguage === item.code;

    return (
      <TouchableOpacity
        style={[styles.languageItem, isSelected && styles.selectedLanguageItem]}
        onPress={() => handleLanguageSelect(item.code)}
      >
        <Text style={styles.flag}>{item.flag}</Text>
        <View style={styles.languageInfo}>
          <Text style={[styles.languageName, isSelected && styles.selectedLanguageName]}>
            {item.nativeName}
          </Text>
          <Text style={styles.languageNameSecondary}>{item.name}</Text>
        </View>
        {isSelected && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Select Language</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Language List */}
            <FlatList
              data={LANGUAGES}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item.code}
              style={styles.languageList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: spacing.borderRadius.xl,
    borderTopRightRadius: spacing.borderRadius.xl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.padding.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.padding.sm,
  },
  closeButtonText: {
    ...typography.textStyles.h3,
    color: colors.text.secondary,
  },
  languageList: {
    padding: spacing.padding.md,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.margin.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedLanguageItem: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  flag: {
    fontSize: 32,
    marginRight: spacing.margin.md,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  selectedLanguageName: {
    color: colors.primary[600],
  },
  languageNameSecondary: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
  checkmark: {
    ...typography.textStyles.h3,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.bold,
  },
});

export default LanguageSelectorModal;

