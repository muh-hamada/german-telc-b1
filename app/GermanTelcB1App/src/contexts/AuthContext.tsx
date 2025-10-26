import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthError } from '../services/auth.service';
import AuthService from '../services/auth.service';
import FirestoreService from '../services/firestore.service';

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
  signInWithFacebook: () => Promise<void>;
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
  isLoading: false,
  isInitialized: false,
  error: null,
};

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

// Context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (user) => {
      console.log('[AuthContext] Auth state changed:', user ? `User ${user.uid}` : 'No user');
      if (user) {
        try {
          // Create or update user profile in Firestore
          await FirestoreService.createUserProfile(user);
        } catch (error) {
          console.error('[AuthContext] Error creating user profile:', error);
        }
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
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const user = await AuthService.signInWithGoogle();
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const signInWithFacebook = async (): Promise<void> => {
    console.log('signInWithFacebook');
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const user = await AuthService.signInWithFacebook();
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error: any) {
      console.log('error', error);
      handleAuthError(error);
    }
  };

  const signInWithApple = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const user = await AuthService.signInWithApple();
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const signInWithTwitter = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const user = await AuthService.signInWithTwitter();
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const user = await AuthService.signInWithEmail(email, password);
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const createAccountWithEmail = async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const user = await AuthService.createAccountWithEmail(email, password, displayName);
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error: any) {
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
      // Update state to null after successful signout
      dispatch({ type: 'SET_USER', payload: null });
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
    signInWithFacebook,
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
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
