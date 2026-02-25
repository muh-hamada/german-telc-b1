export type ThemeMode = 'light' | 'dark';
export type ThemeName = 'default' | 'alarm' | 'audiobook';

export const defaultLightColors = {
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
  gold: '#fbbf24',
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

  // Navigation colors
  navigation: {
    background: '#0077B6', // Primary 500
    text: '#FFFFFF',
  },

  // Action/Button colors
  action: {
    primary: '#4CAF50', // Green for primary actions (keep current for default theme)
    primaryText: '#FFFFFF',
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

export const defaultDarkColors = {
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

  // Navigation colors - Dark theme
  navigation: {
    background: '#1f3a5f', // Darker blue for dark mode
    text: '#e6edf3',
  },

  // Action/Button colors - Dark theme
  action: {
    primary: '#3fb950', // Brighter green for dark mode
    primaryText: '#0d1117',
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

export const alarmLightColors = {
  // Primary colors - Purple theme from alarm design
  primary: {
    50: '#F5F0F5',
    100: '#EBE1EB',
    200: '#D7C3D7',
    300: '#C3A5C3',
    400: '#8B668B',
    500: '#432344', // Main dark purple
    600: '#361B36',
    700: '#2A142A',
    800: '#1D0D1D',
    900: '#1A0E1A',
  },
  
  // Secondary colors - Yellow/Gold theme
  secondary: {
    50: '#FFFBF0',
    100: '#FFF4DC',
    200: '#FFE9B8',
    300: '#FFDE94',
    400: '#FFD370',
    500: '#FFC03D', // Main golden yellow
    600: '#E6A823',
    700: '#CC9419',
    800: '#B3800F',
    900: '#996C05',
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
    50: '#FFF0F0',
    100: '#FFDFDF',
    200: '#FFB3B3',
    500: '#FF2525', // Bright red from design
    600: '#E61F1F',
    700: '#CC1A1A',
  },
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gold: '#FFC03D',
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
    primary: '#E7EEFB', // Light lavender blue from design
    secondary: '#FFFFFF',
    tertiary: '#F5F8FF',
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

  // Navigation colors
  navigation: {
    background: '#432344', // Dark purple from design
    text: '#FFFFFF',
  },

  // Action/Button colors
  action: {
    primary: '#FFC03D', // Yellow from alarm design
    primaryText: '#432344', // Dark purple text on yellow
  },

  social: {
    google: '#4285F4',
    twitter: '#1DA1F2',
    apple: '#FFFFFF',
  },

  // Gradient colors for animated borders
  gradients: {
    premium: ['#432344', '#8B668B', '#FFC03D', '#FFD370', '#432344'],
    premiumBadge: ['#FFC03D', '#FFD370', '#FFDE94', '#FFC03D'],
  }
} as const;

export const alarmDarkColors = {
  // Primary colors - Dark purple theme
  primary: {
    50: '#1A0E1A',
    100: '#2A142A',
    200: '#361B36',
    300: '#432344',
    400: '#5A3A5A',
    500: '#8B668B', // Lighter purple for dark mode
    600: '#A087A0',
    700: '#B8A5B8',
    800: '#D0C3D0',
    900: '#E8E1E8',
  },

  // Secondary colors - Adjusted yellow for dark mode
  secondary: {
    50: '#1A1305',
    100: '#2A200A',
    200: '#3A2D0F',
    300: '#4A3A14',
    400: '#7A6023',
    500: '#B8860B', // Darker gold for dark mode
    600: '#CC9419',
    700: '#E6A823',
    800: '#FFC03D',
    900: '#FFD370',
  },

  // Semantic colors - Dark mode versions
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
    50: '#1A0505',
    100: '#2D0A0A',
    200: '#4A1414',
    500: '#E61F1F', // Muted red for dark mode
    600: '#FF4444',
    700: '#FF6666',
  },

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Gray colors - Dark palette
  gray: {
    50: '#0d1117',
    100: '#161b22',
    200: '#21262d',
    300: '#30363d',
    400: '#484f58',
    500: '#6e7681',
    600: '#8b949e',
  },

  // Background colors - Dark theme
  background: {
    primary: '#1A0E1A', // Dark purple background
    secondary: '#2A142A',
    tertiary: '#361B36',
  },

  // Text colors - Dark theme
  text: {
    primary: '#e6edf3',
    secondary: '#8b949e',
    tertiary: '#6e7681',
    inverse: '#1A0E1A',
  },

  // Border colors - Dark theme
  border: {
    light: '#2A142A',
    medium: '#361B36',
    dark: '#432344',
  },

  // Navigation colors - Dark theme
  navigation: {
    background: '#2A142A', // Darker purple for dark mode nav
    text: '#e6edf3',
  },

  // Action/Button colors - Dark theme
  action: {
    primary: '#FFD370', // Lighter yellow for dark mode
    primaryText: '#2A142A', // Dark purple text
  },

  social: {
    google: '#4285F4',
    twitter: '#1DA1F2',
    apple: '#FFFFFF',
  },

  // Gradient colors for animated borders - Dark theme versions
  gradients: {
    premium: ['#2A142A', '#5A3A5A', '#B8860B', '#CC9419', '#2A142A'],
    premiumBadge: ['#B8860B', '#CC9419', '#E6A823', '#B8860B'],
  }
} as const;

export const audiobookLightColors = {
  // Primary colors - Navy/Purple theme from audiobook design
  primary: {
    50: '#F5F3F7',
    100: '#EBE7EF',
    200: '#D7CFE0',
    300: '#C3B7D0',
    400: '#8777A3',
    500: '#3A3967', // Main navy purple
    600: '#2E2D52',
    700: '#23223E',
    800: '#171629',
    900: '#0C0B15',
  },
  
  // Secondary colors - Pink theme
  secondary: {
    50: '#FFFBFD',
    100: '#FFF7FA',
    200: '#FFEEF5',
    300: '#FFE5F0',
    400: '#FED7E5',
    500: '#FDCEDF', // Main pink
    600: '#FCA5C5',
    700: '#FB7CAB',
    800: '#FA5391',
    900: '#F92A77',
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
    50: '#FFF9F0',
    100: '#FFF3E0',
    200: '#FFEDC1',
    500: '#FBAE75', // Orange from design
    600: '#FA9A56',
    700: '#F98637',
    800: '#F87218',
  },
  
  error: {
    50: '#FFF0F0',
    100: '#FFDFDF',
    200: '#FFB3B3',
    500: '#F44336',
    600: '#E53935',
    700: '#D32F2F',
  },
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gold: '#FBAE75',
  transparent: 'transparent',
  
  // Gray colors
  gray: {
    50: '#F5EFF1', // Light gray from design
    100: '#E8E0E3',
    200: '#D1C1C7',
    300: '#BAA2AB',
    400: '#8B6473',
    500: '#6E4F5B',
    600: '#573F49',
  },

  // Background colors
  background: {
    primary: '#F5EFF1', // Light gray from design
    secondary: '#FFFFFF',
    tertiary: '#FDFBFC',
  },
  
  // Text colors
  text: {
    primary: '#3A3967', // Navy purple
    secondary: '#6E4F5B',
    tertiary: '#8B6473',
    inverse: '#FFFFFF',
  },
  
  // Border colors
  border: {
    light: '#E8E0E3',
    medium: '#D1C1C7',
    dark: '#BAA2AB',
  },

  // Navigation colors
  navigation: {
    background: '#3A3967', // Navy purple from design
    text: '#FFFFFF',
  },

  // Action/Button colors
  action: {
    primary: '#4CAF50', // Green for audiobook theme
    primaryText: '#FFFFFF',
  },

  social: {
    google: '#4285F4',
    twitter: '#1DA1F2',
    apple: '#FFFFFF',
  },

  // Gradient colors for animated borders
  gradients: {
    premium: ['#3A3967', '#8777A3', '#FDCEDF', '#FBAE75', '#3A3967'],
    premiumBadge: ['#FBAE75', '#FA9A56', '#FED7E5', '#FBAE75'],
  }
} as const;

export const audiobookDarkColors = {
  // Primary colors - Dark navy/purple theme
  primary: {
    50: '#0C0B15',
    100: '#171629',
    200: '#23223E',
    300: '#2E2D52',
    400: '#3A3967',
    500: '#8777A3', // Lighter purple for dark mode
    600: '#A593BA',
    700: '#C3B7D0',
    800: '#D7CFE0',
    900: '#EBE7EF',
  },

  // Secondary colors - Muted pink for dark mode
  secondary: {
    50: '#2D0A1F',
    100: '#3D1429',
    200: '#5D2140',
    300: '#7D2E57',
    400: '#9D3B6E',
    500: '#D47BA5', // Muted pink for dark mode
    600: '#E09ABB',
    700: '#ECB9D1',
    800: '#F7D8E7',
    900: '#FFF7FA',
  },

  // Semantic colors - Dark mode versions
  success: {
    50: '#0d1117',
    100: '#0f2d1c',
    200: '#1a4731',
    500: '#238636',
    600: '#2ea043',
    700: '#3fb950',
  },

  warning: {
    50: '#1A0F05',
    100: '#2D1A0A',
    200: '#5D3414',
    500: '#D98A4F', // Muted orange for dark mode
    600: '#E5A56A',
    700: '#F0C085',
    800: '#FBAE75',
  },

  error: {
    50: '#1A0505',
    100: '#2D0A0A',
    200: '#4A1414',
    500: '#E61F1F',
    600: '#FF4444',
    700: '#FF6666',
  },

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Gray colors - Dark palette
  gray: {
    50: '#0C0B15',
    100: '#171629',
    200: '#23223E',
    300: '#3A3967',
    400: '#6E4F5B',
    500: '#8B6473',
    600: '#BAA2AB',
  },

  // Background colors - Dark theme
  background: {
    primary: '#0C0B15', // Dark navy background
    secondary: '#171629',
    tertiary: '#23223E',
  },

  // Text colors - Dark theme
  text: {
    primary: '#EBE7EF',
    secondary: '#BAA2AB',
    tertiary: '#8B6473',
    inverse: '#0C0B15',
  },

  // Border colors - Dark theme
  border: {
    light: '#171629',
    medium: '#23223E',
    dark: '#3A3967',
  },

  // Navigation colors - Dark theme
  navigation: {
    background: '#171629', // Darker navy for dark mode nav
    text: '#EBE7EF',
  },

  // Action/Button colors - Dark theme
  action: {
    primary: '#3fb950', // Brighter green for dark mode
    primaryText: '#0C0B15',
  },

  social: {
    google: '#4285F4',
    twitter: '#1DA1F2',
    apple: '#FFFFFF',
  },

  // Gradient colors for animated borders - Dark theme versions
  gradients: {
    premium: ['#171629', '#3A3967', '#D47BA5', '#D98A4F', '#171629'],
    premiumBadge: ['#D98A4F', '#E5A56A', '#E09ABB', '#D98A4F'],
  }
} as const;

// Theme registry
export const themes = {
  default: {
    light: defaultLightColors,
    dark: defaultDarkColors,
  },
  alarm: {
    light: alarmLightColors,
    dark: alarmDarkColors,
  },
  audiobook: {
    light: audiobookLightColors,
    dark: audiobookDarkColors,
  },
} as const;

// Backward compatibility - keep existing exports
export const lightColors = defaultLightColors;
export const darkColors = defaultDarkColors;

// Default export keeps backward compatibility with existing imports.
export const colors = defaultLightColors;

export type ThemeColors = typeof defaultLightColors;
export type ColorKey = keyof ThemeColors;
export type ColorValue = ThemeColors[ColorKey];
