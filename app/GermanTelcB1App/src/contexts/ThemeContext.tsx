import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, type ThemeColors, type ThemeMode } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography, createScaledTypography, type Typography } from '../theme/typography';
import { FORCE_DARK_MODE } from '../config/development.config';
import { activeExamConfig } from '../config/active-exam.config';

const THEME_STORAGE_KEY = 'app_theme';
const FONT_SIZE_STORAGE_KEY = 'font_size_big';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  typography: Typography;
  isBigFont: boolean;
  toggleFontSize: () => Promise<void>;
  setTheme: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [isBigFont, setIsBigFont] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      if (FORCE_DARK_MODE) {
        setMode('dark');
      }
      try {
        const storedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedMode === 'light' || storedMode === 'dark') {
          if (!FORCE_DARK_MODE) {
            setMode(storedMode);
          }
        }
        const storedBigFont = await AsyncStorage.getItem(FONT_SIZE_STORAGE_KEY);
        if (storedBigFont === 'true') {
          setIsBigFont(true);
        }
      } catch (error) {
        console.warn('[ThemeProvider] Failed to load theme', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  const persistTheme = useCallback(async (nextMode: ThemeMode) => {
    setMode(nextMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
    } catch (error) {
      console.warn('[ThemeProvider] Failed to save theme', error);
    }
  }, []);

  const toggleTheme = useCallback(async () => {
    const nextMode = mode === 'light' ? 'dark' : 'light';
    await persistTheme(nextMode);
  }, [mode, persistTheme]);

  const toggleFontSize = useCallback(async () => {
    const next = !isBigFont;
    setIsBigFont(next);
    try {
      await AsyncStorage.setItem(FONT_SIZE_STORAGE_KEY, next ? 'true' : 'false');
    } catch (error) {
      console.warn('[ThemeProvider] Failed to save font size', error);
    }
  }, [isBigFont]);

  const value = useMemo<ThemeContextValue>(() => {
    // Get the theme colors based on the active exam's theme configuration
    const themeName = activeExamConfig.theme;
    const themeColors = themes[themeName];
    const currentColors = mode === 'light' ? themeColors.light : themeColors.dark;
    const scaledTypography = createScaledTypography(isBigFont);

    return {
      mode,
      colors: currentColors,
      spacing,
      typography: scaledTypography,
      isBigFont,
      toggleFontSize,
      setTheme: persistTheme,
      toggleTheme,
      isLoading,
    };
  }, [isLoading, isBigFont, mode, persistTheme, toggleFontSize, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }

  return context;
};

