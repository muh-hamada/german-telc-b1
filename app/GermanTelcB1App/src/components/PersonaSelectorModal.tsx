import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';
import { UserPersona, PERSONA_DAILY_LIMITS } from '../types/vocabulary.types';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';

interface PersonaSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onPersonaSelect: (persona: UserPersona) => void;
  currentPersona: UserPersona;
}

interface PersonaOption {
  persona: UserPersona;
  icon: string;
}

const PERSONA_OPTIONS: PersonaOption[] = [
  { persona: 'beginner', icon: '🐢' },
  { persona: 'casual', icon: '🚶' },
  { persona: 'serious', icon: '🚀' },
];

const PersonaSelectorModal: React.FC<PersonaSelectorModalProps> = ({
  visible,
  onClose,
  onPersonaSelect,
  currentPersona,
}) => {
  const { t } = useCustomTranslation();

  React.useEffect(() => {
    if (visible) {
      logEvent(AnalyticsEvents.VOCABULARY_PERSONA_MODAL_OPENED, {
        current_persona: currentPersona,
      });
    }
  }, [visible, currentPersona]);

  const handlePersonaSelect = (persona: UserPersona) => {
    onPersonaSelect(persona);
    onClose();
  };

  const handleClose = () => {
    logEvent(AnalyticsEvents.VOCABULARY_PERSONA_MODAL_CLOSED, {
      current_persona: currentPersona,
    });
    onClose();
  };

  const renderPersonaItem = ({ item }: { item: PersonaOption }) => {
    const isSelected = currentPersona === item.persona;
    const dailyLimit = PERSONA_DAILY_LIMITS[item.persona];

    return (
      <TouchableOpacity
        style={[styles.personaItem, isSelected && styles.selectedPersonaItem]}
        onPress={() => handlePersonaSelect(item.persona)}
      >
        <Text style={styles.icon}>{item.icon}</Text>
        <View style={styles.personaInfo}>
          <Text style={[styles.personaName, isSelected && styles.selectedPersonaName]}>
            {t(`vocabulary.persona.${item.persona}`)}
          </Text>
          <Text style={styles.personaDescription}>
            {t('vocabulary.progress.dailyLimit', { count: dailyLimit })}
          </Text>
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
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{t('vocabulary.progress.selectPersona')}</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>
                {t('vocabulary.progress.personaDescription')}
              </Text>
            </View>

            {/* Persona List */}
            <FlatList
              data={PERSONA_OPTIONS}
              renderItem={renderPersonaItem}
              keyExtractor={(item) => item.persona}
              style={styles.personaList}
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
  descriptionContainer: {
    padding: spacing.padding.lg,
    paddingBottom: spacing.padding.md,
  },
  description: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  personaList: {
    padding: spacing.padding.md,
  },
  personaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.margin.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPersonaItem: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  icon: {
    fontSize: 32,
    marginRight: spacing.margin.md,
    marginLeft: 0,
  },
  personaInfo: {
    flex: 1,
  },
  personaName: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  selectedPersonaName: {
    color: colors.primary[600],
  },
  personaDescription: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
  checkmark: {
    ...typography.textStyles.h3,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.bold,
  },
});

export default PersonaSelectorModal;

