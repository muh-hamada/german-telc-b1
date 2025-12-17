import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
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

interface CardDeckItem {
  id: string;
  image_label: string;
  image_description: string;
  image_url?: string;
  expected_keywords: string[];
  example_request: string;
}

interface ExampleDialogueOption {
  speaker: string;
  role: string;
  options: string[];
}

interface A1Part3Data {
  instructions: {
    [lang: string]: InstructionSet;
  };
  simulation_data: {
    example_scenario: {
      card_image_description: string;
      dialogue_example: ExampleDialogueOption[];
    };
    cards_deck: CardDeckItem[];
  };
}

type TabType = 'instructions' | 'example' | 'cards';

const A1SpeakingPart3Screen: React.FC = () => {
  const { t, i18n } = useCustomTranslation();
  const navigation = useNavigation();
  const { isCompleted, toggleCompletion } = useExamCompletion('speaking', 3, 0);
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState<TabType>('instructions');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<A1Part3Data | null>(null);

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
        part: 3,
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
      const speakingData = await dataService.getA1SpeakingPart3Content();
      setData(speakingData);
    } catch (error) {
      console.error('Error loading A1 speaking part 3 data:', error);
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
          <Text style={styles.cardTitle}>{t('speaking.a1Part3.goal')}</Text>
          <Text style={styles.bodyText}>{instructions.goal}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('speaking.a1Part3.steps')}</Text>
          {instructions.steps.map((step, index) => (
            <View key={index} style={styles.stepContainer}>
              <Text style={styles.stepNumber}>{index + 1}.</Text>
              <Text style={styles.stepText}>{step}</Text>
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
          <Text style={styles.cardTitle}>{t('speaking.a1Part3.exampleScenario')}</Text>
          <Text style={styles.scenarioText}>
            {data.simulation_data.example_scenario.card_image_description}
          </Text>
        </View>

        <View style={styles.dialogueCard}>
          {data.simulation_data.example_scenario.dialogue_example.map((turn, index) => (
            <View key={index} style={styles.exampleTurn}>
              <Text style={styles.roleTitle}>{turn.role}:</Text>
              <View style={styles.optionsContainer}>
                {turn.options.map((option, optionIndex) => (
                  <View key={optionIndex} style={styles.optionCard}>
                    <Text style={styles.optionText}>{option}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderCardsTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('speaking.a1Part3.practiceCards')}</Text>
          <Text style={styles.descriptionText}>
            {t('speaking.a1Part3.cardsDescription')}
          </Text>
        </View>

        {data.simulation_data.cards_deck.map((card) => (
          <View key={card.id} style={styles.practiceCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>{card.image_label}</Text>
            </View>
            
            {card.image_url && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: card.image_url }}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              </View>
            )}
            
            <Text style={styles.cardDescription}>{card.image_description}</Text>
            
            <View style={styles.keywordsSection}>
              <Text style={styles.sectionTitle}>{t('speaking.a1Part3.keywords')}:</Text>
              <View style={styles.keywordsContainer}>
                {card.expected_keywords.map((keyword, index) => (
                  <View key={index} style={styles.keywordChip}>
                    <Text style={styles.keywordText}>{keyword}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.exampleSection}>
              <Text style={styles.exampleLabel}>{t('speaking.a1Part3.exampleRequest')}:</Text>
              <Text style={styles.exampleRequestText}>{card.example_request}</Text>
            </View>
          </View>
        ))}
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
            {t('speaking.a1Part3.tabs.instructions')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'example' && styles.activeTab]}
          onPress={() => setActiveTab('example')}
        >
          <Text style={[styles.tabText, activeTab === 'example' && styles.activeTabText]}>
            {t('speaking.a1Part3.tabs.example')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cards' && styles.activeTab]}
          onPress={() => setActiveTab('cards')}
        >
          <Text style={[styles.tabText, activeTab === 'cards' && styles.activeTabText]}>
            {t('speaking.a1Part3.tabs.cards')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'instructions' && renderInstructionsTab()}
        {activeTab === 'example' && renderExampleTab()}
        {activeTab === 'cards' && renderCardsTab()}
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
    scenarioText: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      fontStyle: 'italic',
      lineHeight: 22,
      direction: 'ltr',
    },
    dialogueCard: {
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.padding.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      direction: 'ltr',
    },
    exampleTurn: {
      marginBottom: spacing.margin.lg,
    },
    roleTitle: {
      ...typography.textStyles.h4,
      color: colors.primary[700],
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.margin.sm,
    },
    optionsContainer: {
      gap: spacing.margin.sm,
    },
    optionCard: {
      backgroundColor: colors.primary[50],
      padding: spacing.padding.md,
      borderRadius: spacing.borderRadius.md,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary[500],
    },
    optionText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      lineHeight: 22,
    },
    practiceCard: {
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.padding.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.secondary[200],
    },
    cardHeader: {
      marginBottom: spacing.margin.sm,
    },
    cardLabel: {
      ...typography.textStyles.h3,
      color: colors.primary[700],
      fontWeight: typography.fontWeight.bold,
      direction: 'ltr',
    },
    imageContainer: {
      width: '100%',
      height: 150,
      marginVertical: spacing.margin.md,
      borderRadius: spacing.borderRadius.md,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      direction: 'ltr',
    },
    cardImage: {
      width: '100%',
      height: '100%',
    },
    cardDescription: {
      ...typography.textStyles.body,
      color: colors.text.secondary,
      marginBottom: spacing.margin.md,
      fontStyle: 'italic',
      direction: 'ltr',
    },
    keywordsSection: {
      marginBottom: spacing.margin.md,
      paddingTop: spacing.padding.md,
      borderTopWidth: 1,
      borderTopColor: colors.secondary[200],
    },
    sectionTitle: {
      ...typography.textStyles.bodySmall,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.secondary,
      textTransform: 'uppercase',
      marginBottom: spacing.margin.sm,
    },
    keywordsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.margin.sm,
    },
    keywordChip: {
      backgroundColor: colors.secondary[100],
      paddingVertical: spacing.padding.xs,
      paddingHorizontal: spacing.padding.sm,
      borderRadius: spacing.borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.secondary[300],
    },
    keywordText: {
      ...typography.textStyles.bodySmall,
      color: colors.text.primary,
    },
    exampleSection: {
      backgroundColor: colors.primary[50],
      padding: spacing.padding.md,
      borderRadius: spacing.borderRadius.md,
      marginTop: spacing.margin.sm,
    },
    exampleLabel: {
      ...typography.textStyles.bodySmall,
      fontWeight: typography.fontWeight.bold,
      color: colors.primary[700],
      marginBottom: spacing.margin.xs,
    },
    exampleRequestText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: 22,
      direction: 'ltr',
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

export default A1SpeakingPart3Screen;

