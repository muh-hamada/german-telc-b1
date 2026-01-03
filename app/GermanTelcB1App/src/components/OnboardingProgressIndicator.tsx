import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';

interface OnboardingProgressIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

const OnboardingProgressIndicator: React.FC<OnboardingProgressIndicatorProps> = ({
  totalSteps,
  currentStep,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        
        return (
          <View
            key={index}
            style={[
              styles.step,
              isCompleted && styles.stepCompleted,
              isCurrent && styles.stepCurrent,
            ]}
          />
        );
      })}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.margin.sm,
      paddingVertical: spacing.padding.lg,
    },
    step: {
      height: 4,
      flex: 1,
      backgroundColor: colors.border.light,
      borderRadius: 2,
      maxWidth: 60,
    },
    stepCompleted: {
      backgroundColor: colors.primary[500],
    },
    stepCurrent: {
      backgroundColor: colors.success[500],
    },
  });

export default OnboardingProgressIndicator;

