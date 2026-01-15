import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import crashlytics from '@react-native-firebase/crashlytics';
import { User, AuthError } from '../services/auth.service';
import AuthService from '../services/auth.service';
import FirestoreService from '../services/firestore.service';
import FCMService from '../services/fcm.service';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import { activeExamConfig } from '../config/active-exam.config';

// Auth Context Types
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  // Actions
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createAccountWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  updateProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
  syncProgressToCloud: () => Promise<void>;
}

// Action Types
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

// Initial State
const initialState: AuthState = {
  user: null,
  isLoading: true, // Start as loading to allow cache check
  isInitialized: false,
  error: null,
};

const USER_STORAGE_KEY = 'user_profile_cache_v1';

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_USER':
      return { ...state, user: action.payload, isLoading: false, error: null };
    
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Create a default context value to prevent "undefined" errors during initialization
const createDefaultContextValue = (): AuthContextType => ({
  user: null,
  isLoading: true,
  isInitialized: false,
  error: null,
  signInWithGoogle: async () => { throw new Error('AuthContext not initialized'); },
  signInWithApple: async () => { throw new Error('AuthContext not initialized'); },
  signInWithTwitter: async () => { throw new Error('AuthContext not initialized'); },
  signInWithEmail: async () => { throw new Error('AuthContext not initialized'); },
  createAccountWithEmail: async () => { throw new Error('AuthContext not initialized'); },
  signOut: async () => { throw new Error('AuthContext not initialized'); },
  sendPasswordResetEmail: async () => { throw new Error('AuthContext not initialized'); },
  updateProfile: async () => { throw new Error('AuthContext not initialized'); },
  deleteAccount: async () => { throw new Error('AuthContext not initialized'); },
  clearError: () => { throw new Error('AuthContext not initialized'); },
  syncProgressToCloud: async () => { throw new Error('AuthContext not initialized'); },
});

// Context with a default value to prevent initialization errors
export const AuthContext = createContext<AuthContextType>(createDefaultContextValue());

// Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load cached user on mount
  useEffect(() => {
    const loadCachedUser = async () => {
      try {
        const cachedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (cachedUser) {
          const user = JSON.parse(cachedUser);
          console.log('[AuthContext] Loaded cached user:', user.uid);
          dispatch({ type: 'SET_USER', payload: user });
          // Don't set initialized yet, waiting for firebase auth to confirm
        }
      } catch (error) {
        console.error('[AuthContext] Error loading cached user:', error);
      }
    };
    loadCachedUser();
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (user) => {
      console.log('[AuthContext] Auth state changed:', user ? `User ${user.uid}` : 'No user');
      
      if (user) {
        // Update Crashlytics user info
        crashlytics().setUserId(user.uid);
        crashlytics().setAttributes({
          email: user.email || 'anonymous',
          displayName: user.displayName || 'none',
          provider: user.provider,
        });

        // Update cache
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)).catch(e => 
          console.error('[AuthContext] Error caching user:', e)
        );

        try {
          // Create or update user profile in Firestore
          await FirestoreService.createUserProfile(user);
          
          // Check if user has notifications enabled and register FCM token
          const userSettings = await FirestoreService.getUserSettings(user.uid);
          if (userSettings?.notificationSettings?.enabled) {
            try {
              await FCMService.initialize(user.uid);
              console.log('[AuthContext] FCM token registered for user');
            } catch (fcmError) {
              console.error('[AuthContext] Error registering FCM token:', fcmError);
              // Don't block auth flow if FCM fails
            }
          }
          
          // Ensure old users have appId (migration for existing users)
          if (!userSettings?.appId) {
            console.log('[AuthContext] Migrating user: adding missing appId');
            await FirestoreService.updateUserProfile(user.uid, { 
              appId: activeExamConfig.id
            });
          }
        } catch (error) {
          console.error('[AuthContext] Error creating user profile:', error);
        }
      } else {
        // Clear Crashlytics user info
        crashlytics().setUserId('');
        // Clear cache if no user (and we are sure it's not just a temp loading state)
        // But be careful: onAuthStateChanged calls with null on init sometimes?
        // Actually, it calls with null if not logged in.
        // So we should clear cache here to be safe, BUT what if we are offline?
        // If offline, onAuthStateChanged might behave differently.
        // For now, let's assume if Firebase says null, it means null.
        // WE DO NOT clear cache here immediately if we want offline support?
        // If we are offline, Firebase Auth might still provide the user from its own cache.
        // So if user is null here, it really means logged out.
        // AsyncStorage.removeItem(USER_STORAGE_KEY); 
      }
      
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    });

    return unsubscribe;
  }, []);

  const handleAuthError = (error: AuthError) => {
    // Don't set error state for user cancellations
    if (error.code !== 'auth/cancelled') {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
    throw error;
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      logEvent(AnalyticsEvents.AUTH_LOGIN_OPENED, { method: 'google' });
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const user = await AuthService.signInWithGoogle();
      dispatch({ type: 'SET_USER', payload: user });
      logEvent(AnalyticsEvents.AUTH_LOGIN_SUCCESS, { method: 'google' });
    } catch (error: any) {
      logEvent(AnalyticsEvents.PROFILE_LOGIN_FAILED, { 
        method: 'google',
        error_code: error?.code || 'unknown',
        error_message: error?.message || 'Unknown error'
      });
      handleAuthError(error);
    }
  };

  const signInWithApple = async (): Promise<void> => {
    try {
      logEvent(AnalyticsEvents.AUTH_LOGIN_OPENED, { method: 'apple' });
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const user = await AuthService.signInWithApple();
      
      // Update Firestore profile with the correct displayName
      // (onAuthStateChanged may have created profile before displayName was set from Apple)
      await FirestoreService.createUserProfile(user);
      
      dispatch({ type: 'SET_USER', payload: user });
      logEvent(AnalyticsEvents.AUTH_LOGIN_SUCCESS, { method: 'apple' });
    } catch (error: any) {
      logEvent(AnalyticsEvents.PROFILE_LOGIN_FAILED, { 
        method: 'apple',
        error_code: error?.code || 'unknown',
        error_message: error?.message || 'Unknown error'
      });
      handleAuthError(error);
    }
  };

  const signInWithTwitter = async (): Promise<void> => {
    try {
      logEvent(AnalyticsEvents.AUTH_LOGIN_OPENED, { method: 'twitter' });
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const user = await AuthService.signInWithTwitter();
      dispatch({ type: 'SET_USER', payload: user });
      logEvent(AnalyticsEvents.AUTH_LOGIN_SUCCESS, { method: 'twitter' });
    } catch (error: any) {
      logEvent(AnalyticsEvents.PROFILE_LOGIN_FAILED, { 
        method: 'twitter',
        error_code: error?.code || 'unknown',
        error_message: error?.message || 'Unknown error'
      });
      handleAuthError(error);
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      logEvent(AnalyticsEvents.AUTH_LOGIN_OPENED, { method: 'email' });
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const user = await AuthService.signInWithEmail(email, password);
      dispatch({ type: 'SET_USER', payload: user });
      logEvent(AnalyticsEvents.AUTH_LOGIN_SUCCESS, { method: 'email' });
    } catch (error: any) {
      logEvent(AnalyticsEvents.PROFILE_LOGIN_FAILED, { 
        method: 'email',
        error_code: error?.code || 'unknown',
        error_message: error?.message || 'Unknown error'
      });
      handleAuthError(error);
    }
  };

  const createAccountWithEmail = async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<void> => {
    try {
      logEvent(AnalyticsEvents.AUTH_LOGIN_OPENED, { method: 'email_signup' });
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const user = await AuthService.createAccountWithEmail(email, password, displayName);
      
      // Update Firestore profile with the correct displayName
      // (onAuthStateChanged may have created profile before displayName was set)
      await FirestoreService.createUserProfile(user);
      
      dispatch({ type: 'SET_USER', payload: user });
      logEvent(AnalyticsEvents.AUTH_LOGIN_SUCCESS, { method: 'email_signup' });
    } catch (error: any) {
      logEvent(AnalyticsEvents.PROFILE_LOGIN_FAILED, { 
        method: 'email_signup',
        error_code: error?.code || 'unknown',
        error_message: error?.message || 'Unknown error'
      });
      handleAuthError(error);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log('[AuthContext] Starting sign out...');
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      await AuthService.signOut();
      
      console.log('[AuthContext] Sign out successful, clearing user state');
      
      // Clear cache
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      
      // Update state to null after successful signout
      dispatch({ type: 'SET_USER', payload: null });
      logEvent(AnalyticsEvents.AUTH_LOGOUT);
    } catch (error: any) {
      console.error('[AuthContext] Error during sign out:', error);
      handleAuthError(error);
      // Even if there's an error, clear the user state to allow retry
      dispatch({ type: 'SET_USER', payload: null });
      // Re-throw the error so the UI can handle it
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      console.log('[AuthContext] Sign out process completed');
    }
  };

  const sendPasswordResetEmail = async (email: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      await AuthService.sendPasswordResetEmail(email);
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const updateProfile = async (updates: { displayName?: string; photoURL?: string }): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      await AuthService.updateProfile(updates);
      
      // Update local user state
      const updatedUser = AuthService.getCurrentUser();
      if (updatedUser) {
        dispatch({ type: 'SET_USER', payload: updatedUser });
      }
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const deleteAccount = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      if (state.user) {
        // Delete user data from Firestore
        await FirestoreService.deleteUserData(state.user.uid);
      }
      
      // Delete Firebase account
      await AuthService.deleteAccount();
      dispatch({ type: 'SET_USER', payload: null });
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const syncProgressToCloud = async (): Promise<void> => {
    if (!state.user) return;
    
    try {
      // This would sync local progress to cloud
      // Implementation depends on your progress context
      console.log('Syncing progress to cloud for user:', state.user.uid);
    } catch (error) {
      console.error('Error syncing progress to cloud:', error);
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    signInWithGoogle,
    signInWithApple,
    signInWithTwitter,
    signInWithEmail,
    createAccountWithEmail,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    deleteAccount,
    clearError,
    syncProgressToCloud,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  // Context always has a value now (no need to check for undefined)
  return context;
};

// Utility hooks
export const useUser = (): User | null => {
  const { user } = useAuth();
  return user;
};

export const useIsAuthenticated = (): boolean => {
  const { user } = useAuth();
  return user !== null;
};
