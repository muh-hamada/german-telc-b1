import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';

const FontSizeToggle: React.FC = () => {
  const { colors, isBigFont, toggleFontSize } = useAppTheme();

  return (
    <TouchableOpacity
      onPress={toggleFontSize}
      style={[
        styles.button,
        {
          backgroundColor: isBigFont ? colors.primary[100] : 'transparent',
          borderColor: isBigFont ? colors.primary[500] : colors.navigation.text,
        },
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text
        style={[
          styles.label,
          {
            color: isBigFont ? colors.primary[700] : colors.navigation.text,
            fontSize: isBigFont ? 16 : 14,
          },
        ]}
      >
        {isBigFont ? 'AA' : 'Aa'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  label: {
    fontWeight: '700',
  },
});

export default FontSizeToggle;
