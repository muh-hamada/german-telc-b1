import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useCustomTranslation } from '../hooks/useCustomTranslation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';
import Button from './Button';

interface HourPickerModalProps {
  visible: boolean;
  selectedHour: number;
  onClose: () => void;
  onHourSelect: (hour: number) => void;
}

const HourPickerModal: React.FC<HourPickerModalProps> = ({
  visible,
  selectedHour,
  onClose,
  onHourSelect,
}) => {
  const { t } = useCustomTranslation();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Popular notification times
  const popularHours = [
    { hour: 9, label: '9 am' },
    { hour: 12, label: '12 pm' },
    { hour: 16, label: '4 pm' },
    { hour: 18, label: '6 pm' },
  ];

  // Generate all hours (0-23)
  const allHours = Array.from({ length: 24 }, (_, i) => i);

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 am';
    if (hour === 12) return '12 pm';
    if (hour < 12) return `${hour} am`;
    return `${hour - 12} pm`;
  };

  const handleHourSelect = (hour: number) => {
    onHourSelect(hour);
    onClose();
  };

  const renderHourItem = (item: number) => (
    <TouchableOpacity
      key={item}
      style={[
        styles.hourItem,
        selectedHour === item && styles.hourItemSelected,
      ]}
      onPress={() => handleHourSelect(item)}
    >
      <Text
        style={[
          styles.hourText,
          selectedHour === item && styles.hourTextSelected,
        ]}
      >
        {formatHour(item)}
      </Text>
    </TouchableOpacity>
  );

  const renderPopularHour = (popular: { hour: number; label: string }) => (
    <TouchableOpacity
      key={popular.hour}
      style={[
        styles.popularButton,
        selectedHour === popular.hour && styles.popularButtonSelected,
      ]}
      onPress={() => handleHourSelect(popular.hour)}
    >
      <Text
        style={[
          styles.popularText,
          selectedHour === popular.hour && styles.popularTextSelected,
        ]}
      >
        {popular.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <SafeAreaView style={styles.container}>
          <ScrollView 
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{t('settings.selectHour')}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Hour Picker */}
            <View style={styles.pickerContainer}>
              {Array.from({ length: 4 }).map((_, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                  {allHours.slice(rowIndex * 6, (rowIndex + 1) * 6).map((hour) => (
                    <View key={hour} style={styles.hourItemWrapper}>
                      {renderHourItem(hour)}
                    </View>
                  ))}
                </View>
              ))}
            </View>

            {/* Popular Hours */}
            <View style={styles.popularSection}>
              <Text style={styles.popularTitle}>{t('settings.popularTimes')}</Text>
              <View style={styles.popularContainer}>
                {popularHours.map(renderPopularHour)}
              </View>
            </View>

            {/* Done Button */}
            <Button
              title={t('common.done')}
              onPress={onClose}
              variant="primary"
              style={styles.doneButton}
            />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    backdrop: {
      flex: 1,
    },
    container: {
      backgroundColor: colors.background.primary,
      borderTopLeftRadius: spacing.borderRadius.xl,
      borderTopRightRadius: spacing.borderRadius.xl,
      maxHeight: '90%',
    },
    content: {
      padding: spacing.padding.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.margin.lg,
    },
    title: {
      ...typography.textStyles.h3,
      color: colors.text.primary,
    },
    closeButton: {
      padding: spacing.padding.sm,
    },
    closeText: {
      ...typography.textStyles.h3,
      color: colors.text.secondary,
    },
    pickerContainer: {
      marginBottom: spacing.margin.lg,
    },
    row: {
      flexDirection: 'row',
      marginBottom: spacing.margin.xs,
    },
    hourItemWrapper: {
      flex: 1,
    },
    hourItem: {
      flex: 1,
      margin: spacing.margin.xs,
      paddingVertical: spacing.padding.sm,
      paddingHorizontal: spacing.padding.xs,
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.sm,
      alignItems: 'center',
      minWidth: 50,
    },
    hourItemSelected: {
      backgroundColor: colors.primary[500],
    },
    hourText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      fontSize: typography.fontSize.sm,
    },
    hourTextSelected: {
      color: colors.text.inverse,
      fontWeight: typography.fontWeight.semibold,
    },
    popularSection: {
      marginBottom: spacing.margin.lg,
    },
    popularTitle: {
      ...typography.textStyles.h4,
      color: colors.text.primary,
      marginBottom: spacing.margin.sm,
    },
    popularContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    popularButton: {
      flex: 1,
      marginHorizontal: spacing.margin.xs,
      paddingVertical: spacing.padding.md,
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.md,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    popularButtonSelected: {
      backgroundColor: colors.primary[50],
      borderColor: colors.primary[500],
    },
    popularText: {
      ...typography.textStyles.body,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.medium,
    },
    popularTextSelected: {
      color: colors.primary[500],
      fontWeight: typography.fontWeight.semibold,
    },
    doneButton: {
      marginTop: spacing.margin.md,
    },
  });

export default HourPickerModal;