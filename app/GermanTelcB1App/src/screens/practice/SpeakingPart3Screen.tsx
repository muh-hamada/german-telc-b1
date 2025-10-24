import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import speakingPart3Data from '../../data/speaking-part3.json';
import AdBanner from '../../components/AdBanner';
import { HIDE_ADS } from '../../config/demo.config';

interface DialogueLine {
  speaker: string;
  line: string;
}

interface VocabularyItem {
  german: string;
  english: string;
}

interface PhraseItem {
  type: string;
  german: string;
  response: string;
}

interface Scenario {
  id: number;
  title: string;
  scenario: string;
  dialogue: DialogueLine[];
  vocabulary: VocabularyItem[];
  phrases: PhraseItem[];
}

type ViewType = 'dialog' | 'vocab' | 'phrases';

const SpeakingPart3Screen: React.FC = () => {
  const { t } = useTranslation();
  const [selectedScenarioId, setSelectedScenarioId] = useState<number>(1);
  const [activeView, setActiveView] = useState<ViewType>('dialog');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const scenarios = (speakingPart3Data as any).scenarios as Scenario[];
  const currentScenario = scenarios?.find(s => s.id === selectedScenarioId) || scenarios?.[0];

  const renderScenarioDropdown = () => {
    if (!scenarios || scenarios.length === 0) return null;
    
    return (
      <>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setIsDropdownOpen(true)}
        >
          <Text style={styles.dropdownButtonText}>
            {currentScenario?.title || t('speaking.part3.selectScenario')}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>

        <Modal
          visible={isDropdownOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsDropdownOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsDropdownOpen(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('speaking.part3.scenarioSelection')}</Text>
                <TouchableOpacity
                  onPress={() => setIsDropdownOpen(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={scenarios}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      selectedScenarioId === item.id && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setSelectedScenarioId(item.id);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedScenarioId === item.id && styles.dropdownItemTextActive,
                      ]}
                    >
                      {item.title}
                    </Text>
                    {selectedScenarioId === item.id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  };

  const renderDialogView = () => {
    if (!currentScenario || !currentScenario.dialogue) return null;
    
    return (
      <View style={styles.dialogView}>
        {currentScenario.dialogue.map((line, index) => (
          <View
            key={index}
            style={[
              styles.dialogBubbleContainer,
              line.speaker === 'A' ? styles.dialogBubbleLeft : styles.dialogBubbleRight,
            ]}
          >
            <View
              style={[
                styles.dialogBubble,
                line.speaker === 'A' ? styles.dialogBubbleA : styles.dialogBubbleB,
              ]}
            >
              <Text style={styles.speakerLabel}>{line.speaker}:</Text>
              <Text style={styles.dialogText}>{line.line}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderVocabView = () => {
    if (!currentScenario || !currentScenario.vocabulary) return null;
    
    return (
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <View style={styles.tableHeaderCell}>
            <Text style={styles.tableHeaderText}>{t('speaking.part3.tableHeaders.german')}</Text>
          </View>
          <View style={styles.tableHeaderCell}>
            <Text style={styles.tableHeaderText}>{t('speaking.part3.tableHeaders.english')}</Text>
          </View>
        </View>
        {currentScenario.vocabulary.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={styles.tableCell}>
              <Text style={styles.tableCellTextGerman}>{item.german}</Text>
            </View>
            <View style={styles.tableCell}>
              <Text style={styles.tableCellText}>{item.english}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderPhrasesView = () => {
    if (!currentScenario || !currentScenario.phrases) return null;
    
    return (
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <View style={styles.tableHeaderCell}>
            <Text style={styles.tableHeaderText}>{t('speaking.part3.tableHeaders.suggestion')}</Text>
          </View>
          <View style={styles.tableHeaderCell}>
            <Text style={styles.tableHeaderText}>{t('speaking.part3.tableHeaders.response')}</Text>
          </View>
        </View>
        {currentScenario.phrases.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={styles.tableCell}>
              <Text style={styles.tableCellTextGerman}>{item.german}</Text>
            </View>
            <View style={styles.tableCell}>
              <Text style={styles.tableCellText}>{item.response}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Scenario Selection */}
        <Text style={styles.sectionTitle}>{t('speaking.part3.sections.scenarioSelectionLabel')}</Text>
        <View style={styles.section}>
          {renderScenarioDropdown()}
        </View>

        {/* Main Content */}
        {currentScenario && (
          <View style={styles.mainCard}>
            <View style={styles.headerContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.scenarioTitle}>{currentScenario.title}</Text>
                <Text style={styles.scenarioDescription}>{currentScenario.scenario}</Text>
            </View>

            {/* View Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeView === 'dialog' && styles.activeTab]}
                onPress={() => setActiveView('dialog')}
              >
                <Text style={[styles.tabText, activeView === 'dialog' && styles.activeTabText]}>
                  {t('speaking.part3.tabs.dialog')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeView === 'vocab' && styles.activeTab]}
                onPress={() => setActiveView('vocab')}
              >
                <Text style={[styles.tabText, activeView === 'vocab' && styles.activeTabText]}>
                  {t('speaking.part3.tabs.vocabulary')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeView === 'phrases' && styles.activeTab]}
                onPress={() => setActiveView('phrases')}
              >
                <Text style={[styles.tabText, activeView === 'phrases' && styles.activeTabText]}>
                  {t('speaking.part3.tabs.phrases')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* View Content */}
          <View style={styles.contentContainer}>
            {activeView === 'dialog' && renderDialogView()}
            {activeView === 'vocab' && renderVocabView()}
            {activeView === 'phrases' && renderPhrasesView()}
          </View>
        </View>
        )}
      </ScrollView>
      {!HIDE_ADS && <AdBanner />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.padding.lg,
  },
  sectionTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  section: {
    marginBottom: spacing.margin.lg,
  },
  dropdownButton: {
    width: '100%',
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary[500],
    backgroundColor: colors.background.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  dropdownArrow: {
    ...typography.textStyles.body,
    color: colors.primary[500],
    marginLeft: spacing.margin.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.padding.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  modalTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.padding.xs,
  },
  closeButtonText: {
    ...typography.textStyles.h3,
    color: colors.text.secondary,
  },
  dropdownItem: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[100],
  },
  dropdownItemActive: {
    backgroundColor: colors.primary[50],
  },
  dropdownItemText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  dropdownItemTextActive: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },
  checkmark: {
    ...typography.textStyles.h3,
    color: colors.primary[500],
    marginLeft: spacing.margin.sm,
  },
  mainCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.padding.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContainer: {
    marginBottom: spacing.margin.lg,
  },
  titleContainer: {
    marginBottom: spacing.margin.md,
  },
  scenarioTitle: {
    ...typography.textStyles.h2,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  scenarioDescription: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    fontStyle: 'italic' as 'italic',
    lineHeight: 22,
  },
  tabsContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    backgroundColor: colors.secondary[100],
    borderRadius: spacing.borderRadius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.padding.sm,
    paddingHorizontal: spacing.padding.xs,
    borderRadius: spacing.borderRadius.sm,
  },
  activeTab: {
    backgroundColor: colors.primary[500],
  },
  tabText: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  activeTabText: {
    color: colors.background.secondary,
  },
  contentContainer: {
    marginTop: spacing.margin.md,
  },
  dialogView: {
    gap: spacing.margin.md,
  },
  dialogBubbleContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    marginBottom: spacing.margin.sm,
  },
  dialogBubbleLeft: {
    justifyContent: 'flex-start',
  },
  dialogBubbleRight: {
    justifyContent: 'flex-end',
  },
  dialogBubble: {
    maxWidth: '80%',
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
  },
  dialogBubbleA: {
    backgroundColor: '#E3F2FD',
  },
  dialogBubbleB: {
    backgroundColor: '#F3E5F5',
  },
  speakerLabel: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  dialogText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: colors.secondary[200],
    borderRadius: spacing.borderRadius.md,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    backgroundColor: colors.secondary[100],
  },
  tableHeaderCell: {
    flex: 1,
    padding: spacing.padding.sm,
    borderRightWidth: 1,
    borderRightColor: colors.secondary[200],
  },
  tableHeaderText: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase' as 'uppercase',
  },
  tableRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    borderTopWidth: 1,
    borderTopColor: colors.secondary[200],
  },
  tableCell: {
    flex: 1,
    padding: spacing.padding.sm,
    borderRightWidth: 1,
    borderRightColor: colors.secondary[200],
  },
  tableCellTextGerman: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  tableCellText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
});

export default SpeakingPart3Screen;
