import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { colors, spacing, typography } from '../theme';
import type { MockExamStep } from '../types/mock-exam.types';

interface ExamStepperProps {
  steps: MockExamStep[];
  currentStepId: string;
}

const ExamStepper: React.FC<ExamStepperProps> = ({ steps, currentStepId }) => {
  const currentStepIndex = steps.findIndex(step => step.id === currentStepId);

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStepId;
          const isCompleted = step.isCompleted;
          const isPast = index < currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step Dot */}
              <View
                style={[
                  styles.stepDot,
                  isCurrent && styles.stepDotCurrent,
                  isCompleted && styles.stepDotCompleted,
                  !isCurrent && !isCompleted && !isPast && styles.stepDotUpcoming,
                ]}
              >
                {isCompleted && (
                  <Text style={styles.stepCheckmark}>✓</Text>
                )}
              </View>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    (isCompleted || isPast) && styles.connectorCompleted,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  stepsRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.secondary[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotCurrent: {
    backgroundColor: colors.primary[500],
    borderWidth: 3,
    borderColor: colors.primary[300],
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  stepDotCompleted: {
    backgroundColor: colors.success[500],
  },
  stepDotUpcoming: {
    backgroundColor: colors.secondary[200],
  },
  stepCheckmark: {
    ...typography.textStyles.bodySmall,
    color: colors.background.secondary,
    fontWeight: typography.fontWeight.bold,
    fontSize: 14,
  },
  connector: {
    flex: 1,
    height: 3,
    backgroundColor: colors.secondary[200],
    marginHorizontal: spacing.margin.xs,
  },
  connectorCompleted: {
    backgroundColor: colors.success[500],
  },
});

export default ExamStepper;

