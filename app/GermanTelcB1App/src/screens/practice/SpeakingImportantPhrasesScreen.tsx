import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { spacing, typography, type ThemeColors } from '../../theme';
import { useAppTheme } from '../../contexts/ThemeContext';
import dataService from '../../services/data.service';
import { SpeakingImportantPhrasesContent, SpeakingImportantPhrasesGroup } from '../../types/exam.types';
import { HomeStackParamList } from '../../types/navigation.types';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useExamCompletion } from '../../contexts/CompletionContext';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';

type SpeakingPart4RouteProp = RouteProp<HomeStackParamList, 'SpeakingPart4'>;

const SpeakingImportantPhrasesScreen: React.FC = () => {
  const { t } = useCustomTranslation();
  const route = useRoute<SpeakingPart4RouteProp>();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<SpeakingImportantPhrasesContent | null>(null);
  const groupIndex = route.params?.groupIndex ?? 0;
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { isCompleted, toggleCompletion } = useExamCompletion('speaking', 4, groupIndex);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dataService.getSpeakingImportantPhrases();
      setContent(data);
    } catch (err) {
      console.error('Error loading speaking important phrases:', err);
      setError(t('common.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const groups: SpeakingImportantPhrasesGroup[] = content?.groups || [];
  const activeGroup = groups[groupIndex];

  // Setup header completion toggle
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleToggleCompletion} style={styles.headerButton}>
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
      logEvent(AnalyticsEvents.PRACTICE_MARK_COMPLETED_TOGGLED, { section: 'speaking', part: 4, exam_id: groupIndex, completed: newStatus });
      // Alert.alert(
      //   t('common.success'),
      //   newStatus ? t('exam.markedCompleted') : t('exam.markedIncomplete')
      // );
    } catch (err: any) {
      if (err.message === 'auth/not-logged-in') {
        Alert.alert(t('common.error'), t('exam.loginToSaveProgress'));
      } else {
        Alert.alert(t('common.error'), t('exam.completionFailed'));
      }
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

  if (error || !content) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error || 'Failed to load data'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.mainCard}>
          <View style={styles.headerContainer}>
            {!!content.title && <Text style={styles.title}>{content.title}</Text>}
            {!!content.note && <Text style={styles.note}>{content.note}</Text>}
            {!!activeGroup?.name && (
              <Text style={styles.groupHeading}>{activeGroup.name}</Text>
            )}
          </View>

          <View style={styles.contentContainer}>
            {activeGroup?.phrases?.map((phrase, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.listItemText}>{phrase}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.padding.lg },
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
  headerContainer: {  },
  title: { ...typography.textStyles.h2, color: colors.text.primary, marginBottom: spacing.margin.xs },
  note: { ...typography.textStyles.body, color: colors.text.secondary, fontStyle: 'italic' as 'italic' },
  groupHeading: {
    ...typography.textStyles.h2,
    color: colors.text.primary,
    marginBottom: spacing.margin.xs,
  },
  contentContainer: { marginTop: spacing.margin.md },
  listItem: {
    paddingVertical: spacing.padding.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  listItemText: { ...typography.textStyles.body, color: colors.text.primary },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { ...typography.textStyles.body, color: colors.text.primary },
  headerButton: {
    padding: spacing.padding.sm,
    marginRight: spacing.margin.sm,
  },
});

export default SpeakingImportantPhrasesScreen;


