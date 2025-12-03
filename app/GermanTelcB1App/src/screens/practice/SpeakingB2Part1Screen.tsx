import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, typography } from '../../theme';
import dataService from '../../services/data.service';
import { useExamCompletion } from '../../contexts/CompletionContext';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { HomeStackParamList } from '../../types/navigation.types';

type B2SpeakingPart1RouteProp = RouteProp<HomeStackParamList, 'B2SpeakingPart1'>;

interface DiscussionQuestion {
  question: string;
  answer: string;
}

interface Topic {
  title: string;
  examplePresentation: string;
  exampleDiscussion: DiscussionQuestion[];
}

const SpeakingB2Part1Screen: React.FC = () => {
  const { t } = useCustomTranslation();
  const navigation = useNavigation();
  const route = useRoute<B2SpeakingPart1RouteProp>();
  const { topicId } = route.params;
  const { isCompleted, toggleCompletion } = useExamCompletion('speaking', 1, topicId);
  
  const [activeTab, setActiveTab] = useState<'presentation' | 'discussion'>('presentation');
  const [isLoading, setIsLoading] = useState(true);
  const [topic, setTopic] = useState<Topic | null>(null);

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
      logEvent(AnalyticsEvents.PRACTICE_MARK_COMPLETED_TOGGLED, { 
        section: 'speaking', 
        part: 1, 
        exam_id: topicId, 
        completed: newStatus 
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
      const data = await dataService.getSpeakingB2Part1Content();
      if (data.topics && data.topics[topicId]) {
        setTopic(data.topics[topicId]);
      }
      console.log('Speaking B2 Part 1 Data:', data);
    } catch (error) {
      console.error('Error loading speaking B2 part 1 data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPresentationTab = () => {
    if (!topic) return null;

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speaking.b2Part1.sections.topicTitle')}</Text>
          <View style={styles.textCard}>
            <Text style={styles.topicText}>{topic.title}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speaking.b2Part1.sections.examplePresentation')}</Text>
          <View style={styles.textCard}>
            <Text style={styles.bodyText}>{topic.examplePresentation}</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderDiscussionTab = () => {
    if (!topic) return null;

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speaking.b2Part1.sections.discussionQuestions')}</Text>
          <Text style={styles.exampleNote}>
            {t('speaking.b2Part1.help.discussionNote')}
          </Text>
        </View>

        {topic.exampleDiscussion.map((item: DiscussionQuestion, index: number) => (
          <View key={index} style={styles.questionCard}>
            <Text style={styles.questionText}>
              <Text style={styles.questionLabel}>{t('speaking.b2Part1.labels.question')}:</Text> {item.question}
            </Text>
            <Text style={styles.answerText}>
              <Text style={styles.answerLabel}>{t('speaking.b2Part1.labels.answer')}:</Text> {item.answer}
            </Text>
          </View>
        ))}
      </ScrollView>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  if (!topic) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('exam.failedToLoad')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'presentation' && styles.activeTab]}
          onPress={() => setActiveTab('presentation')}
        >
          <Text
            style={[styles.tabText, activeTab === 'presentation' && styles.activeTabText]}
          >
            {t('speaking.b2Part1.tabs.presentation')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discussion' && styles.activeTab]}
          onPress={() => setActiveTab('discussion')}
        >
          <Text
            style={[styles.tabText, activeTab === 'discussion' && styles.activeTabText]}
          >
            {t('speaking.b2Part1.tabs.discussion')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'presentation' && renderPresentationTab()}
      {activeTab === 'discussion' && renderDiscussionTab()}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  headerButton: {
    padding: spacing.padding.sm,
    marginRight: spacing.margin.sm,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.padding.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomColor: colors.primary[500],
  },
  tabText: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    lineHeight: 15,
    textAlign: 'center',
  },
  activeTabText: {
    color: colors.primary[500],
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.padding.lg,
  },
  section: {
    marginBottom: spacing.margin.lg,
  },
  sectionTitle: {
    ...typography.textStyles.h3,
    color: colors.primary[500],
    marginBottom: spacing.margin.md,
    textAlign: 'left',
  },
  textCard: {
    backgroundColor: colors.white,
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topicText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
    fontWeight: typography.fontWeight.semibold,
    direction: 'ltr',
  },
  bodyText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
  },
  exampleNote: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    fontStyle: 'italic' as 'italic',
    marginBottom: spacing.margin.md,
    paddingHorizontal: spacing.padding.xs,
  },
  questionCard: {
    backgroundColor: colors.white,
    padding: spacing.padding.lg,
    borderRadius: spacing.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: spacing.margin.md,
  },
  questionNumber: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
    marginBottom: spacing.margin.sm,
  },
  questionText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: spacing.margin.sm,
  },
  questionLabel: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },
  answerText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
  },
  answerLabel: {
    fontWeight: typography.fontWeight.bold,
    color: colors.success[700],
  },
});

export default SpeakingB2Part1Screen;

