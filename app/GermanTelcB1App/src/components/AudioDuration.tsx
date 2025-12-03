import React from 'react';
import {
  View,
  StyleSheet,
  Text,
} from 'react-native';
import { colors, typography } from '../theme';

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
  return (
    <View style={styles.container}>
      <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
      <Text style={styles.separator}> / </Text>
      <Text style={styles.duration}>{formatTime(duration)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
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