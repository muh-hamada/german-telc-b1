/**
 * Prep Plan Settings Screen
 * 
 * Allows users to update their study plan configuration:
 * - Change exam date
 * - Adjust daily study hours
 * - Modify study days per week
 * - Update preferred study time
 * - Preview changes before applying
 * - Confirmation before regenerating plan
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DatePicker from 'react-native-date-picker';
import { colors, typography } from '../../theme';
import { useCustomTranslation } from '../../hooks/useCustomTranslation';
import { useAuth } from '../../contexts/AuthContext';
import { HomeStackParamList } from '../../types/navigation.types';
import { StudyPlan, PrepPlanConfig, PrepPlanUpdateRequest } from '../../types/prep-plan.types';
import { prepPlanService } from '../../services/prep-plan.service';
import { AnalyticsEvents, logEvent } from '../../services/analytics.events';
import { hapticSuccess } from '../../utils/haptic';

type Props = StackScreenProps<HomeStackParamList, 'PrepPlanSettings'>;

const PrepPlanSettingsScreen: React.FC<Props> = () => {
  const { t } = useCustomTranslation();
  const { user } = useAuth();
  const navigation = useNavigation();

  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [examDate, setExamDate] = useState(new Date());
  const [dailyStudyHours, setDailyStudyHours] = useState(2);
  const [studyDays, setStudyDays] = useState<boolean[]>([
    true,
    true,
    true,
    true,
    true,
    true,
    true,
  ]);
  const [preferredStudyTime, setPreferredStudyTime] = useState<
    'morning' | 'afternoon' | 'evening' | 'flexible'
  >('evening');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Study hours options
  const studyHoursOptions = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5];
  const dayNames = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const studyTimeOptions: Array<'morning' | 'afternoon' | 'evening' | 'flexible'> = [
    'morning',
    'afternoon',
    'evening',
    'flexible',
  ];

  useEffect(() => {
    loadPlan();
  }, [user]);

  useEffect(() => {
    checkForChanges();
  }, [examDate, dailyStudyHours, studyDays, preferredStudyTime, plan]);

  const loadPlan = async () => {
    if (!user) return;

    try {
      const activePlan = await prepPlanService.getActivePlan(user.uid);
      if (activePlan) {
        setPlan(activePlan);
        // Initialize form with current values
        setExamDate(new Date(activePlan.config.examDate));
        setDailyStudyHours(activePlan.config.dailyStudyHours);
        setStudyDays(activePlan.config.studyDays);
        setPreferredStudyTime(activePlan.config.preferredStudyTime || 'flexible');
      } else {
        Alert.alert(
          t('prepPlan.settings.noPlan'),
          t('prepPlan.settings.noPlanDesc'),
          [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('[PrepPlanSettings] Error loading plan:', error);
      Alert.alert(t('common.error'), t('prepPlan.settings.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const checkForChanges = () => {
    if (!plan) return;

    const hasDateChange =
      examDate.toDateString() !== new Date(plan.config.examDate).toDateString();
    const hasHoursChange = dailyStudyHours !== plan.config.dailyStudyHours;
    const hasDaysChange = JSON.stringify(studyDays) !== JSON.stringify(plan.config.studyDays);
    const hasTimeChange =
      preferredStudyTime !== (plan.config.preferredStudyTime || 'flexible');

    setHasChanges(hasDateChange || hasHoursChange || hasDaysChange || hasTimeChange);
  };

  const handleSave = () => {
    if (!hasChanges) {
      Alert.alert(t('prepPlan.settings.noChanges'), t('prepPlan.settings.noChangesDesc'));
      return;
    }

    // Validate
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(examDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      Alert.alert(t('common.error'), t('prepPlan.settings.examDateInPast'));
      return;
    }

    const activeDays = studyDays.filter(d => d).length;
    if (activeDays === 0) {
      Alert.alert(t('common.error'), t('prepPlan.settings.noStudyDays'));
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmUpdate = async () => {
    if (!user || !plan) return;

    setShowConfirmModal(false);
    setIsSaving(true);

    try {
      const updateRequest: PrepPlanUpdateRequest = {
        planId: plan.planId,
        examDate,
        newConfig: {
          examDate,
          dailyStudyHours,
          studyDaysPerWeek: studyDays.filter(d => d).length,
          studyDays,
          preferredStudyTime,
        },
        preserveProgress: true,
      };

      await prepPlanService.updatePlanConfig(user.uid, updateRequest);

      // Trigger haptic feedback for success
      hapticSuccess();

      logEvent(AnalyticsEvents.PREP_PLAN_SETTINGS_UPDATED, {
        hasDateChange: examDate.toDateString() !== new Date(plan.config.examDate).toDateString(),
        hasHoursChange: dailyStudyHours !== plan.config.dailyStudyHours,
        hasDaysChange: JSON.stringify(studyDays) !== JSON.stringify(plan.config.studyDays),
      });

      Alert.alert(
        t('common.success'),
        t('prepPlan.settings.updateSuccess'),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('[PrepPlanSettings] Error updating plan:', error);
      Alert.alert(t('common.error'), t('prepPlan.settings.updateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStudyDay = (index: number) => {
    const newStudyDays = [...studyDays];
    newStudyDays[index] = !newStudyDays[index];
    setStudyDays(newStudyDays);
  };

  // Calculate stats for preview
  const calculateStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(examDate);
    targetDate.setHours(0, 0, 0, 0);

    const daysUntilExam = Math.ceil(
      (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const weeks = Math.ceil(daysUntilExam / 7);
    const activeDaysPerWeek = studyDays.filter(d => d).length;
    const totalStudyHours = Math.round(
      (daysUntilExam / 7) * activeDaysPerWeek * dailyStudyHours
    );

    return {
      daysUntilExam,
      weeks,
      totalStudyHours,
      activeDaysPerWeek,
    };
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!plan) {
    return null;
  }

  const stats = calculateStats();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Current Settings Info */}
        <View style={styles.infoCard}>
          <Icon name="info" size={24} color={colors.primary[500]} />
          <Text style={styles.infoText}>{t('prepPlan.settings.updateInfo')}</Text>
        </View>

        {/* Exam Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('prepPlan.onboarding.examDate.title')}</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="calendar-today" size={24} color={colors.primary[500]} />
            <View style={styles.dateButtonText}>
              <Text style={styles.dateButtonLabel}>
                {t('prepPlan.settings.selectedDate')}
              </Text>
              <Text style={styles.dateButtonValue}>
                {examDate.toLocaleDateString()}
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Daily Study Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('prepPlan.onboarding.schedule.dailyHours')}
          </Text>
          <View style={styles.hoursGrid}>
            {studyHoursOptions.map(hours => (
              <TouchableOpacity
                key={hours}
                style={[
                  styles.hourButton,
                  dailyStudyHours === hours && styles.hourButtonActive,
                ]}
                onPress={() => setDailyStudyHours(hours)}
              >
                <Text
                  style={[
                    styles.hourButtonText,
                    dailyStudyHours === hours && styles.hourButtonTextActive,
                  ]}
                >
                  {t('common.units.hoursValue', { count: hours })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Study Days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('prepPlan.onboarding.schedule.studyDays')}
          </Text>
          <View style={styles.daysGrid}>
            {dayNames.map((day, index) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  studyDays[index] && styles.dayButtonActive,
                ]}
                onPress={() => toggleStudyDay(index)}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    studyDays[index] && styles.dayButtonTextActive,
                  ]}
                >
                  {t(`common.days.${day}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.dayCount}>
            {t('prepPlan.settings.daysSelectedCount', { count: studyDays.filter(d => d).length, total: 7 })}
          </Text>
        </View>

        {/* Preferred Study Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('prepPlan.onboarding.studyTime.title')}
          </Text>
          {studyTimeOptions.map(time => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeOption,
                preferredStudyTime === time && styles.timeOptionActive,
              ]}
              onPress={() => setPreferredStudyTime(time)}
            >
              <View style={styles.timeOptionLeft}>
                <Icon
                  name={
                    time === 'morning'
                      ? 'wb-sunny'
                      : time === 'afternoon'
                      ? 'wb-cloudy'
                      : time === 'evening'
                      ? 'nights-stay'
                      : 'access-time'
                  }
                  size={24}
                  color={
                    preferredStudyTime === time ? colors.primary[500] : colors.text.secondary
                  }
                />
                <View style={styles.timeOptionText}>
                  <Text
                    style={[
                      styles.timeOptionTitle,
                      preferredStudyTime === time && styles.timeOptionTitleActive,
                    ]}
                  >
                    {t(`prepPlan.onboarding.studyTime.${time}`)}
                  </Text>
                  <Text style={styles.timeOptionDesc}>
                    {t(`prepPlan.onboarding.studyTime.${time}Desc`)}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.radio,
                  preferredStudyTime === time && styles.radioActive,
                ]}
              >
                {preferredStudyTime === time && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview Stats */}
        {hasChanges && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>{t('prepPlan.settings.newPlanPreview')}</Text>
            <View style={styles.previewStats}>
              <View style={styles.previewStat}>
                <Text style={styles.previewStatLabel}>
                  {t('prepPlan.onboarding.summary.daysUntilExam')}
                </Text>
                <Text style={styles.previewStatValue}>{stats.daysUntilExam}</Text>
              </View>
              <View style={styles.previewStat}>
                <Text style={styles.previewStatLabel}>
                  {t('prepPlan.onboarding.summary.totalWeeks')}
                </Text>
                <Text style={styles.previewStatValue}>{stats.weeks}</Text>
              </View>
              <View style={styles.previewStat}>
                <Text style={styles.previewStatLabel}>
                  {t('prepPlan.onboarding.summary.totalStudyHours')}
                </Text>
                <Text style={styles.previewStatValue}>{t('common.units.hoursValue', { count: stats.totalStudyHours })}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="save" size={20} color={colors.background.secondary} />
              <Text style={styles.saveButtonText}>
                {t('prepPlan.settings.saveChanges')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      <DatePicker
        modal
        open={showDatePicker}
        date={examDate}
        mode="date"
        minimumDate={new Date()}
        onConfirm={date => {
          setShowDatePicker(false);
          setExamDate(date);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Icon name="error" size={48} color={colors.primary[500]} />
            <Text style={styles.modalTitle}>
              {t('prepPlan.settings.confirmUpdate')}
            </Text>
            <Text style={styles.modalMessage}>
              {t('prepPlan.settings.confirmUpdateDesc')}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={handleConfirmUpdate}
              >
                <Text style={styles.modalButtonConfirmText}>
                  {t('prepPlan.settings.confirm')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary[500] + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  dateButtonText: {
    flex: 1,
  },
  dateButtonLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  dateButtonValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hourButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  hourButtonActive: {
    backgroundColor: colors.primary[500] + '15',
    borderColor: colors.primary[500],
  },
  hourButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  hourButtonTextActive: {
    color: colors.primary[500],
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    flex: 1,
    minWidth: 60,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: colors.primary[500] + '15',
    borderColor: colors.primary[500],
  },
  dayButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: colors.primary[500],
  },
  dayCount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  timeOptionActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[500] + '10',
  },
  timeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  timeOptionText: {
    flex: 1,
  },
  timeOptionTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: '600',
  },
  timeOptionTitleActive: {
    color: colors.primary[500],
  },
  timeOptionDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: colors.primary[500],
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[500],
  },
  previewCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  previewTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  previewStat: {
    alignItems: 'center',
  },
  previewStatLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  previewStatValue: {
    fontSize: typography.fontSize['2xl'],
    color: colors.primary[500],
    fontWeight: 'bold',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.background.secondary,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: 12,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.border.light,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    fontSize: typography.fontSize.base,
    color: colors.background.secondary,
    fontWeight: 'bold',
  },
});

export default PrepPlanSettingsScreen;

