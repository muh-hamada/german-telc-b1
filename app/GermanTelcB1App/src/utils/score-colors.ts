import { ThemeColors } from '../theme';

/**
 * Get the color for a score based on its percentage
 * @param score - The score achieved
 * @param max - The maximum possible score
 * @param colors - The theme colors object
 * @returns The color for the score (background and text colors)
 */
export const getScoreColor = (score: number, max: number, colors: ThemeColors) => {
  const percentage = (score / max) * 100;
  if (percentage >= 80) return colors.success[500];
  if (percentage >= 60) return colors.warning[500];
  return colors.error[500];
};

/**
 * Get the background and text colors for a score badge
 * @param score - The score achieved
 * @param max - The maximum possible score
 * @param colors - The theme colors object
 * @returns Object with backgroundColor and textColor
 */
export const getScoreBadgeColors = (score: number, max: number, colors: ThemeColors) => {
  const percentage = (score / max) * 100;
  
  if (percentage >= 80) {
    return {
      backgroundColor: colors.success[50],
      textColor: colors.success[700],
      borderColor: colors.success[500],
    };
  }
  
  if (percentage >= 60) {
    return {
      backgroundColor: colors.warning[50],
      textColor: colors.warning[700],
      borderColor: colors.warning[500],
    };
  }
  
  return {
    backgroundColor: colors.error[50],
    textColor: colors.error[700],
    borderColor: colors.error[500],
  };
};

