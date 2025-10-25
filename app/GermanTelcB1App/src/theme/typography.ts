import { Platform } from 'react-native';

export const typography = {
  // Font families
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
      default: 'System',
    }),
  },
  
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    xs: 12,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Text styles
  textStyles: {
    // Headers
    h1: {
      fontSize: 36,
      lineHeight: 44,
      fontWeight: '700' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Bold',
        default: 'System',
      }),
    },
    h2: {
      fontSize: 30,
      lineHeight: 38,
      fontWeight: '700' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Bold',
        default: 'System',
      }),
    },
    h3: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
      }),
    },
    h4: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
      }),
    },

    h5: {
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '600' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
      }),
    },
    
    // Body text
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
    },
    bodyLarge: {
      fontSize: 18,
      lineHeight: 28,
      fontWeight: '400' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
    },
    
    // Labels and captions
    label: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
      }),
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
    },
    
    // Button text
    button: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '600' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
      }),
    },
    buttonLarge: {
      fontSize: 18,
      lineHeight: 28,
      fontWeight: '600' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
      }),
    },
  },
} as const;

export type TypographyKey = keyof typeof typography;
export type TextStyleKey = keyof typeof typography.textStyles;
