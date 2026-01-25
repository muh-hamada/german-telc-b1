import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
} from 'react-native';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';

interface CardsListSeperatorProps {
  title: string
}

const CardsListSeperator: React.FC<CardsListSeperatorProps> = ({ title }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.separatorContainer}>
      <View style={styles.separator}>
        <View style={styles.separatorTextContainer}>
          <Text style={styles.separatorText}>{title}</Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    separatorContainer: {
      marginBottom: spacing.margin.lg,
      position: 'relative',
    },
    separator: {
      height: 1,
      width: '100%',
      backgroundColor: colors.border.light,
    },
    separatorTextContainer: {
      position: 'absolute',
      width: '100%',
      left: 0,
      zIndex: 1000,
      top: -10,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    separatorText: {
      ...typography.textStyles.h6,
      color: colors.text.secondary,
      textTransform: 'uppercase',
      backgroundColor: colors.background.primary,
      paddingHorizontal: spacing.padding.md,
    },
  });

export default CardsListSeperator;
