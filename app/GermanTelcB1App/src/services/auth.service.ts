import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { firebaseConfig, googleSignInConfig, facebookConfig } from '../config/firebase.config';

// User types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: 'google' | 'facebook' | 'apple' | 'twitter' | 'email';
  createdAt: Date;
  lastLoginAt: Date;
}

export interface AuthError {
  code: string;
  message: string;
}

class AuthService {
  private initialized = false;

  // Initialize authentication services
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId: googleSignInConfig.webClientId,
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize auth services:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    const user = auth().currentUser;
    if (!user) return null;

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      provider: this.getProviderFromUser(user),
      createdAt: new Date(user.metadata.creationTime || ''),
      lastLoginAt: new Date(user.metadata.lastSignInTime || ''),
    };
  }

  // Get provider from Firebase user
  private getProviderFromUser(user: FirebaseAuthTypes.User): User['provider'] {
    const providerData = user.providerData[0];
    if (!providerData) return 'email';

    switch (providerData.providerId) {
      case 'google.com':
        return 'google';
      case 'facebook.com':
        return 'facebook';
      case 'apple.com':
        return 'apple';
      case 'twitter.com':
        return 'twitter';
      default:
        return 'email';
    }
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<User> {
    try {
      await this.initialize();

      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      console.log('GoogleSignin.signIn()', GoogleSignin.signIn());

      // Get the users ID token
      const tokens = await GoogleSignin.getTokens();

      console.log('tokens', tokens);

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(tokens.idToken);

      console.log('googleCredential', googleCredential);

      // Sign-in the user with the credential
      const userCredential = await auth().signInWithCredential(googleCredential);

      console.log('userCredential', userCredential);

      return this.getCurrentUser()!;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Sign in with Facebook
  async signInWithFacebook(): Promise<User> {
    try {
      console.log('signInWithFacebook step 1');
      
      // Check if Facebook is properly configured
      if (!facebookConfig.appId || facebookConfig.appId === 'YOUR_FACEBOOK_APP_ID') {
        throw {
          code: 'auth/not-configured',
          message: 'Facebook Sign-In is not configured yet. Please follow the setup guide in FACEBOOK_SETUP.md or use Google/Email sign-in instead.',
        };
      }
      
      await this.initialize();

      // Attempt login with permissions
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

      console.log('signInWithFacebook step 2', result);

      if (result.isCancelled) {
        throw new Error('User cancelled the login process');
      }


      console.log('signInWithFacebook step 3');

      // Once signed in, get the users AccessToken
      const data = await AccessToken.getCurrentAccessToken();


      console.log('signInWithFacebook step 4', data);

      if (!data) {
        throw new Error('Something went wrong obtaining access token');
      }

      console.log('signInWithFacebook step 5');

      // Create a Facebook credential with the AccessToken
      const facebookCredential = auth.FacebookAuthProvider.credential(data.accessToken);


      console.log('signInWithFacebook step 6', facebookCredential);
      // Sign-in the user with the credential
      await auth().signInWithCredential(facebookCredential);
      
      console.log('signInWithFacebook step 7');

      return this.getCurrentUser()!;
    } catch (error: any) {
      console.error('Facebook sign-in error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Sign in with Apple (iOS only)
  async signInWithApple(): Promise<User> {
    try {
      // Note: Apple Sign-In requires additional native setup
      // This is a placeholder implementation
      throw new Error('Apple Sign-In not yet implemented');
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Sign in with Twitter
  async signInWithTwitter(): Promise<User> {
    try {
      await this.initialize();

      // Create a Twitter auth provider
      const twitterAuthProvider = auth.TwitterAuthProvider;

      // For React Native, we need to handle OAuth flow differently
      // Twitter requires OAuth 1.0a which needs a redirect flow
      // This is typically handled through a WebView or native Twitter SDK
      
      // For now, throw a user-friendly error that Twitter is not yet configured
      throw {
        code: 'auth/not-configured',
        message: 'Twitter Sign-In requires additional native configuration. Please use Google, Facebook, or Email to sign in for now.',
      };
      
      // Future implementation would use:
      // 1. A library like react-native-twitter-signin
      // 2. Or implement OAuth 1.0a flow manually
      // 3. Then exchange tokens with Firebase: auth().signInWithCredential(twitterAuthProvider.credential(token, secret))
      
    } catch (error: any) {
      console.error('Twitter sign-in error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Sign in with email and password
  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      await auth().signInWithEmailAndPassword(email, password);
      return this.getCurrentUser()!;
    } catch (error: any) {
      console.error('Email sign-in error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Create account with email and password
  async createAccountWithEmail(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      
      if (displayName) {
        await userCredential.user.updateProfile({ displayName });
      }
      
      return this.getCurrentUser()!;
    } catch (error: any) {
      console.error('Email sign-up error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      console.log('[AuthService] Starting sign out...');
      // Firebase handles sign-out for all providers
      await auth().signOut();
      console.log('[AuthService] Sign out completed successfully');
    } catch (error: any) {
      console.error('[AuthService] Sign out error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Update user profile
  async updateProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('No user signed in');

      await user.updateProfile(updates);
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Delete user account
  async deleteAccount(): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('No user signed in');

      await user.delete();
    } catch (error: any) {
      console.error('Delete account error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Handle authentication errors
  private handleAuthError(error: any): AuthError {
    let message = 'An unexpected error occurred';
    let code = 'unknown';

    if (error.code) {
      code = error.code;
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'No user found with this email address';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password';
          break;
        case 'auth/email-already-in-use':
          message = 'An account with this email already exists';
          break;
        case 'auth/weak-password':
          message = 'Password should be at least 6 characters';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          message = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          message = 'Too many failed attempts. Please try again later';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection';
          break;
        case 'auth/cancelled-popup-request':
          message = 'Sign-in was cancelled';
          break;
        default:
          message = error.message || message;
      }
    } else if (error.message) {
      message = error.message;
    }

    return { code, message };
  }

  // Check if user is signed in
  isSignedIn(): boolean {
    return auth().currentUser !== null;
  }

  // Get authentication state changes
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        callback(this.getCurrentUser());
      } else {
        callback(null);
      }
    });
  }
}

export default new AuthService();
