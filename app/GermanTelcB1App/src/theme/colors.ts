export type ThemeMode = 'light' | 'dark';

export const lightColors = {
  // Primary colors - Professional blue theme
  primary: {
    50: '#E6F0FF',
    100: '#CCE1FF',
    200: '#99C3FF',
    300: '#66A5FF',
    400: '#3387FF',
    500: '#0077B6', // Main primary color
    600: '#005F92',
    700: '#00476E',
    800: '#002F4A',
    900: '#001726',
  },
  
  // Secondary colors - Complementary grays
  secondary: {
    50: '#F8F9FA',
    100: '#F1F3F4',
    200: '#E8EAED',
    300: '#DADCE0',
    400: '#BDC1C6',
    500: '#9AA0A6',
    600: '#80868B',
    700: '#5F6368',
    800: '#3C4043',
    900: '#202124',
  },
  
  // Semantic colors
  success: {
    50: '#E8F5E8',
    100: '#C8E6C9',
    200: '#A5D6A7',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
  },
  
  warning: {
    50: '#FFFBF0',
    100: '#FFF4DC',
    200: '#FFEBC1',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
  },
  
  error: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    500: '#F44336',
    600: '#E53935',
    700: '#D32F2F',
  },
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // Gray colors
  gray: {
    50: '#F5F5F5',
    100: '#E0E0E0',
    200: '#BDBDBD',
    300: '#9E9E9E',
    400: '#757575',
    500: '#616161',
    600: '#424242',
  },

  // Background colors
  background: {
    primary: '#F5F5F5',
    secondary: '#FFFFFF',
    tertiary: '#F8F9FA',
  },
  
  // Text colors
  text: {
    primary: '#212121',
    secondary: '#757575',
    tertiary: '#9E9E9E',
    inverse: '#FFFFFF',
  },
  
  // Border colors
  border: {
    light: '#E0E0E0',
    medium: '#BDBDBD',
    dark: '#757575',
  },

  social: {
    google: '#4285F4',
    twitter: '#1DA1F2',
    apple: '#FFFFFF',
  },

  // Gradient colors for animated borders
  gradients: {
    premium: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#667eea'],
    premiumBadge: ['#F59E0B', '#FBBF24', '#FCD34D', '#FF6A00', '#FCD34D', '#FBBF24', '#F59E0B'],
  }
} as const;

export const darkColors = {
  // Primary colors - GitHub-style blue accents
  primary: {
    50: '#0d1117',
    100: '#161b22',
    200: '#1f3a5f',
    300: '#2d4a7c',
    400: '#3b5998',
    500: '#58a6ff',
    600: '#79c0ff',
    700: '#a5d6ff',
    800: '#cae8ff',
    900: '#e6f4ff',
  },

  // Secondary colors - GitHub dark surfaces
  secondary: {
    50: '#0d1117',
    100: '#161b22',
    200: '#21262d',
    300: '#30363d',
    400: '#484f58',
    500: '#6e7681',
    600: '#8b949e',
    700: '#c9d1d9',
    800: '#e6edf3',
    900: '#f0f6fc',
  },

  // Semantic colors - GitHub style
  success: {
    50: '#0d1117',
    100: '#0f2d1c',
    200: '#1a4731',
    500: '#238636',
    600: '#2ea043',
    700: '#3fb950',
  },

  warning: {
    50: '#0d1117',
    100: '#2d1b00',
    200: '#3a2300',
    500: '#d29922',
    600: '#e3b341',
    700: '#f0c75e',
    800: '#ffd33d',
  },

  error: {
    50: '#0d1117',
    100: '#2d0f0f',
    200: '#4a1616',
    500: '#f85149',
    600: '#ff6b6b',
    700: '#ff8585',
  },

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Gray colors - GitHub dark palette
  gray: {
    50: '#0d1117',
    100: '#161b22',
    200: '#21262d',
    300: '#30363d',
    400: '#484f58',
    500: '#6e7681',
    600: '#8b949e',
  },

  // Background colors - GitHub dark theme
  background: {
    primary: '#0d1117',
    secondary: '#161b22',
    tertiary: '#21262d',
  },

  // Text colors - GitHub dark theme
  text: {
    primary: '#e6edf3',
    secondary: '#8b949e',
    tertiary: '#6e7681',
    inverse: '#0d1117',
  },

  // Border colors - GitHub dark theme
  border: {
    light: '#21262d',
    medium: '#30363d',
    dark: '#484f58',
  },

  social: {
    google: '#4285F4',
    twitter: '#1DA1F2',
    apple: '#FFFFFF',
  },

  // Gradient colors for animated borders - Dark theme versions
  gradients: {
    premium: ['#3b4a8c', '#4a2f7a', '#7a3291', '#2b5a99', '#0c6b7d', '#0d7a5a', '#3b4a8c'],
    premiumBadge: ['#a67c00', '#b8860b', '#c9932f', '#b8651d', '#c9932f', '#b8860b', '#a67c00'],
  }
} as const;

// Default export keeps backward compatibility with existing imports.
export const colors = lightColors;

export type ThemeColors = typeof lightColors;
export type ColorKey = keyof ThemeColors;
export type ColorValue = ThemeColors[ColorKey];
