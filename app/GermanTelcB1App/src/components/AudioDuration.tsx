import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
} from 'react-native';
import { ThemeColors, typography } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

interface AudioDurationProps {
  currentTime: number;
  duration: number;
}

const AudioDuration: React.FC<AudioDurationProps> = ({
  currentTime,
  duration,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  return (
    <View style={styles.container}>
      <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
      <Text style={styles.separator}> / </Text>
      <Text style={styles.duration}>{formatTime(duration)}</Text>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentTime: {
    ...typography.textStyles.bodySmall,
    color: colors.primary[600],
  },
  separator: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
  duration: {
    ...typography.textStyles.bodySmall,
    color: colors.text.secondary,
  },
});

export default AudioDuration;