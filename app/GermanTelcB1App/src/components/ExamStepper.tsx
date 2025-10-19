import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStepId;
          const isCompleted = step.isCompleted;
          const isPast = index < currentStepIndex;

          return (
            <View key={step.id} style={styles.stepWrapper}>
              <View style={styles.stepContainer}>
                {/* Step Circle */}
                <View
                  style={[
                    styles.stepCircle,
                    isCurrent && styles.stepCircleCurrent,
                    isCompleted && styles.stepCircleCompleted,
                    isPast && !isCompleted && styles.stepCirclePast,
                  ]}
                >
                  {isCompleted ? (
                    <Text style={styles.stepCheckmark}>✓</Text>
                  ) : (
                    <Text
                      style={[
                        styles.stepNumber,
                        isCurrent && styles.stepNumberCurrent,
                        isPast && styles.stepNumberPast,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>

                {/* Step Label */}
                <View style={styles.stepLabelContainer}>
                  <Text
                    style={[
                      styles.stepLabel,
                      isCurrent && styles.stepLabelCurrent,
                    ]}
                    numberOfLines={2}
                  >
                    {step.partName}
                  </Text>
                </View>
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
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing.padding.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    paddingHorizontal: spacing.padding.md,
    alignItems: 'center',
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    width: 80,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.margin.xs,
  },
  stepCircleCurrent: {
    backgroundColor: colors.primary[500],
    borderWidth: 3,
    borderColor: colors.primary[300],
  },
  stepCircleCompleted: {
    backgroundColor: colors.success[500],
  },
  stepCirclePast: {
    backgroundColor: colors.secondary[300],
  },
  stepNumber: {
    ...typography.textStyles.bodySmall,
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.bold,
  },
  stepNumberCurrent: {
    color: colors.background.secondary,
  },
  stepNumberPast: {
    color: colors.text.secondary,
  },
  stepCheckmark: {
    ...typography.textStyles.body,
    color: colors.background.secondary,
    fontWeight: typography.fontWeight.bold,
  },
  stepLabelContainer: {
    width: '100%',
    paddingHorizontal: spacing.padding.xs,
  },
  stepLabel: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 12,
  },
  stepLabelCurrent: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.bold,
  },
  connector: {
    width: 24,
    height: 2,
    backgroundColor: colors.secondary[200],
    marginHorizontal: spacing.margin.xs,
  },
  connectorCompleted: {
    backgroundColor: colors.success[500],
  },
});

export default ExamStepper;

