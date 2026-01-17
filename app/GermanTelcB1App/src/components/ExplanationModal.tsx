import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';

interface ExplanationModalProps {
  visible: boolean;
  onClose: () => void;
  explanation: Record<string, string> | undefined;
  transcript?: string;
}

const ExplanationModal: React.FC<ExplanationModalProps> = ({
  visible,
  onClose,
  explanation,
  transcript,
}) => {
  const { t, i18n } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const currentLang = i18n.language;
  // Fallback to English, then German, then any available key
  const localizedExplanation = explanation 
    ? (explanation[currentLang] || explanation['en'] || explanation['de'] || Object.values(explanation)[0])
    : '';

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
              <Text style={styles.title}>{t('results.explanationTitle') || 'Explanation'}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.scrollView} 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Explanation Section */}
              {localizedExplanation ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('results.explanation') || 'Explanation'}</Text>
                  <Text style={styles.explanationText}>{localizedExplanation}</Text>
                </View>
              ) : null}

              {/* Transcript Section */}
              {transcript ? (
                <View style={[styles.section, styles.transcriptSection]}>
                  <Text style={styles.sectionTitle}>{t('results.transcript') || 'Transcript'}</Text>
                  <Text style={styles.transcriptText}>{transcript}</Text>
                </View>
              ) : null}

              {!localizedExplanation && !transcript && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>{t('results.noExplanationAvailable') || 'No explanation available.'}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      backgroundColor: colors.background.secondary,
      borderTopLeftRadius: spacing.borderRadius.xl,
      borderTopRightRadius: spacing.borderRadius.xl,
      maxHeight: '80%',
      width: '100%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.padding.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    title: {
      ...typography.textStyles.h3,
      color: colors.text.primary,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.secondary[100],
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: 18,
      color: colors.text.secondary,
    },
    scrollView: {
      padding: spacing.padding.lg,
    },
    scrollContent: {
      paddingBottom: spacing.padding.xl,
    },
    section: {
      // marginBottom: spacing.margin.md,
    },
    sectionTitle: {
      ...typography.textStyles.h4,
      color: colors.text.primary,
      marginBottom: spacing.margin.sm,
    },
    explanationText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      lineHeight: 24,
    },
    transcriptSection: {
      marginTop: spacing.margin.md,
      paddingTop: spacing.padding.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    transcriptText: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      fontStyle: 'italic',
      lineHeight: 22,
    },
    emptyState: {
      padding: spacing.padding.xl,
      alignItems: 'center',
    },
    emptyText: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
    },
  });

export default ExplanationModal;
