/**
 * Vocabulary Progress Circle Component
 * 
 * Circular progress indicator for vocabulary learning.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing, typography } from '../theme';

interface VocabularyProgressCircleProps {
  current: number;
  total: number;
  size?: number;
}

const VocabularyProgressCircle: React.FC<VocabularyProgressCircleProps> = ({
  current,
  total,
  size = 120,
}) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.secondary[200]}
          strokeWidth="10"
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary[500]}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={styles.currentText}>{current}</Text>
        <Text style={styles.totalText}>/ {total}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentText: {
    ...typography.textStyles.h2,
    color: colors.primary[500],
    fontWeight: 'bold',
  },
  totalText: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
  },
});

export default VocabularyProgressCircle;

