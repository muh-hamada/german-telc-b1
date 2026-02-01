import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useAppTheme } from './ThemeContext';
import { spacing, typography } from '../theme';

interface ToastContextType {
  showToast: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const { colors } = useAppTheme();

  const showToast = useCallback((msg: string, duration = 3000) => {
    setMessage(msg);
    setVisible(true);
    
    Animated.sequence([
      Animated.timing(opacity, { 
        toValue: 1, 
        duration: 300, 
        useNativeDriver: true 
      }),
      Animated.delay(duration),
      Animated.timing(opacity, { 
        toValue: 0, 
        duration: 300, 
        useNativeDriver: true 
      }),
    ]).start(() => {
      setVisible(false);
    });
  }, [opacity]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View style={[styles.toastContainer, { opacity }]}>
          <View style={[styles.toast, { backgroundColor: colors.success[500] }]}>
            <Text style={styles.toastText}>{message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    color: '#fff',
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    fontWeight: '500',
  },
});
