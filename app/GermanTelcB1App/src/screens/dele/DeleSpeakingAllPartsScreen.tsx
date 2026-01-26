import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import dataService from '../../services/data.service';
import { spacing, typography, type ThemeColors } from '../../theme';
import {
  DeleSpeakingPart1Topic,
  DeleSpeakingPart2Question,
  DeleSpeakingPart3Question,
  DeleSpeakingPart4Question,
} from '../../types/exam.types';
import { HomeStackParamList } from '../../types/navigation.types';

type DeleSpeakingAllPartsScreenRouteProp = RouteProp<HomeStackParamList, 'DeleSpeakingAllParts'>;

const DeleSpeakingAllPartsScreen: React.FC = () => {
  const { t } = useCustomTranslation();
  const route = useRoute<DeleSpeakingAllPartsScreenRouteProp>();
  const { part, topicIndex } = route.params;
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [isLoading, setIsLoading] = useState(true);
  const [part1Topic, setPart1Topic] = useState<DeleSpeakingPart1Topic | null>(null);
  const [part2Question, setPart2Question] = useState<DeleSpeakingPart2Question | null>(null);
  const [part3Question, setPart3Question] = useState<DeleSpeakingPart3Question | null>(null);
  const [part4Question, setPart4Question] = useState<DeleSpeakingPart4Question | null>(null);
  const [showExamplePresentation, setShowExamplePresentation] = useState(false);
  const [showExampleDescription, setShowExampleDescription] = useState(false);
  const [expandedDialogue, setExpandedDialogue] = useState(false);

  const loadPartContent = useCallback(async () => {
    try {
      setIsLoading(true);

      switch (part) {
        case 1: {
          const data = await dataService.getDeleSpeakingPart1Content();
          const topic = data.topics[topicIndex] || data.topics[0];
          setPart1Topic(topic);
          break;
        }
        case 2: {
          const data = await dataService.getDeleSpeakingPart2Content();
          const question = data.questions[topicIndex] || data.questions[0];
          setPart2Question(question);
          break;
        }
        case 3: {
          const data = await dataService.getDeleSpeakingPart3Content();
          const question = data.questions[topicIndex] || data.questions[0];
          setPart3Question(question);
          break;
        }
        case 4: {
          const data = await dataService.getDeleSpeakingPart4Content();
          const question = data.questions[topicIndex] || data.questions[0];
          setPart4Question(question);
          break;
        }
        default:
          console.error('Invalid part number:', part);
      }
    } catch (error) {
      console.error('Error loading speaking part content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [part, topicIndex]);

  useEffect(() => {
    loadPartContent();
  }, [loadPartContent]);

  const renderPart1View = () => {
    if (!part1Topic) return null;

    return (
      <View style={styles.mainCard}>
        <Text style={styles.topicTitle}>{part1Topic.title}</Text>
        <Text style={styles.instructionText}>
          {t('speaking.part1.dele.instructions')}
        </Text>

        {/* Example Presentation Section */}
        <View style={styles.firstSection}>
          <Text style={styles.sectionTitle}>
            {t('speaking.part1.dele.examplePresentation')}
          </Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowExamplePresentation(!showExamplePresentation)}
          >
            <Text style={styles.toggleButtonText}>
              {showExamplePresentation
                ? t('common.hide')
                : t('common.show')}
            </Text>
          </TouchableOpacity>
          {showExamplePresentation && (
            <View style={styles.contentCard}>
              <Text style={styles.bodyText}>{part1Topic.examplePresentation}</Text>
            </View>
          )}
        </View>

        {/* Discussion Questions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('speaking.part1.dele.discussionQuestions')}
          </Text>
          {part1Topic.exampleDiscussion.map((item, index) => (
            <View key={index} style={styles.discussionCard}>
              <Text style={styles.questionText}>{item.question}</Text>
              <View style={styles.answerCard}>
                <Text style={styles.answerLabel}>{t('speaking.part1.dele.exampleAnswer')}:</Text>
                <Text style={styles.bodyText}>{item.answer}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPart2View = () => {
    if (!part2Question) return null;

    return (
      <View style={styles.mainCard}>
        <Text style={styles.topicTitle}>{part2Question.title}</Text>
        <Text style={styles.instructionText}>
          {t('speaking.part2.dele.instructionText')}
        </Text>

        {/* Example Questions Section */}
        <View style={styles.firstSection}>
          <Text style={styles.sectionTitle}>
            {t('speaking.part2.dele.exampleQuestions')}
          </Text>
          {part2Question.exampleQuestions.map((question, index) => (
            <View key={index} style={styles.questionCard}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.questionText}>{question}</Text>
            </View>
          ))}
        </View>

        {/* Example Dialogue Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('speaking.part2.dele.exampleDialogue')}
          </Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setExpandedDialogue(!expandedDialogue)}
          >
            <Text style={styles.toggleButtonText}>
              {expandedDialogue ? t('common.hide') : t('common.show')}
            </Text>
          </TouchableOpacity>
          {expandedDialogue && (
            <View style={styles.dialogueContainer}>
              {part2Question.exampleDialogue.map((turn, index) => (
                <View
                  key={index}
                  style={[
                    styles.dialogueTurn,
                    turn.speaker === 'Candidato' ? styles.candidateTurn : styles.interviewerTurn,
                  ]}
                >
                  <Text style={styles.speakerLabel}>{turn.speaker}:</Text>
                  <Text style={styles.dialogueText}>{turn.text}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderPart3View = () => {
    if (!part3Question) return null;

    return (
      <View style={styles.mainCard}>
        <Text style={styles.topicTitle}>{part3Question.title}</Text>
        <Text style={styles.instructionText}>
          {t('speaking.part3.dele.instructionText')}
        </Text>

        {/* Image Section */}
        <View style={styles.imageSection}>
          <Image source={{ uri: part3Question.image_url }} style={styles.imageCard} />
        </View>

        {/* Example Description Section */}
        <View style={styles.firstSection}>
          <Text style={styles.sectionTitle}>
            {t('speaking.part3.dele.exampleDescription')}
          </Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowExampleDescription(!showExampleDescription)}
          >
            <Text style={styles.toggleButtonText}>
              {showExampleDescription ? t('common.hide') : t('common.show')}
            </Text>
          </TouchableOpacity>
          {showExampleDescription && (
            <View style={styles.contentCard}>
              <Text style={styles.bodyText}>{part3Question.exampleDescription}</Text>
            </View>
          )}
        </View>

        {/* Follow-up Discussion Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('speaking.part3.dele.followUpQuestions')}
          </Text>
          <View style={styles.dialogueContainer}>
            {part3Question.exampleDiscussion.map((turn, index) => (
              <View
                key={index}
                style={[
                  styles.dialogueTurn,
                  turn.speaker === 'Candidato' ? styles.candidateTurn : styles.interviewerTurn,
                ]}
              >
                <Text style={styles.speakerLabel}>{turn.speaker}:</Text>
                <Text style={styles.dialogueText}>{turn.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderPart4View = () => {
    if (!part4Question) return null;

    return (
      <View style={styles.mainCard}>
        <Text style={styles.topicTitle}>{part4Question.title}</Text>
        <Text style={styles.instructionText}>
          {t('speaking.part4.dele.instructionText')}
        </Text>

        {/* Situation Section */}
        <View style={styles.firstSection}>
          <Text style={styles.sectionTitle}>{t('speaking.part4.dele.situation')}</Text>
          <View style={styles.highlightCard}>
            <Text style={styles.bodyText}>{part4Question.situation}</Text>
          </View>
        </View>

        {/* Role Instructions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speaking.part4.dele.instructions')}</Text>
          <View style={styles.instructionCard}>
            <Text style={styles.bodyText}>{part4Question.roleInstructions}</Text>
          </View>
        </View>

        {/* Example Dialogue Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speaking.part4.dele.exampleDialogue')}</Text>
          <View style={styles.dialogueContainer}>
            {part4Question.exampleDialogue.map((turn, index) => (
              <View
                key={index}
                style={[
                  styles.dialogueTurn,
                  turn.speaker === 'Candidato' ? styles.candidateTurn : styles.interviewerTurn,
                ]}
              >
                <Text style={styles.speakerLabel}>{turn.speaker}:</Text>
                <Text style={styles.dialogueText}>{turn.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (part) {
      case 1:
        return renderPart1View();
      case 2:
        return renderPart2View();
      case 3:
        return renderPart3View();
      case 4:
        return renderPart4View();
      default:
        return (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>Invalid part number</Text>
          </View>
        );
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
    ...typography.textStyles.h3,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.md,
  },
  instructionText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.margin.lg,
    lineHeight: 22,
  },
  imageSection: {
  },
  imageCard: {
    width: '100%',
    height: 200,
    borderRadius: spacing.borderRadius.md,
  },
  firstSection: {
    marginTop: spacing.margin.lg,
  },
  section: {
    marginTop: spacing.margin.lg,
    paddingTop: spacing.padding.lg,
    borderTopWidth: 1,
    borderTopColor: colors.secondary[200],
  },
  sectionTitle: {
    ...typography.textStyles.h3,
    color: colors.primary[700],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.md,
  },
  toggleButton: {
    backgroundColor: colors.warning[500],
    paddingVertical: spacing.padding.sm,
    paddingHorizontal: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    alignSelf: 'flex-start',
    marginBottom: spacing.margin.md,
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
  contentCard: {
    backgroundColor: colors.secondary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    marginTop: spacing.margin.md,
  },
  discussionCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.md,
    borderWidth: 1,
    borderColor: colors.secondary[200],
  },
  questionCard: {
    flexDirection: 'row',
    backgroundColor: colors.secondary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.sm,
  },
  bulletPoint: {
    ...typography.textStyles.body,
    color: colors.primary[500],
    marginRight: spacing.margin.sm,
    fontWeight: typography.fontWeight.bold,
  },
  questionText: {
    ...typography.textStyles.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 22,
  },
  answerCard: {
    backgroundColor: colors.primary[50],
    padding: spacing.padding.sm,
    borderRadius: spacing.borderRadius.sm,
    marginTop: spacing.margin.sm,
  },
  answerLabel: {
    ...typography.textStyles.bodySmall,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
    marginBottom: spacing.margin.xs,
  },
  bodyText: {
    ...typography.textStyles.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  dialogueContainer: {
    marginTop: spacing.margin.md,
  },
  dialogueTurn: {
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.sm,
  },
  candidateTurn: {
    backgroundColor: colors.primary[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  interviewerTurn: {
    backgroundColor: colors.secondary[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary[500],
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
  highlightCard: {
    backgroundColor: colors.warning[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning[500],
  },
  instructionCard: {
    backgroundColor: colors.primary[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
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
});

export default DeleSpeakingAllPartsScreen;
