import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, typography } from '../../theme';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useExamCompletion } from '../../contexts/CompletionContext';
import { HomeStackRouteProp } from '../../types/navigation.types';
import { dataService } from '../../services/data.service';
import { WritingExam } from '../../types/exam.types';
import WritingUI from '../../components/exam-ui/WritingUI';
import AdBanner from '../../components/AdBanner';
import { HIDE_ADS } from '../../config/development.config';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { useProgress } from '../../contexts/ProgressContext';

const WritingScreen: React.FC = () => {
  const { t } = useCustomTranslation();
  const route = useRoute<HomeStackRouteProp<'Writing'>>();
  const navigation = useNavigation();
  const examId = route.params?.examId ?? 0;
  const { updateExamProgress } = useProgress();
  
  const { isCompleted, toggleCompletion } = useExamCompletion('writing', 1, examId);
  
  const [examResult, setExamResult] = useState<{ score: number } | null>(null);
  const [currentExam, setCurrentExam] = useState<WritingExam | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      setIsLoading(true);
      const exam = await dataService.getWritingExam(examId);
      setCurrentExam(exam || null);
    } catch (error) {
      console.error('Error loading exam:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      const newStatus = await toggleCompletion(examResult?.score || 0);
      // The alert doesn't add much value, so we'll just log the event
      logEvent(AnalyticsEvents.PRACTICE_MARK_COMPLETED_TOGGLED, {
        section: 'writing',
        part: 1,
        exam_id: examId,
        completed: newStatus,
        score: examResult?.score || 0,
        max_score: 45,
        percentage: Math.round((examResult?.score || 0 / 45) * 100),
      });
    } catch (error: any) {
      if (error.message === 'auth/not-logged-in') {
        Alert.alert(t('common.error'), t('exam.loginToSaveProgress'));
      } else {
        Alert.alert(t('common.error'), t('exam.completionFailed'));
      }
    }
  };

  const handleComplete = (score: number) => {
    const maxScore = 45;
    const percentage = Math.round((score / maxScore) * 100);

    logEvent(AnalyticsEvents.PRACTICE_EXAM_COMPLETED, {
      section: 'writing',
      part: 1,
      exam_id: examId,
      score,
      max_score: maxScore,
      percentage: percentage,
    });

    updateExamProgress('writing', examId, [], score, maxScore);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('exam.loadingExam')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentExam) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('exam.failedToLoad')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <WritingUI exam={currentExam} onComplete={handleComplete} />
      {!HIDE_ADS && <AdBanner screen="writing" />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.textStyles.body,
    color: colors.error[500],
  },
  headerButton: {
    marginRight: spacing.margin.md,
    padding: spacing.padding.xs,
  },
});

export default WritingScreen;
