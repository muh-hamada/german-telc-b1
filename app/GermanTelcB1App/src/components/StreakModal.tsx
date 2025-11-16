import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  I18nManager,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';
import { StreakData } from '../services/firebase-streaks.service';

interface StreakModalProps {
  visible: boolean;
  streakData: StreakData | null;
  onContinue: () => void;
  onClose: () => void;
}

const StreakModal: React.FC<StreakModalProps> = ({
  visible,
  streakData,
  onContinue,
  onClose,
}) => {
  const { t } = useCustomTranslation();

  if (!streakData) {
    return null;
  }

  const currentStreak = streakData.currentStreak;
  
  // Get last 7 days to show in calendar
  const getWeekDays = () => {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];
      
      const hasActivity = streakData.dailyActivities[dateString] !== undefined;
      const activity = streakData.dailyActivities[dateString];
      const meetsThreshold = activity && (activity.totalQuestions >= 10 || activity.examsCompleted >= 1);
      
      days.push({
        name: dayName,
        date: dateString,
        hasActivity: meetsThreshold,
        isToday: i === 0,
      });
    }
    
    return days;
  };

  const weekDays = getWeekDays();
  const completedDaysThisWeek = weekDays.filter(d => d.hasActivity).length;
  
  // Calculate progress message
  const getProgressMessage = () => {
    if (completedDaysThisWeek === 7) {
      return t('streaks.perfectWeekComplete');
    } else if (completedDaysThisWeek >= 4) {
      return t('streaks.perfectWeek');
    } else if (completedDaysThisWeek >= 2) {
      return t('streaks.keepGoing');
    } else {
      return t('streaks.greatStart');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Fire icon with streak number */}
            <View style={styles.iconContainer}>
              <Text style={styles.fireIcon}>🔥</Text>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
            </View>
            
            {/* Streak title */}
            <Text style={styles.title}>
              {t('streaks.currentStreak', { count: currentStreak })}
            </Text>

            {/* Weekly calendar */}
            <View style={styles.calendarContainer}>
              {weekDays.map((day, index) => (
                <View key={index} style={styles.dayColumn}>
                  <Text style={styles.dayName}>{day.name}</Text>
                  <View style={[
                    styles.dayCircle,
                    day.hasActivity && styles.dayCircleComplete,
                    day.isToday && !day.hasActivity && styles.dayCircleToday,
                  ]}>
                    {day.hasActivity ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : day.isToday ? (
                      <Text style={styles.starIcon}>⭐</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>

            {/* Progress message */}
            <Text style={styles.message}>
              {getProgressMessage()}
            </Text>

            {/* Reward info if close to 7 days */}
            {currentStreak >= 3 && currentStreak < 7 && (
              <View style={styles.rewardHint}>
                <Text style={styles.rewardHintText}>
                  {t('streaks.rewardHint', { days: 7 - currentStreak })}
                </Text>
              </View>
            )}

            {/* Continue button */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={onContinue}
            >
              <Text style={styles.continueButtonText}>
                {t('common.continue')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.padding.lg,
  },
  modalContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: spacing.borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...spacing.shadow.lg,
  },
  scrollContent: {
    padding: spacing.padding.xl,
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: spacing.margin.md,
  },
  fireIcon: {
    fontSize: 80,
  },
  streakNumber: {
    position: 'absolute',
    bottom: -25,
    right: 0,
    ...typography.textStyles.h1,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
    backgroundColor: colors.warning[500],
    paddingHorizontal: spacing.padding.sm,
    paddingVertical: spacing.padding.xs,
    borderRadius: spacing.borderRadius.full,
    minWidth: 40,
    textAlign: 'center',
  },
  title: {
    ...typography.textStyles.h2,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.lg,
    textAlign: 'center',
  },
  calendarContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.margin.lg,
    paddingHorizontal: spacing.padding.sm,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayName: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
    marginBottom: spacing.margin.xs,
    fontSize: 11,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary[100],
    borderWidth: 2,
    borderColor: colors.secondary[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleComplete: {
    backgroundColor: colors.warning[500],
    borderColor: colors.warning[600],
  },
  dayCircleToday: {
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  checkmark: {
    color: colors.white,
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
  },
  starIcon: {
    fontSize: 18,
  },
  message: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.margin.lg,
    lineHeight: 22,
  },
  rewardHint: {
    backgroundColor: colors.success[50],
    padding: spacing.padding.md,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.margin.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.success[500],
  },
  rewardHintText: {
    ...typography.textStyles.bodySmall,
    color: colors.success[700],
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.xl,
    borderRadius: spacing.borderRadius.lg,
    width: '100%',
    alignItems: 'center',
    ...spacing.shadow.md,
  },
  continueButtonText: {
    ...typography.textStyles.body,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
});

export default StreakModal;

