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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { spacing, typography, type ThemeColors } from '../../theme';
import { useAppTheme } from '../../contexts/ThemeContext';
import dataService from '../../services/data.service';
import { useExamCompletion } from '../../contexts/CompletionContext';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';

interface InstructionSet {
  goal: string;
  steps: string[];
}

interface Card {
  id: string;
  word: string;
  image_icon: string;
}

interface DialogueTurn {
  speaker: string;
  role: string;
  text: string;
}

interface A1Part2Data {
  instructions: {
    [lang: string]: InstructionSet;
  };
  simulation_data: {
    topic: string;
    cards: Card[];
    example_dialogue: {
      context: string;
      turns: DialogueTurn[];
    };
  };
}

type TabType = 'instructions' | 'cards' | 'example';

const A1SpeakingPart2Screen: React.FC = () => {
  const { t, i18n } = useCustomTranslation();
  const navigation = useNavigation();
  const { isCompleted, toggleCompletion } = useExamCompletion('speaking', 2, 0);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState<TabType>('instructions');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<A1Part2Data | null>(null);

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
        part: 2,
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
      const speakingData = await dataService.getA1SpeakingPart2Content();
      setData(speakingData);
    } catch (error) {
      console.error('Error loading A1 speaking part 2 data:', error);
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
          <Text style={styles.cardTitle}>{t('speaking.a1Part2.goal')}</Text>
          <Text style={styles.bodyText}>{instructions.goal}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('speaking.a1Part2.steps')}</Text>
          {instructions.steps.map((step, index) => (
            <View key={index} style={styles.stepContainer}>
              <Text style={styles.stepNumber}>{index + 1}.</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.topicCard}>
          <Text style={styles.topicLabel}>{t('speaking.a1Part2.topic')}</Text>
          <Text style={styles.topicText}>{data.simulation_data.topic}</Text>
        </View>
      </View>
    );
  };

  const renderCardsTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('speaking.a1Part2.cardWords')}</Text>
          <Text style={styles.descriptionText}>
            {t('speaking.a1Part2.cardDescription')}
          </Text>
        </View>

        <View style={styles.cardsGrid}>
          {data.simulation_data.cards.map((card) => (
            <View key={card.id} style={styles.wordCard}>
              <View style={styles.iconContainer}>
                <MaterialIcons name={card.image_icon} size={32} color={colors.primary[600]} />
              </View>
              <Text style={styles.wordText}>{card.word}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderExampleTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('speaking.a1Part2.exampleDialogue')}</Text>
          <Text style={styles.contextText}>{data.simulation_data.example_dialogue.context}</Text>
        </View>

        <View style={styles.dialogueContainer}>
          {data.simulation_data.example_dialogue.turns.map((turn, index) => (
            <View
              key={index}
              style={[
                styles.dialogueBubbleContainer,
                turn.speaker === 'User'
                  ? styles.dialogueBubbleRight
                  : styles.dialogueBubbleLeft,
              ]}
            >
              <View
                style={[
                  styles.dialogueBubble,
                  turn.speaker === 'User'
                    ? styles.dialogueBubbleUser
                    : styles.dialogueBubblePartner,
                ]}
              >
                <Text style={styles.roleLabel}>{turn.role}</Text>
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
            {t('speaking.a1Part2.tabs.instructions')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cards' && styles.activeTab]}
          onPress={() => setActiveTab('cards')}
        >
          <Text style={[styles.tabText, activeTab === 'cards' && styles.activeTabText]}>
            {t('speaking.a1Part2.tabs.cards')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'example' && styles.activeTab]}
          onPress={() => setActiveTab('example')}
        >
          <Text style={[styles.tabText, activeTab === 'example' && styles.activeTabText]}>
            {t('speaking.a1Part2.tabs.example')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'instructions' && renderInstructionsTab()}
        {activeTab === 'cards' && renderCardsTab()}
        {activeTab === 'example' && renderExampleTab()}
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
      lineHeight: 22,
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
    topicCard: {
      backgroundColor: colors.primary[50],
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.padding.lg,
      borderWidth: 2,
      borderColor: colors.primary[300],
    },
    topicLabel: {
      ...typography.textStyles.bodySmall,
      color: colors.text.secondary,
      textTransform: 'uppercase',
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.margin.xs,
    },
    topicText: {
      ...typography.textStyles.h2,
      color: colors.primary[700],
      fontWeight: typography.fontWeight.bold,
      direction: 'ltr',
    },
    cardsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.margin.md,
    },
    wordCard: {
      width: '47%',
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.padding.lg,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.secondary[200],
    },
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary[100],
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.margin.md,
    },
    wordText: {
      ...typography.textStyles.body,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      textAlign: 'center',
    },
    contextText: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      fontStyle: 'italic',
      lineHeight: 22,
      direction: 'ltr',
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
    dialogueBubbleUser: {
      backgroundColor: colors.primary[100],
    },
    dialogueBubblePartner: {
      backgroundColor: colors.secondary[300],
    },
    roleLabel: {
      ...typography.textStyles.bodySmall,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.secondary,
      marginBottom: spacing.margin.xs,
      textTransform: 'uppercase',
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

export default A1SpeakingPart2Screen;

