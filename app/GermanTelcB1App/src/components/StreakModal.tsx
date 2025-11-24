import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { colors, spacing, typography } from '../theme';
import { StreakData } from '../services/firebase-streaks.service';
import RewardProgressIndicator from './RewardProgressIndicator';

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

  console.log('[StreakModal] Visible:', visible);
  if (!streakData) {
    console.log('[StreakModal] Streak data is null');
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
      // Any activity counts toward the streak
      const meetsThreshold = activity && activity.activitiesCount > 0;

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
              <View style={styles.streakNumberContainer}>
                <Text style={styles.streakNumberText}>{currentStreak}</Text>
              </View>
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

            {/* Reward Progress Indicator */}
            <RewardProgressIndicator currentStreak={currentStreak} />

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
  streakNumberContainer: {
    position: 'absolute',
    bottom: -10,
    right: 0,
    left: 0,
    alignItems: 'center',
  },
  streakNumberText: {
    textAlign: 'center',
    borderRadius: spacing.borderRadius.full,
    backgroundColor: colors.error[500],
    padding: spacing.padding.xs,
    ...typography.textStyles.h4,
    color: colors.white,
    minWidth: 30,
    lineHeight: 22,
  },
  title: {
    ...typography.textStyles.h2,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.margin.lg,
    textAlign: 'center',
  },
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.margin.md,
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
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.margin.md,
    lineHeight: 22,
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

