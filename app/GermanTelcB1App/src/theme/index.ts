import { colors, darkColors, lightColors, type ThemeMode, type ThemeColors } from './colors';
import { typography, createScaledTypography, type Typography } from './typography';
import { spacing } from './spacing';

export const theme = {
  colors,
  typography,
  spacing,
} as const;

export type Theme = typeof theme;
export type { ThemeMode, ThemeColors, Typography };

// Re-export individual theme modules
export { colors, darkColors, lightColors, typography, createScaledTypography, spacing };
