import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import FirestoreService from './firestore.service';

/**
 * FCM (Firebase Cloud Messaging) Service
 * Handles device token registration and push notification setup
 * 
 * SETUP REQUIRED:
 * 1. Install: npm install @react-native-firebase/messaging
 * 2. For iOS: cd ios && pod install
 * 3. Configure iOS capabilities: Push Notifications + Background Modes
 * 4. Add background handler to index.js (see FCM_SETUP.md)
 */

class FCMService {
  private initialized = false;
  private tokenRefreshUnsubscribe: (() => void) | null = null;
  private onMessageUnsubscribe: (() => void) | null = null;

  /**
   * Request notification permission and get FCM token
   */
  async requestPermissionAndGetToken(): Promise<string | null> {
    try {
      // Request permission (required for iOS, optional for Android < 13)
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('FCM: Permission denied');
        return null;
      }

      // Get FCM token
      const token = await messaging().getToken();
      console.log('FCM Token obtained:', token ? `${token.substring(0, 20)}...` : 'null');
      
      return token;
    } catch (error) {
      console.error('Error requesting FCM permission and token:', error);
      return null;
    }
  }

  /**
   * Initialize FCM service and register token with user account
   */
  async initialize(userId: string): Promise<void> {
    if (this.initialized) {
      console.log('FCM Service already initialized');
      return;
    }

    try {
      console.log('Initializing FCM service for user:', userId);
      
      // Get FCM token
      const token = await this.requestPermissionAndGetToken();
      
      if (token && userId) {
        // Save token to Firestore
        const platform = Platform.OS as 'ios' | 'android';
        await FirestoreService.saveFCMToken(userId, token, platform);
        console.log('FCM token registered for user:', userId);
      } else {
        console.warn('FCM: No token obtained or no userId provided');
      }

      // Listen for token refresh
      this.tokenRefreshUnsubscribe = messaging().onTokenRefresh(async (newToken) => {
        console.log('FCM token refreshed');
        if (userId && newToken) {
          const platform = Platform.OS as 'ios' | 'android';
          try {
            await FirestoreService.saveFCMToken(userId, newToken, platform);
            console.log('FCM refreshed token saved to Firestore');
          } catch (error) {
            console.error('Error saving refreshed FCM token:', error);
          }
        }
      });

      // Handle foreground messages
      this.onMessageUnsubscribe = messaging().onMessage(async (remoteMessage) => {
        console.log('Foreground FCM message received:', {
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
          data: remoteMessage.data,
        });
        
        // You can display a local notification here if needed
        // Or handle the message in your app's UI
      });

      // Note: Background messages require a handler in index.js
      // See: https://rnfirebase.io/messaging/usage#background-messages

      this.initialized = true;
      console.log('FCM service initialized successfully');
    } catch (error) {
      console.error('Error initializing FCM service:', error);
      throw error;
    }
  }

  /**
   * Remove FCM token for current device
   */
  async unregisterToken(userId: string): Promise<void> {
    try {
      console.log('Unregistering FCM token for user:', userId);
      
      // Delete token from Firebase
      await messaging().deleteToken();
      
      // Remove from Firestore
      if (userId) {
        await FirestoreService.removeFCMToken(userId);
      }
      
      // Clean up listeners
      if (this.tokenRefreshUnsubscribe) {
        this.tokenRefreshUnsubscribe();
        this.tokenRefreshUnsubscribe = null;
      }
      
      if (this.onMessageUnsubscribe) {
        this.onMessageUnsubscribe();
        this.onMessageUnsubscribe = null;
      }
      
      this.initialized = false;
      console.log('FCM token unregistered successfully');
    } catch (error) {
      console.error('Error unregistering FCM token:', error);
      throw error;
    }
  }

  /**
   * Check if notifications are supported and enabled
   */
  async checkNotificationStatus(): Promise<{
    supported: boolean;
    enabled: boolean;
  }> {
    try {
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      return {
        supported: true,
        enabled,
      };
    } catch (error) {
      console.error('Error checking notification status:', error);
      return { supported: false, enabled: false };
    }
  }

  /**
   * Get current FCM token
   */
  async getCurrentToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Check if app was opened from a notification
   */
  async getInitialNotification(): Promise<any | null> {
    try {
      const remoteMessage = await messaging().getInitialNotification();
      if (remoteMessage) {
        console.log('App opened from notification:', remoteMessage);
        return remoteMessage;
      }
      return null;
    } catch (error) {
      console.error('Error getting initial notification:', error);
      return null;
    }
  }

  /**
   * Clean up listeners (call when user logs out)
   */
  cleanup(): void {
    if (this.tokenRefreshUnsubscribe) {
      this.tokenRefreshUnsubscribe();
      this.tokenRefreshUnsubscribe = null;
    }
    
    if (this.onMessageUnsubscribe) {
      this.onMessageUnsubscribe();
      this.onMessageUnsubscribe = null;
    }
    
    this.initialized = false;
    console.log('FCM service cleaned up');
  }
}

export default new FCMService();

