import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { spacing, typography, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingStepContentProps {
  title: string;
  text: string;
  imageUrl?: string;
}

const OnboardingStepContent: React.FC<OnboardingStepContentProps> = ({
  title,
  text,
  imageUrl,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="contain"
        />
      )}
      
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.padding.xl,
    },
    title: {
      ...typography.textStyles.h1,
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: spacing.margin.md,
    },
    image: {
      width: SCREEN_WIDTH * 0.7,
      height: SCREEN_WIDTH * 0.7,
      marginBottom: spacing.margin.xl,
    },
    text: {
      fontSize: 17,
      color: colors.text.primary,
      textAlign: 'center',
      lineHeight: 26,
      marginBottom: spacing.margin.md,
      paddingHorizontal: spacing.padding.md,
    },
  });

export default OnboardingStepContent;

