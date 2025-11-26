import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../../theme';
import Card from '../../components/Card';
import { HomeStackNavigationProp } from '../../types/navigation.types';
import dataService from '../../services/data.service';
import { ListeningPracticeInterview } from '../../types/exam.types';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { useProgress } from '../../contexts/ProgressContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ListeningPracticeListScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useCustomTranslation();
  const [interviews, setInterviews] = useState<ListeningPracticeInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProgress } = useProgress();

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await dataService.getListeningPracticeInterviews();
        setInterviews(data);
      } catch (error) {
        console.error('Error loading interviews:', error);
      } finally {
        setLoading(false);
      }
      logEvent(AnalyticsEvents.PRACTICE_SECTION_OPENED, { section: 'listening_practice_list' });
    };
    loadData();
  }, []);

  const handleInterviewPress = (interview: ListeningPracticeInterview, index: number) => {
    logEvent(AnalyticsEvents.LISTENING_PRACTICE_STARTED, {
      title: interview.title,
      id: index,
      duration: interview.duration
    });
    navigation.navigate('ListeningPractice', { interview, id: index });
  };

  const isCompleted = (index: number) => {
    return userProgress?.exams?.some(e => 
        e.examType === 'listening-practice' && 
        e.examId === index && 
        e.completed
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={interviews}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <Card style={styles.card} onPress={() => handleInterviewPress(item, index)}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {isCompleted(index) && <Icon name="check-circle" size={20} color={colors.success[500]} />}
            </View>
            <Text style={styles.cardDuration}>{t('common.duration')}: {item.duration}</Text>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No interviews available at the moment.</Text>
          </View>
        }
      />
    </SafeAreaView>
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
  listContent: {
    padding: spacing.padding.lg,
  },
  card: {
    marginBottom: spacing.margin.md,
    minHeight: 80,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.margin.xs,
    direction: 'ltr',
  },
  cardTitle: {
    ...typography.textStyles.h5,
    color: colors.text.primary,
    direction: 'ltr',
    flex: 1,
  },
  cardDuration: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    direction: 'ltr',
    alignSelf: 'flex-start',
    marginTop: spacing.margin.sm,
  },
  emptyContainer: {
    padding: spacing.padding.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
  },
});

export default ListeningPracticeListScreen;
