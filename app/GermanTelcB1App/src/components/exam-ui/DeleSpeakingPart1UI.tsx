import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { spacing, typography, type ThemeColors } from '../../theme';
import { useAppTheme } from '../../contexts/ThemeContext';
import { DeleSpeakingTopic, UserAnswer } from '../../types/exam.types';

interface DeleSpeakingPart1UIProps {
  topic: DeleSpeakingTopic;
  onComplete: (score: number, answers: UserAnswer[]) => void;
}

const DeleSpeakingPart1UI: React.FC<DeleSpeakingPart1UIProps> = ({ topic, onComplete }) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState<'presentation' | 'discussion'>('presentation');

  const handleComplete = () => {
    // For speaking, we don't auto-grade, so return a default score
    const answers: UserAnswer[] = [{
      questionId: 1,
      answer: 'completed',
      isCorrect: true,
      timestamp: Date.now(),
    }];
    onComplete(0, answers);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>{t('speaking.part1.title')}</Text>
        <Text style={styles.instructionsText}>
          {t('speaking.part1.deleInstructions')}
        </Text>
      </View>

      {/* Topic */}
      <View style={styles.topicSection}>
        <Text style={styles.sectionTitle}>{topic.title}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'presentation' && styles.tabActive]}
          onPress={() => setActiveTab('presentation')}
        >
          <Text style={[styles.tabText, activeTab === 'presentation' && styles.tabTextActive]}>
            {t('speaking.part1.examplePresentation')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discussion' && styles.tabActive]}
          onPress={() => setActiveTab('discussion')}
        >
          <Text style={[styles.tabText, activeTab === 'discussion' && styles.tabTextActive]}>
            {t('speaking.part1.exampleDiscussion')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'presentation' && (
        <View style={styles.contentSection}>
          <Text style={styles.contentText}>{topic.examplePresentation}</Text>
        </View>
      )}

      {activeTab === 'discussion' && (
        <View style={styles.contentSection}>
          {topic.exampleDiscussion.map((item, index) => (
            <View key={`disc-${index}-${item.question.slice(0, 10)}`} style={styles.discussionItem}>
              <Text style={styles.questionText}>{item.question}</Text>
              <Text style={styles.answerText}>{item.answer}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Complete Button */}
      <TouchableOpacity
        style={styles.completeButton}
        onPress={handleComplete}
      >
        <Text style={styles.completeButtonText}>
          {t('speaking.part1.markComplete')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    padding: spacing.padding.lg,
  },
  instructionsCard: {
    backgroundColor: colors.secondary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  instructionsTitle: {
    ...typography.textStyles.h4,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.sm,
    textAlign: 'left',
  },
  instructionsText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
    textAlign: 'left',
  },
  topicSection: {
    marginBottom: spacing.margin.lg,
  },
  sectionTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.margin.lg,
    borderRadius: spacing.borderRadius.md,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.padding.md,
    backgroundColor: colors.secondary[100],
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary[500],
  },
  tabText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
  tabTextActive: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.secondary,
  },
  contentSection: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.lg,
  },
  contentText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
  },
  discussionItem: {
    marginBottom: spacing.margin.lg,
  },
  questionText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    marginBottom: spacing.margin.sm,
  },
  answerText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 24,
  },
  completeButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
  },
  completeButtonText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.background.secondary,
  },
});

export default DeleSpeakingPart1UI;
