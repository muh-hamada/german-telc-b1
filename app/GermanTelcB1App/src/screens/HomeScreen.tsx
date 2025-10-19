import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../theme';
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressCard from '../components/ProgressCard';
import LoginPromptModal from '../components/LoginPromptModal';
import { HomeStackNavigationProp } from '../types/navigation.types';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeStackNavigationProp>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { hasUnsyncedProgress } = useProgress();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [hasCheckedProgress, setHasCheckedProgress] = useState(false);

  const handleExamStructurePress = () => {
    navigation.navigate('ExamStructure');
  };

  const handlePracticePress = () => {
    navigation.navigate('PracticeMenu');
  };

  // Check if user has unsynced progress and show login prompt
  useEffect(() => {
    const checkProgressAndShowPrompt = async () => {
      if (!user && !hasCheckedProgress) {
        setHasCheckedProgress(true);
        const hasProgress = await hasUnsyncedProgress();
        if (hasProgress) {
          // Show login prompt after a short delay
          setTimeout(() => {
            setShowLoginPrompt(true);
          }, 2000);
        }
      }
    };

    checkProgressAndShowPrompt();
  }, [user, hasUnsyncedProgress, hasCheckedProgress]);

  const handleLoginSuccess = () => {
    // Refresh progress after successful login
    // The ProgressContext will automatically handle syncing
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary[500]}
      />
      <View style={styles.header}>
        <Text style={styles.title}>{t('home.title')}</Text>
      </View>
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProgressCard />
        
        <Card style={styles.card} onPress={handleExamStructurePress}>
          <Text style={styles.cardTitle}>{t('home.examStructure')}</Text>
          <Text style={styles.cardDescription}>
            Learn about the TELC B1 exam format and scoring
          </Text>
        </Card>

        <Card style={styles.card} onPress={handlePracticePress}>
          <Text style={styles.cardTitle}>{t('home.practice')}</Text>
          <Text style={styles.cardDescription}>
            Practice all exam sections: Reading, Listening, Writing, and Speaking
          </Text>
        </Card>
      </ScrollView>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.xl,
    paddingHorizontal: spacing.padding.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.textStyles.h2,
    color: colors.white,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.padding.lg,
    gap: spacing.margin.md,
  },
  card: {
    minHeight: 120,
    justifyContent: 'center',
  },
  cardTitle: {
    ...typography.textStyles.h3,
    color: colors.primary[500],
    marginBottom: spacing.margin.sm,
  },
  cardDescription: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
});

export default HomeScreen;
