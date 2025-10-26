import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  I18nManager,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, typography } from '../../theme';
import dataService from '../../services/data.service';
import { useExamCompletion } from '../../contexts/CompletionContext';
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

type SpeakingPart3ScreenRouteProp = RouteProp<{ params: { scenarioId: number } }, 'params'>;

const SpeakingPart3Screen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<SpeakingPart3ScreenRouteProp>();
  const navigation = useNavigation();
  const scenarioId = route.params?.scenarioId ?? 0;
  
  const { isCompleted, toggleCompletion } = useExamCompletion('speaking', 3, scenarioId);
  
  const [activeView, setActiveView] = useState<ViewType>('dialog');
  const [isLoading, setIsLoading] = useState(true);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);

  useEffect(() => {
    loadData();
  }, [scenarioId]);

  // Set up header button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleToggleCompletion}
          style={styles.headerButton}
        >
          <Icon
            name={isCompleted ? 'check-circle' : 'circle-o'}
            size={24}
            color={isCompleted ? colors.success[500] : colors.white}
          />
        </TouchableOpacity>
      ),
    });
  }, [isCompleted, navigation]);

  const handleToggleCompletion = async () => {
    try {
      const newStatus = await toggleCompletion(0); // Speaking doesn't have a score
      Alert.alert(
        t('common.success'),
        newStatus ? t('exam.markedCompleted') : t('exam.markedIncomplete')
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('exam.completionFailed'));
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await dataService.getSpeakingPart3Content();
      const scenarios = data.scenarios as Scenario[];
      const scenario = scenarios.find(s => s.id === scenarioId) || scenarios[0];
      setCurrentScenario(scenario);
    } catch (error) {
      console.error('Error loading speaking part 3 data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentScenario) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Failed to load speaking data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderDialogView = () => {
    if (!currentScenario.dialogue) return null;
    
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
    if (!currentScenario.vocabulary) return null;
    
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
    if (!currentScenario.phrases) return null;
    
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
  },
  headerButton: {
    padding: spacing.padding.sm,
    marginRight: spacing.margin.sm,
  },
});

export default SpeakingPart3Screen;
