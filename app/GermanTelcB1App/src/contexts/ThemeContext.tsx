import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, type ThemeColors, type ThemeMode } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const THEME_STORAGE_KEY = 'app_theme';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  typography: typeof typography;
  setTheme: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedMode === 'light' || storedMode === 'dark') {
          setMode(storedMode);
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

  const value = useMemo<ThemeContextValue>(() => {
    const currentColors = mode === 'light' ? lightColors : darkColors;

    return {
      mode,
      colors: currentColors,
      spacing,
      typography,
      setTheme: persistTheme,
      toggleTheme,
      isLoading,
    };
  }, [isLoading, mode, persistTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }

  return context;
};

