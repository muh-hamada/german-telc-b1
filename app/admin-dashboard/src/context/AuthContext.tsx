import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { firebaseService } from '../services/firebase.service';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const ALLOWED_ADMIN_EMAIL = 'mohamedarefali@gmail.com';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = firebaseService.getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[AuthProvider] onAuthStateChanged', user);
      if (user && user.email?.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
        await signOut(auth);
        setCurrentUser(null);
      } else {
        setCurrentUser(user);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  const login = async (email: string, password: string) => {
    if (email.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
      throw new Error('Access denied. This admin is restricted to authorized users only.');
    }
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      if (user.email?.toLowerCase() !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
        await signOut(auth);
        throw new Error('Access denied. This admin is restricted to authorized users only.');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to login');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to logout');
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

