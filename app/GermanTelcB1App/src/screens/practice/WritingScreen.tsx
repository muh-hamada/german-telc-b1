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
import { useTranslation } from 'react-i18next';
import { useExamCompletion } from '../../contexts/CompletionContext';
import { HomeStackRouteProp } from '../../types/navigation.types';
import { dataService } from '../../services/data.service';
import { WritingExam } from '../../types/exam.types';
import WritingUI from '../../components/exam-ui/WritingUI';
import AdBanner from '../../components/AdBanner';
import { HIDE_ADS } from '../../config/demo.config';

const WritingScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<HomeStackRouteProp<'Writing'>>();
  const navigation = useNavigation();
  const examId = route.params?.examId ?? 0;
  
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
      Alert.alert(
        t('common.success'),
        newStatus ? t('exam.markedCompleted') : t('exam.markedIncomplete')
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('exam.completionFailed'));
    }
  };

  const handleComplete = (score: number) => {
    setExamResult({ score });
    console.log('Writing completed with score:', score);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('exam.loadingExam')}</Text>
        </View>
        {!HIDE_ADS && <AdBanner />}
      </SafeAreaView>
    );
  }

  if (!currentExam) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('exam.failedToLoad')}</Text>
        </View>
        {!HIDE_ADS && <AdBanner />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <WritingUI exam={currentExam} onComplete={handleComplete} />
      {!HIDE_ADS && <AdBanner />}
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
