import { colors, darkColors, lightColors, type ThemeMode, type ThemeColors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';

export const theme = {
  colors,
  typography,
  spacing,
} as const;

export type Theme = typeof theme;
export type { ThemeMode, ThemeColors };

// Re-export individual theme modules
export { colors, darkColors, lightColors, typography, spacing };
