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

type B2SpeakingPart3RouteProp = RouteProp<HomeStackParamList, 'B2SpeakingPart3'>;

interface SpeakerText {
  speaker: string;
  text: string;
}

interface Question {
  title: string;
  question: string;
  exampleDialogue: SpeakerText[];
}

const SpeakingB2Part3Screen: React.FC = () => {
  const { t } = useCustomTranslation();
  const navigation = useNavigation();
  const route = useRoute<B2SpeakingPart3RouteProp>();
  const { questionId } = route.params;
  const { isCompleted, toggleCompletion } = useExamCompletion('speaking', 3, questionId);
  
  const [activeTab, setActiveTab] = useState<'task' | 'dialogue'>('task');
  const [isLoading, setIsLoading] = useState(true);
  const [question, setQuestion] = useState<Question | null>(null);

  useEffect(() => {
    loadData();
  }, [questionId]);

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
        part: 3, 
        exam_id: questionId, 
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
      const data = await dataService.getSpeakingB2Part3Content();
      if (data.questions && data.questions[questionId]) {
        setQuestion(data.questions[questionId]);
      }
      console.log('Speaking B2 Part 3 Data:', data);
    } catch (error) {
      console.error('Error loading speaking B2 part 3 data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTaskTab = () => {
    if (!question) return null;

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speaking.b2Part3.sections.task')}</Text>
          <View style={styles.textCard}>
            <Text style={styles.bodyText}>{question.question}</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderDialogueTab = () => {
    if (!question) return null;

    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speaking.b2Part3.sections.dialogue')}</Text>
          <Text style={styles.exampleNote}>
            {t('speaking.b2Part3.help.dialogueNote')}
          </Text>
        </View>

        {question.exampleDialogue.map((item: SpeakerText, index: number) => (
          <View key={index} style={styles.speakerCard}>
            <Text style={styles.speakerLabel}>
              {t('speaking.b2Part3.labels.speaker')} {item.speaker}
            </Text>
            <Text style={styles.bodyText}>{item.text}</Text>
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

  if (!question) {
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
          style={[styles.tab, activeTab === 'task' && styles.activeTab]}
          onPress={() => setActiveTab('task')}
        >
          <Text
            style={[styles.tabText, activeTab === 'task' && styles.activeTabText]}
          >
            {t('speaking.b2Part3.tabs.task')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dialogue' && styles.activeTab]}
          onPress={() => setActiveTab('dialogue')}
        >
          <Text
            style={[styles.tabText, activeTab === 'dialogue' && styles.activeTabText]}
          >
            {t('speaking.b2Part3.tabs.dialogue')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'task' && renderTaskTab()}
      {activeTab === 'dialogue' && renderDialogueTab()}

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
    marginBottom: spacing.margin.sm,
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
  bodyText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
    direction: 'ltr',
  },
  exampleNote: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    fontStyle: 'italic' as 'italic',
    marginBottom: spacing.margin.sm,
    paddingHorizontal: spacing.padding.xs,
    textAlign: 'left',
  },
  speakerCard: {
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
  speakerLabel: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
    marginBottom: spacing.margin.sm,
    textAlign: 'left',
  },
});

export default SpeakingB2Part3Screen;

