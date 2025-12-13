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
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE0B2',
    500: '#FF9800',
    600: '#FB8C00',
    700: '#F57C00',
    800: '#E65100',
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
  }
} as const;

export const darkColors = {
  // Primary colors - keep brand blue while improving contrast
  primary: {
    50: '#0B223F',
    100: '#0F2C52',
    200: '#143666',
    300: '#19407A',
    400: '#1E4A8E',
    500: '#2A5FB6',
    600: '#3F7AD1',
    700: '#5A93E2',
    800: '#7BACF0',
    900: '#A1C5FA',
  },

  // Secondary colors tuned for dark surfaces
  secondary: {
    50: '#0B1220',
    100: '#101828',
    200: '#111827',
    300: '#1F2937',
    400: '#273549',
    500: '#334155',
    600: '#475569',
    700: '#94A3B8',
    800: '#E2E8F0',
    900: '#F8FAFC',
  },

  // Semantic colors (kept same for consistency)
  success: {
    50: '#102218',
    100: '#1D3A29',
    200: '#275033',
    500: '#4CAF50',
    600: '#68C26C',
    700: '#7DDC82',
  },

  warning: {
    50: '#2D1B00',
    100: '#3A2300',
    200: '#4A2D00',
    500: '#FF9800',
    600: '#FFAD33',
    700: '#FFC166',
    800: '#FFD9A3',
  },

  error: {
    50: '#2C0A0C',
    100: '#3E0E12',
    200: '#4F1217',
    500: '#F44336',
    600: '#F77066',
    700: '#F99B91',
  },

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Gray colors
  gray: {
    50: '#0F172A',
    100: '#1F2937',
    200: '#334155',
    300: '#475569',
    400: '#64748B',
    500: '#94A3B8',
    600: '#CBD5E1',
  },

  // Background colors
  background: {
    primary: '#0F172A',
    secondary: '#213a70',
    tertiary: '#1F2937',
  },

  // Text colors
  text: {
    primary: '#E5E7EB',
    secondary: '#CBD5E1',
    tertiary: '#94A3B8',
    inverse: '#0F172A',
  },

  // Border colors
  border: {
    light: '#1F2937',
    medium: '#334155',
    dark: '#475569',
  },

  social: {
    google: '#4285F4',
    twitter: '#1DA1F2',
    apple: '#FFFFFF',
  }
} as const;

// Default export keeps backward compatibility with existing imports.
export const colors = lightColors;

export type ThemeColors = typeof lightColors;
export type ColorKey = keyof ThemeColors;
export type ColorValue = ThemeColors[ColorKey];
