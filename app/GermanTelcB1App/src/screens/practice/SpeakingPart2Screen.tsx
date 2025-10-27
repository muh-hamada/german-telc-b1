import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Markdown from 'react-native-markdown-display';
import { colors, spacing, typography } from '../../theme';
import dataService from '../../services/data.service';
import { useExamCompletion } from '../../contexts/CompletionContext';
import AdBanner from '../../components/AdBanner';
import { HIDE_ADS } from '../../config/demo.config';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';

interface Topic {
  id: number;
  title: string;
  viewA: {
    person: string;
    text: string;
  };
  viewB: {
    person: string;
    text: string;
  };
  discussion: Array<{
    question: string;
    tip: string;
  }>;
}

type SpeakingPart2ScreenRouteProp = RouteProp<{ params: { topicId: number } }, 'params'>;

const SpeakingPart2Screen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<SpeakingPart2ScreenRouteProp>();
  const navigation = useNavigation();
  const topicId = route.params?.topicId ?? 0;
  
  const { isCompleted, toggleCompletion } = useExamCompletion('speaking', 2, topicId);
  
  const [activeView, setActiveView] = useState<'A' | 'B'>('A');
  const [showPartnerSummary, setShowPartnerSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);

  useEffect(() => {
    loadData();
  }, [topicId]);

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
      logEvent(AnalyticsEvents.PRACTICE_MARK_COMPLETED_TOGGLED, { section: 'speaking', part: 2, exam_id: topicId, completed: newStatus });
      Alert.alert(
        t('common.success'),
        newStatus ? t('exam.markedCompleted') : t('exam.markedIncomplete')
      );
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
      const data = await dataService.getSpeakingPart2Content();
      const topics = data.topics as Topic[];
      const topic = topics.find(t => t.id === topicId) || topics[0];
      setCurrentTopic(topic);
    } catch (error) {
      console.error('Error loading speaking part 2 data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentTopic) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Failed to load speaking data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatPersonText = (person: string, text: string): string => {
    return `**${person}:**\n\n${text}`;
  };

  const createPartnerSummary = (view: { person: string; text: string }): string => {
    const [namePart] = view.person.split(',');
    const name = namePart.trim();
    const isFemale = name.includes('Frau') || 
                     ['Sabine', 'Hannelore', 'Laura', 'Julia', 'Mia', 'Karin', 'Schmidt', 'Marie', 'Anna'].some(n => name.includes(n));
    
    const pronoun = isFemale ? 'Sie' : 'Er';
    
    return `**${view.person}:**\n\n${pronoun} ist der Meinung, dass das Thema wichtig ist. ${pronoun} findet die Argumente überzeugend und hat eine klare Position dazu.`;
  };

  const renderViewContent = () => {
    const view = activeView === 'A' ? currentTopic.viewA : currentTopic.viewB;
    const partnerView = activeView === 'A' ? currentTopic.viewB : currentTopic.viewA;

    return (
      <View style={styles.viewContent}>
        <View style={styles.textCard}>
          <Text style={styles.cardTitle}>{t('speaking.part2.instructions.startingText')}</Text>
          <Markdown style={markdownStyles}>
            {formatPersonText(view.person, view.text)}
          </Markdown>
        </View>

        <View style={styles.partnerSection}>
          <Text style={styles.partnerTitle}>
            {t('speaking.part2.sections.partnerSummary')}
          </Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowPartnerSummary(!showPartnerSummary)}
          >
            <Text style={styles.toggleButtonText}>
              {showPartnerSummary
                ? t('speaking.part2.buttons.hideSummary')
                : t('speaking.part2.buttons.showSummary')}
            </Text>
          </TouchableOpacity>

          {showPartnerSummary && (
            <View style={styles.summaryCard}>
              <Markdown style={markdownStylesSummary}>
                {createPartnerSummary(partnerView)}
              </Markdown>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderDiscussion = () => {
    if (!currentTopic.discussion) return null;
    
    return (
      <View style={styles.discussionSection}>
        <Text style={styles.discussionTitle}>
          {t('speaking.part2.sections.discussion')}
        </Text>
        <Text style={styles.discussionDescription}>
          {t('speaking.part2.sections.discussionNote')}
        </Text>

        {currentTopic.discussion.map((item, index) => (
          <View key={index} style={styles.discussionCard}>
            <Text style={styles.questionText}>Q: {item.question}</Text>
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>
                <Text style={styles.tipLabel}>Tipp: </Text>
                {item.tip}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.mainCard}>
          <Text style={styles.topicTitle}>{currentTopic.title}</Text>
          <Text style={styles.instructionText}>
            {t('speaking.part2.instructions.taskDescription')}
          </Text>

          {/* View Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeView === 'A' && styles.activeTab]}
              onPress={() => {
                setActiveView('A');
                setShowPartnerSummary(false);
              }}
            >
              <Text style={[styles.tabText, activeView === 'A' && styles.activeTabText]}>
                {t('speaking.part2.tabs.yourRole')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeView === 'B' && styles.activeTab]}
              onPress={() => {
                setActiveView('B');
                setShowPartnerSummary(false);
              }}
            >
              <Text style={[styles.tabText, activeView === 'B' && styles.activeTabText]}>
                {t('speaking.part2.tabs.partnerRole')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* View Content */}
          {renderViewContent()}

          {/* Discussion */}
          {renderDiscussion()}
        </View>
      </ScrollView>
      {!HIDE_ADS && <AdBanner />}
    </SafeAreaView>
  );
};

const markdownStyles = {
  body: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
  },
  paragraph: {
    marginBottom: spacing.margin.sm,
  },
  strong: {
    fontWeight: '700' as '700',
    color: colors.primary[700],
  },
};

const markdownStylesSummary = {
  body: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
  },
  paragraph: {
    marginBottom: spacing.margin.sm,
  },
  strong: {
    fontWeight: '700' as '700',
    color: colors.error[600],
  },
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
  topicTitle: {
    ...typography.textStyles.h2,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  instructionText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.margin.lg,
    lineHeight: 22,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.margin.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.sm,
    borderTopLeftRadius: spacing.borderRadius.md,
    borderTopRightRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.secondary[200],
    backgroundColor: colors.background.primary,
  },
  activeTab: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  tabText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  activeTabText: {
    color: colors.background.secondary,
  },
  viewContent: {
    marginBottom: spacing.margin.xl,
  },
  textCard: {
    backgroundColor: colors.secondary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    marginBottom: spacing.margin.lg,
  },
  cardTitle: {
    ...typography.textStyles.h4,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.sm,
  },
  partnerSection: {
    marginTop: spacing.margin.md,
  },
  partnerTitle: {
    ...typography.textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  toggleButton: {
    backgroundColor: colors.warning[500],
    paddingVertical: spacing.padding.sm,
    paddingHorizontal: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButtonText: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  summaryCard: {
    backgroundColor: colors.primary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginTop: spacing.margin.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  discussionSection: {
    borderTopWidth: 1,
    borderTopColor: colors.secondary[200],
    paddingTop: spacing.padding.lg,
    marginTop: spacing.margin.lg,
  },
  discussionTitle: {
    ...typography.textStyles.h3,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.sm,
  },
  discussionDescription: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.margin.lg,
    lineHeight: 22,
  },
  discussionCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    borderWidth: 1,
    borderColor: colors.secondary[200],
  },
  questionText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.margin.sm,
  },
  tipCard: {
    backgroundColor: colors.secondary[50],
    padding: spacing.padding.sm,
    borderRadius: spacing.borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning[500],
    marginTop: spacing.margin.sm,
  },
  tipText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.primary,
    lineHeight: 20,
  },
  tipLabel: {
    fontWeight: typography.fontWeight.bold,
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

export default SpeakingPart2Screen;
