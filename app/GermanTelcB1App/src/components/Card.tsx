import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { spacing, type ThemeColors } from '../theme';
import { useAppTheme } from '../contexts/ThemeContext';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  ...props
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const cardStyle = [
    styles.base,
    styles[variant],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      backgroundColor: colors.background.secondary,
      borderRadius: spacing.borderRadius.lg,
      padding: spacing.padding.lg,
    },
    
    default: {
      ...spacing.shadow.sm,
    },
    
    elevated: {
      ...spacing.shadow.lg,
    },
    
    outlined: {
      borderWidth: 1,
      borderColor: colors.border.light,
    },
  });

export default Card;
