import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken, Settings } from 'react-native-fbsdk-next';
import { Platform } from 'react-native';
import appleAuth from '@invertase/react-native-apple-authentication';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
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

      // Show Google sign-in prompt and get user info
      const signInResponse = await GoogleSignin.signIn();
      
      // Check if sign-in was cancelled or failed
      if (!signInResponse || !signInResponse.data) {
        throw {
          code: 'auth/cancelled',
          message: 'Sign-in was cancelled',
        };
      }
      
      console.log('Google sign-in successful, user:', signInResponse.data?.user?.email || 'unknown');

      // Get the users ID token (only after successful sign-in)
      const tokens = await GoogleSignin.getTokens();

      console.log('Got tokens for user');

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(tokens.idToken);

      // Sign-in the user with the credential
      await auth().signInWithCredential(googleCredential);

      console.log('Firebase sign-in successful');

      return this.getCurrentUser()!;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Sign in with Facebook
  async signInWithFacebook(): Promise<User> {
    try {
      console.log('[Facebook] Step 1: Starting Facebook sign-in');
      
      // Check if Facebook is properly configured
      if (!facebookConfig.appId || facebookConfig.appId === 'YOUR_FACEBOOK_APP_ID') {
        throw {
          code: 'auth/not-configured',
          message: 'Facebook Sign-In is not configured yet. Please follow the setup guide in FACEBOOK_SETUP.md or use Google/Email sign-in instead.',
        };
      }
      
      await this.initialize();

      // CRITICAL: Request App Tracking Transparency permission BEFORE Facebook login on iOS
      // This prevents Facebook from using Limited Login which causes invalid-credential errors
      if (Platform.OS === 'ios') {
        console.log('[Facebook] Step 1.5: Requesting App Tracking Transparency permission');
        
        try {
          const result = await request(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
          console.log('[Facebook] ATT Permission result:', result);
          
          if (result === RESULTS.GRANTED || result === RESULTS.UNAVAILABLE) {
            console.log('[Facebook] Tracking permission granted or unavailable (iOS < 14)');
            Settings.setAdvertiserTrackingEnabled(true);
          } else {
            console.log('[Facebook] Tracking permission denied, but continuing with login');
            // User denied tracking, but we can still try to login with limited mode
            Settings.setAdvertiserTrackingEnabled(false);
          }
        } catch (error) {
          console.warn('[Facebook] Failed to request ATT permission:', error);
          // Continue anyway - older iOS versions don't need this
        }
      }

      // Configure Facebook SDK settings for iOS
      if (Platform.OS === 'ios') {
        console.log('[Facebook] Step 2: Configuring Facebook SDK for iOS');
        Settings.setAppID(facebookConfig.appId);
        Settings.setClientToken(facebookConfig.clientToken);
        Settings.initializeSDK();
        
        // Enable auto log events
        Settings.setAdvertiserIDCollectionEnabled(true);
        Settings.setAutoLogAppEventsEnabled(true);
        
        console.log('[Facebook] Facebook SDK configured');
      }

      // Logout first to ensure clean state
      await LoginManager.logOut();
      console.log('[Facebook] Step 3: Logged out previous session');

      // Use native login with fallback - now that we have ATT permission, this should work
      console.log('[Facebook] Step 4: Setting login behavior');
      LoginManager.setLoginBehavior('native_with_fallback');

      console.log('[Facebook] Step 5: Requesting login with permissions');
      
      // Attempt login with permissions
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

      console.log('[Facebook] Step 6: Login result received:', {
        isCancelled: result.isCancelled,
        grantedPermissions: result.grantedPermissions,
        declinedPermissions: result.declinedPermissions,
      });

      if (result.isCancelled) {
        throw {
          code: 'auth/cancelled',
          message: 'User cancelled the login process',
        };
      }

      // Check if required permissions were granted
      if (!result.grantedPermissions || result.grantedPermissions.length === 0) {
        throw {
          code: 'auth/permissions-denied',
          message: 'Required permissions were not granted. Please try again and accept the requested permissions.',
        };
      }

      console.log('[Facebook] Step 7: Getting current access token');

      // Wait a moment for the token to be available
      await new Promise<void>(resolve => setTimeout(() => resolve(), 500));

      // Once signed in, get the users AccessToken
      const data = await AccessToken.getCurrentAccessToken();

      console.log('[Facebook] Step 8: Access token check:', {
        hasData: !!data,
        hasAccessToken: !!data?.accessToken,
        tokenLength: data?.accessToken?.length || 0,
        userID: data?.userID || 'none',
        permissions: data?.permissions || [],
      });

      if (!data) {
        // Try one more time after a longer delay
        console.log('[Facebook] Retrying to get access token after delay...');
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
        const retryData = await AccessToken.getCurrentAccessToken();
        
        if (!retryData) {
          throw {
            code: 'auth/no-token',
            message: 'Facebook login succeeded but no access token was returned. This may be due to Limited Login being active. Please check Facebook Developer Console settings or try again.',
          };
        }
        
        console.log('[Facebook] Access token retrieved on retry');
        return await this.completeFacebookSignIn(retryData.accessToken);
      }

      // Validate the access token
      if (!data.accessToken || data.accessToken.length === 0) {
        throw {
          code: 'auth/invalid-token',
          message: 'Invalid access token received from Facebook. The token may be expired or malformed.',
        };
      }

      console.log('[Facebook] Step 9: Valid token received, length:', data.accessToken.length);

      return await this.completeFacebookSignIn(data.accessToken);
      
    } catch (error: any) {
      console.error('[Facebook] Sign-in error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Helper method to complete Facebook sign-in with Firebase
  private async completeFacebookSignIn(accessToken: string): Promise<User> {
    console.log('[Facebook] Creating Firebase credential with access token');
    
    // Create a Facebook credential with the AccessToken
    const facebookCredential = auth.FacebookAuthProvider.credential(accessToken);

    console.log('[Facebook] Firebase credential created, signing in...');
    
    // Sign-in the user with the credential
    await auth().signInWithCredential(facebookCredential);
    
    console.log('[Facebook] Firebase sign-in successful!');

    return this.getCurrentUser()!;
  }

  // Sign in with Apple (iOS only)
  async signInWithApple(): Promise<User> {
    try {
      // Only available on iOS 13+
      if (Platform.OS !== 'ios') {
        throw {
          code: 'auth/not-available',
          message: 'Apple Sign-In is only available on iOS devices',
        };
      }

      // Check if Apple Sign-In is supported on this device
      if (!appleAuth.isSupported) {
        throw {
          code: 'auth/not-available',
          message: 'Apple Sign-In is not supported on this device. Please use iOS 13 or later.',
        };
      }

      await this.initialize();

      // Perform the Apple sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      // Ensure Apple returned a user identityToken
      if (!appleAuthRequestResponse.identityToken) {
        throw {
          code: 'auth/missing-token',
          message: 'Apple Sign-In failed - no identity token returned',
        };
      }

      // Create a Firebase credential from the response
      const { identityToken, nonce } = appleAuthRequestResponse;
      const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);

      // Sign the user in with the credential
      const userCredential = await auth().signInWithCredential(appleCredential);

      // Update the user's display name if provided by Apple (only on first sign-in)
      if (appleAuthRequestResponse.fullName?.givenName && !userCredential.user.displayName) {
        const displayName = `${appleAuthRequestResponse.fullName.givenName || ''} ${appleAuthRequestResponse.fullName.familyName || ''}`.trim();
        if (displayName) {
          await userCredential.user.updateProfile({ displayName });
        }
      }

      return this.getCurrentUser()!;
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      
      // Handle Apple Sign-In specific errors
      if (error.code === appleAuth.Error.CANCELED) {
        throw {
          code: 'auth/cancelled',
          message: 'Sign-in was cancelled',
        };
      } else if (error.code === appleAuth.Error.FAILED) {
        throw {
          code: 'auth/failed',
          message: 'Apple Sign-In failed. Please try again.',
        };
      } else if (error.code === appleAuth.Error.INVALID_RESPONSE) {
        throw {
          code: 'auth/invalid-response',
          message: 'Invalid response from Apple. Please try again.',
        };
      } else if (error.code === appleAuth.Error.NOT_HANDLED) {
        throw {
          code: 'auth/not-handled',
          message: 'Apple Sign-In could not be handled. Please try again.',
        };
      } else if (error.code === appleAuth.Error.UNKNOWN) {
        throw {
          code: 'auth/unknown',
          message: 'An unknown error occurred with Apple Sign-In.',
        };
      }
      
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
    let message = 'auth.errors.unknownError';
    let code = 'unknown';

    if (error.code) {
      code = error.code;
      switch (error.code) {
        // Invalid credentials (covers both wrong password and user not found for security)
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          code = 'auth/invalid-credential';
          message = 'auth.errors.invalidCredential';
          break;
        case 'auth/email-already-in-use':
          message = 'auth.errors.emailInUse';
          break;
        case 'auth/weak-password':
          message = 'auth.errors.weakPassword';
          break;
        case 'auth/invalid-email':
          message = 'auth.errors.invalidEmail';
          break;
        case 'auth/user-disabled':
          message = 'auth.errors.userDisabled';
          break;
        case 'auth/too-many-requests':
          message = 'auth.errors.tooManyRequests';
          break;
        case 'auth/network-request-failed':
          message = 'auth.errors.networkError';
          break;
        case 'auth/cancelled-popup-request':
          code = 'auth/cancelled';
          message = 'Sign-in was cancelled'; // Don't translate cancellation
          break;
        case 'auth/not-configured':
          // Keep custom configuration messages as-is
          message = error.message || 'This sign-in method is not configured yet';
          break;
        // Google Sign-In specific errors
        case '-5': // SIGN_IN_CANCELLED
        case '12501': // SIGN_IN_CANCELLED (Android)
          code = 'auth/cancelled';
          message = 'Sign-in was cancelled';
          break;
        case '7': // NETWORK_ERROR
          message = 'auth.errors.networkError';
          break;
        default:
          // Check if it's a technical error message that should be simplified
          if (error.message && (error.message.includes('auth/') || error.message.includes('firebase'))) {
            message = 'auth.errors.unknownError';
          } else {
            message = error.message || message;
          }
      }
    } else if (error.message) {
      // Handle specific error messages
      if (error.message.includes('getTokens requires a user to be signed in')) {
        code = 'auth/cancelled';
        message = 'Sign-in was cancelled';
      } else if (error.message.includes('cancelled') || error.message.includes('canceled')) {
        code = 'auth/cancelled';
        message = 'Sign-in was cancelled';
      } else if (error.message.includes('Sign in action cancelled')) {
        code = 'auth/cancelled';
        message = 'Sign-in was cancelled';
      } else if (error.message.includes('DEVELOPER_ERROR')) {
        code = 'auth/configuration-error';
        message = 'Sign-in configuration error. Please contact support';
      } else {
        // For any other technical errors, provide a user-friendly message
        message = error.message.includes('auth/') || error.message.includes('firebase') 
          ? 'auth.errors.unknownError'
          : 'Failed to sign in. Please try again';
      }
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
