import { Platform } from 'react-native';

const BIG_FONT_SCALE = 1.35;

const scaleFontSize = (size: number, isBigFont: boolean): number =>
  isBigFont ? Math.round(size * BIG_FONT_SCALE) : size;

const scaleLineHeight = (height: number, isBigFont: boolean): number =>
  isBigFont ? Math.round(height * BIG_FONT_SCALE) : height;

export const createScaledTypography = (isBigFont: boolean) => ({
  fontFamily: typography.fontFamily,
  fontSize: {
    xs: scaleFontSize(12, isBigFont),
    sm: scaleFontSize(14, isBigFont),
    base: scaleFontSize(16, isBigFont),
    lg: scaleFontSize(18, isBigFont),
    xl: scaleFontSize(20, isBigFont),
    '2xl': scaleFontSize(24, isBigFont),
    '3xl': scaleFontSize(30, isBigFont),
    '4xl': scaleFontSize(36, isBigFont),
    '5xl': scaleFontSize(48, isBigFont),
  },
  lineHeight: typography.lineHeight,
  fontWeight: typography.fontWeight,
  textStyles: {
    h1: { ...typography.textStyles.h1, fontSize: scaleFontSize(32, isBigFont), lineHeight: scaleLineHeight(44, isBigFont) },
    h2: { ...typography.textStyles.h2, fontSize: scaleFontSize(28, isBigFont), lineHeight: scaleLineHeight(38, isBigFont) },
    h3: { ...typography.textStyles.h3, fontSize: scaleFontSize(22, isBigFont), lineHeight: scaleLineHeight(32, isBigFont) },
    h4: { ...typography.textStyles.h4, fontSize: scaleFontSize(18, isBigFont), lineHeight: scaleLineHeight(28, isBigFont) },
    h5: { ...typography.textStyles.h5, fontSize: scaleFontSize(16, isBigFont), lineHeight: scaleLineHeight(26, isBigFont) },
    h6: { ...typography.textStyles.h6, fontSize: scaleFontSize(12, isBigFont), lineHeight: scaleLineHeight(18, isBigFont) },
    body: { ...typography.textStyles.body, fontSize: scaleFontSize(14, isBigFont), lineHeight: scaleLineHeight(24, isBigFont) },
    bodyLarge: { ...typography.textStyles.bodyLarge, fontSize: scaleFontSize(16, isBigFont), lineHeight: scaleLineHeight(28, isBigFont) },
    bodySmall: { ...typography.textStyles.bodySmall, fontSize: scaleFontSize(12, isBigFont), lineHeight: scaleLineHeight(20, isBigFont) },
    label: { ...typography.textStyles.label, fontSize: scaleFontSize(12, isBigFont), lineHeight: scaleLineHeight(20, isBigFont) },
    caption: { ...typography.textStyles.caption, fontSize: scaleFontSize(10, isBigFont), lineHeight: scaleLineHeight(16, isBigFont) },
    button: { ...typography.textStyles.button, fontSize: scaleFontSize(14, isBigFont), lineHeight: scaleLineHeight(24, isBigFont) },
    buttonLarge: { ...typography.textStyles.buttonLarge, fontSize: scaleFontSize(16, isBigFont), lineHeight: scaleLineHeight(28, isBigFont) },
    bold: typography.textStyles.bold,
  },
});

export type Typography = ReturnType<typeof createScaledTypography>;

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
      fontSize: 32,
      lineHeight: 44,
      fontWeight: '700' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Bold',
        default: 'System',
      }),
    },
    h2: {
      fontSize: 28,
      lineHeight: 38,
      fontWeight: '700' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Bold',
        default: 'System',
      }),
    },
    h3: {
      fontSize: 22,
      lineHeight: 32,
      fontWeight: '600' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
      }),
    },
    h4: {
      fontSize: 18,
      lineHeight: 28,
      fontWeight: '600' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
      }),
    },

    h5: {
      fontSize: 16,
      lineHeight: 26,
      fontWeight: '600' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
      }),
    },
    h6: {
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '400' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
      }),
    },
    
    // Body text
    body: {
      fontSize: 14,
      lineHeight: 24,
      fontWeight: '400' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
    },
    bodyLarge: {
      fontSize: 16,
      lineHeight: 28,
      fontWeight: '400' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
      }),
    },
    bodySmall: {
      fontSize: 12,
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
      fontSize: 12,
      lineHeight: 20,
      fontWeight: '500' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
      }),
    },
    caption: {
      fontSize: 10,
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
      fontSize: 14,
      lineHeight: 24,
      fontWeight: '600' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
      }),
    },
    buttonLarge: {
      fontSize: 16,
      lineHeight: 28,
      fontWeight: '600' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
      }),
    },
    bold: {
      fontWeight: '700' as const,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto-Bold',
        default: 'System',
      }),
    },
  },
} as const;

export type TypographyKey = keyof typeof typography;
export type TextStyleKey = keyof typeof typography.textStyles;
