import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import speakingPart3Data from '../../data/speaking-part3.json';

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

  const scenarios = (speakingPart3Data as any).scenarios as Scenario[];
  const currentScenario = scenarios?.find(s => s.id === selectedScenarioId) || scenarios?.[0];

  const renderScenarioButtons = () => {
    if (!scenarios || scenarios.length === 0) return null;
    
    return (
      <View style={styles.scenarioButtonsContainer}>
        {scenarios.map(scenario => (
          <TouchableOpacity
            key={scenario.id}
            style={[
              styles.scenarioButton,
              selectedScenarioId === scenario.id && styles.scenarioButtonActive,
            ]}
            onPress={() => {
              setSelectedScenarioId(scenario.id);
            }}
          >
            <Text
              style={[
                styles.scenarioButtonText,
                selectedScenarioId === scenario.id && styles.scenarioButtonTextActive,
              ]}
            >
              {scenario.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
            <Text style={styles.tableHeaderText}>Deutsch</Text>
          </View>
          <View style={styles.tableHeaderCell}>
            <Text style={styles.tableHeaderText}>English</Text>
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
            <Text style={styles.tableHeaderText}>Vorschlag / Aufgabe</Text>
          </View>
          <View style={styles.tableHeaderCell}>
            <Text style={styles.tableHeaderText}>Beispiel-Reaktion</Text>
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
        <View style={styles.section}>
          {renderScenarioButtons()}
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
                  Dialog
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeView === 'vocab' && styles.activeTab]}
                onPress={() => setActiveView('vocab')}
              >
                <Text style={[styles.tabText, activeView === 'vocab' && styles.activeTabText]}>
                  Vokabular
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeView === 'phrases' && styles.activeTab]}
                onPress={() => setActiveView('phrases')}
              >
                <Text style={[styles.tabText, activeView === 'phrases' && styles.activeTabText]}>
                  Redemittel
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
  section: {
    marginBottom: spacing.margin.lg,
  },
  scenarioButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.margin.sm,
  },
  scenarioButton: {
    paddingVertical: spacing.padding.sm,
    paddingHorizontal: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.background.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  scenarioButtonActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scenarioButtonText: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  scenarioButtonTextActive: {
    color: colors.primary[700],
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
    flexDirection: 'row',
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
    flexDirection: 'row',
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
    flexDirection: 'row',
    backgroundColor: colors.secondary[100],
  },
  tableHeaderCell: {
    flex: 1,
    padding: spacing.padding.sm,
    borderRightWidth: 1,
    borderRightColor: colors.gray[200],
  },
  tableHeaderText: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase' as 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  tableCell: {
    flex: 1,
    padding: spacing.padding.sm,
    borderRightWidth: 1,
    borderRightColor: colors.gray[200],
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
