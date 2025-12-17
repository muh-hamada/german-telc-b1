import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { spacing, typography, type ThemeColors } from '../../theme';
import { useAppTheme } from '../../contexts/ThemeContext';
import dataService from '../../services/data.service';
import { useExamCompletion } from '../../contexts/CompletionContext';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';

interface InstructionSet {
  goal: string;
  steps: string[];
}

interface TextSegment {
  keyword: string;
  phrase: string;
  example_value: string;
}

interface DialogueTurn {
  speaker: string;
  text: string;
  type: string;
}

interface A1Part1Data {
  instructions: {
    [lang: string]: InstructionSet;
  };
  study_material: {
    template_keywords: string[];
    example_monologue: {
      description: string;
      text_segments: TextSegment[];
    };
    example_interaction: {
      description: string;
      dialogue: DialogueTurn[];
    };
  };
}

type TabType = 'instructions' | 'example' | 'interaction';

const A1SpeakingPart1Screen: React.FC = () => {
  const { t, i18n } = useCustomTranslation();
  const navigation = useNavigation();
  const { isCompleted, toggleCompletion } = useExamCompletion('speaking', 1, 0);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState<TabType>('instructions');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<A1Part1Data | null>(null);

  useEffect(() => {
    loadData();
  }, []);

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
            color={colors.white}
          />
        </TouchableOpacity>
      ),
    });
  }, [isCompleted, navigation, colors]);

  const handleToggleCompletion = async () => {
    try {
      const newStatus = await toggleCompletion(0);
      logEvent(AnalyticsEvents.PRACTICE_MARK_COMPLETED_TOGGLED, {
        section: 'speaking',
        part: 1,
        exam_id: 0,
        completed: newStatus,
      });
    } catch (error: any) {
      if (error.message === 'auth/not-logged-in') {
        Alert.alert(t('common.error'), t('exam.loginToSaveProgress'));
      } else {
        Alert.alert(t('common.error'), t('exam.completionFailed'));
      }
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const speakingData = await dataService.getA1SpeakingPart1Content();
      setData(speakingData);
    } catch (error) {
      console.error('Error loading A1 speaking part 1 data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Failed to load speaking data</Text>
        </View>
      </View>
    );
  }

  const currentLang = i18n.language;
  const instructions = data.instructions[currentLang] || data.instructions['en'];

  const renderInstructionsTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('speaking.a1Part1.goal')}</Text>
          <Text style={styles.bodyText}>{instructions.goal}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('speaking.a1Part1.steps')}</Text>
          {instructions.steps.map((step, index) => (
            <View key={index} style={styles.stepContainer}>
              <Text style={styles.stepNumber}>{index + 1}.</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.keywordsCard}>
          <Text style={styles.cardTitle}>{t('speaking.a1Part1.keywords')}</Text>
          <View style={styles.keywordsGrid}>
            {data.study_material.template_keywords.map((keyword, index) => (
              <View key={index} style={styles.keywordChip}>
                <Text style={styles.keywordText}>{keyword}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderExampleTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('speaking.a1Part1.exampleIntroduction')}</Text>
          <Text style={styles.descriptionText}>
            {data.study_material.example_monologue.description}
          </Text>
        </View>

        {data.study_material.example_monologue.text_segments.map((segment, index) => (
          <View key={index} style={styles.exampleCard}>
            <View style={styles.exampleHeader}>
              <Text style={styles.keywordLabel}>{segment.keyword}</Text>
            </View>
            <Text style={styles.phraseText}>{segment.phrase}</Text>
            <View style={styles.exampleValueContainer}>
              <Text style={styles.exampleValue}>{segment.example_value}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderInteractionTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('speaking.a1Part1.followUpQuestions')}</Text>
          <Text style={styles.descriptionText}>
            {data.study_material.example_interaction.description}
          </Text>
        </View>

        <View style={styles.dialogueContainer}>
          {data.study_material.example_interaction.dialogue.map((turn, index) => (
            <View
              key={index}
              style={[
                styles.dialogueBubbleContainer,
                turn.speaker === 'Prüfer'
                  ? styles.dialogueBubbleLeft
                  : styles.dialogueBubbleRight,
              ]}
            >
              <View
                style={[
                  styles.dialogueBubble,
                  turn.speaker === 'Prüfer'
                    ? styles.dialogueBubbleExaminer
                    : styles.dialogueBubbleCandidate,
                ]}
              >
                <Text style={styles.speakerLabel}>{turn.speaker}</Text>
                <Text style={styles.dialogueText}>{turn.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'instructions' && styles.activeTab]}
          onPress={() => setActiveTab('instructions')}
        >
          <Text
            style={[styles.tabText, activeTab === 'instructions' && styles.activeTabText]}
          >
            {t('speaking.a1Part1.tabs.instructions')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'example' && styles.activeTab]}
          onPress={() => setActiveTab('example')}
        >
          <Text style={[styles.tabText, activeTab === 'example' && styles.activeTabText]}>
            {t('speaking.a1Part1.tabs.example')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'interaction' && styles.activeTab]}
          onPress={() => setActiveTab('interaction')}
        >
          <Text
            style={[styles.tabText, activeTab === 'interaction' && styles.activeTabText]}
          >
            {t('speaking.a1Part1.tabs.interaction')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'instructions' && renderInstructionsTab()}
        {activeTab === 'example' && renderExampleTab()}
        {activeTab === 'interaction' && renderInteractionTab()}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: colors.background.secondary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.padding.md,
      paddingHorizontal: spacing.padding.xs,
      alignItems: 'center',
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomColor: colors.primary[500],
    },
    tabText: {
      ...typography.textStyles.bodySmall,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    activeTabText: {
      color: colors.primary[700],
    },
    tabContent: {
      gap: spacing.margin.lg,
    },
    card: {
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.padding.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    cardTitle: {
      ...typography.textStyles.h3,
      color: colors.primary[700],
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.margin.md,
    },
    bodyText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      lineHeight: 24,
    },
    descriptionText: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      fontStyle: 'italic',
      lineHeight: 22,
      direction: 'ltr',
    },
    stepContainer: {
      flexDirection: 'row',
      marginBottom: spacing.margin.md,
    },
    stepNumber: {
      ...typography.textStyles.body,
      fontWeight: typography.fontWeight.bold,
      color: colors.primary[600],
      marginRight: spacing.margin.sm,
      minWidth: 24,
    },
    stepText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      flex: 1,
      lineHeight: 24,
    },
    keywordsCard: {
      backgroundColor: colors.secondary[50],
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.padding.lg,
      borderWidth: 1,
      borderColor: colors.secondary[200],
    },
    keywordsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.margin.sm,
    },
    keywordChip: {
      backgroundColor: colors.primary[500],
      paddingVertical: spacing.padding.sm,
      paddingHorizontal: spacing.padding.md,
      borderRadius: spacing.borderRadius.md,
    },
    keywordText: {
      ...typography.textStyles.bodySmall,
      color: colors.white,
      fontWeight: typography.fontWeight.semibold,
    },
    exampleCard: {
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.padding.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary[500],
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      direction: 'ltr',
    },
    exampleHeader: {
      marginBottom: spacing.margin.sm,
    },
    keywordLabel: {
      ...typography.textStyles.h4,
      color: colors.primary[700],
      fontWeight: typography.fontWeight.bold,
    },
    phraseText: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      marginBottom: spacing.margin.md,
      fontStyle: 'italic',
    },
    exampleValueContainer: {
      backgroundColor: colors.primary[50],
      padding: spacing.padding.md,
      borderRadius: spacing.borderRadius.md,
    },
    exampleValue: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.semibold,
    },
    dialogueContainer: {
      gap: spacing.margin.md,
      direction: 'ltr',
    },
    dialogueBubbleContainer: {
      flexDirection: 'row',
      marginBottom: spacing.margin.sm,
    },
    dialogueBubbleLeft: {
      justifyContent: 'flex-start',
    },
    dialogueBubbleRight: {
      justifyContent: 'flex-end',
    },
    dialogueBubble: {
      maxWidth: '80%',
      padding: spacing.padding.md,
      borderRadius: spacing.borderRadius.lg,
    },
    dialogueBubbleExaminer: {
      backgroundColor: colors.secondary[300],
    },
    dialogueBubbleCandidate: {
      backgroundColor: colors.primary[100],
    },
    speakerLabel: {
      ...typography.textStyles.bodySmall,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: spacing.margin.xs,
    },
    dialogueText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      lineHeight: 22,
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

export default A1SpeakingPart1Screen;

