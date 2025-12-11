/**
 * Purchase Service
 * 
 * Handles in-app purchase operations using react-native-iap.
 * Provides methods for purchasing premium, restoring purchases, and validating receipts.
 */

import { Platform } from 'react-native';
import * as RNIap from 'react-native-iap';
import { activeExamConfig } from '../config/active-exam.config';
import { AnalyticsEvents, logEvent } from './analytics.events';

// Get product ID from active exam config
const getProductId = (): string => {
  return Platform.select({
    ios: activeExamConfig.premium.productId.ios,
    android: activeExamConfig.premium.productId.android,
  }) || '';
};

class PurchaseService {
  private isInitialized = false;
  private isInitializing = false;
  private initializationFailed = false;
  private purchaseUpdateSubscription: ReturnType<typeof RNIap.purchaseUpdatedListener> | null = null;
  private purchaseErrorSubscription: ReturnType<typeof RNIap.purchaseErrorListener> | null = null;
  private onPurchaseComplete: ((purchase: RNIap.Purchase) => void) | null = null;
  private onPurchaseError: ((error: RNIap.PurchaseError) => void) | null = null;
  
  // Store product price for analytics
  private productPrice: string | null = null;
  private productCurrency: string | null = null;

  /**
   * Initialize IAP connection
   * Should be called when app starts
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      console.log('[PurchaseService] Already initialized');
      return true;
    }

    // Prevent re-attempting initialization if it already failed
    // (e.g., on emulator where billing is not available)
    if (this.initializationFailed) {
      console.log('[PurchaseService] Skipping initialization (previously failed - expected on emulator)');
      return false;
    }

    // Prevent concurrent initialization attempts
    if (this.isInitializing) {
      console.log('[PurchaseService] Initialization already in progress');
      return false;
    }

    this.isInitializing = true;

    try {
      console.log('[PurchaseService] Initializing IAP connection...');
      const result = await RNIap.initConnection();
      console.log('[PurchaseService] IAP connection initialized:', result);
      
      // Set up purchase listeners
      this.setupListeners();
      
      this.isInitialized = true;
      this.isInitializing = false;
      return true;
    } catch (error) {
      // This is expected on emulators, devices without Play Store, or debug builds
      console.log('[PurchaseService] IAP not available (expected on emulator/debug)');
      this.initializationFailed = true;
      this.isInitializing = false;
      return false;
    }
  }

  /**
   * Set up purchase update and error listeners
   */
  private setupListeners(): void {
    // Listen for purchase updates
    this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
      async (purchase: RNIap.Purchase) => {
        console.log('[PurchaseService] Purchase updated:', purchase);
        
        // Check if we have a valid transaction
        if (purchase.transactionId) {
          try {
            // Finish the transaction
            await RNIap.finishTransaction({ purchase, isConsumable: false });
            console.log('[PurchaseService] Transaction finished');
            
            // Notify callback
            if (this.onPurchaseComplete) {
              this.onPurchaseComplete(purchase);
            }
            
            logEvent(AnalyticsEvents.PREMIUM_PURCHASE_SUCCESS, {
              productId: purchase.productId,
              transactionId: purchase.transactionId,
              price: this.productPrice,
              currency: this.productCurrency,
            });
          } catch (finishError) {
            console.error('[PurchaseService] Error finishing transaction:', finishError);
          }
        }
      }
    );

    // Listen for purchase errors
    this.purchaseErrorSubscription = RNIap.purchaseErrorListener((error: RNIap.PurchaseError) => {
      console.error('[PurchaseService] Purchase error:', error);
      
      if (this.onPurchaseError) {
        this.onPurchaseError(error);
      }
      
      logEvent(AnalyticsEvents.PREMIUM_PURCHASE_ERROR, {
        code: error.code,
        message: error.message,
        price: this.productPrice,
        currency: this.productCurrency,
      });
    });
  }

  /**
   * Set callbacks for purchase events
   */
  setCallbacks(
    onComplete: (purchase: RNIap.Purchase) => void,
    onError: (error: RNIap.PurchaseError) => void
  ): void {
    this.onPurchaseComplete = onComplete;
    this.onPurchaseError = onError;
  }

  /**
   * Get available products
   */
  async getProducts(): Promise<RNIap.Product[]> {
    try {
      const productId = getProductId();
      console.log('[PurchaseService] Getting products for:', productId);
      
      // v12 API: getProducts instead of fetchProducts
      const products = await RNIap.getProducts({ skus: [productId] });
      console.log('[PurchaseService] Products:', products);
      
      // Store price for analytics
      if (products && products.length > 0) {
        const product = products[0] as any;
        this.productPrice = product.displayPrice || product.localizedPrice || null;
        this.productCurrency = product.currency ||
          product.oneTimePurchaseOfferDetailsAndroid?.priceCurrencyCode || null;
        console.log('[PurchaseService] Stored price:', this.productPrice, 'currency:', this.productCurrency);
      }
      
      return products || [];
    } catch (error) {
      console.error('[PurchaseService] Error getting products:', error);
      return [];
    }
  }

  /**
   * Get stored product price for analytics
   */
  getProductPrice(): string | null {
    return this.productPrice;
  }

  /**
   * Get stored product currency for analytics
   */
  getProductCurrency(): string | null {
    return this.productCurrency;
  }

  /**
   * Purchase premium
   */
  async purchasePremium(): Promise<void> {
    if (!this.isInitialized) {
      console.error('[PurchaseService] Cannot purchase - not initialized');
      throw new Error('IAP not initialized');
    }

    try {
      const productId = getProductId();
      console.log('[PurchaseService] Requesting purchase for:', productId);
      
      logEvent(AnalyticsEvents.PREMIUM_PURCHASE_INITIATED, {
        productId,
        price: this.productPrice,
        currency: this.productCurrency,
      });
      
      // v12 API: simpler requestPurchase format
      if (Platform.OS === 'ios') {
        await RNIap.requestPurchase({ sku: productId });
      } else {
        await RNIap.requestPurchase({ skus: [productId] });
      }
      // The result will come through the purchaseUpdatedListener
    } catch (error) {
      console.error('[PurchaseService] Error requesting purchase:', error);
      throw error;
    }
  }

  /**
   * Restore previous purchases
   * Returns true if premium purchase was found
   */
  async restorePurchases(): Promise<RNIap.Purchase | null> {
    try {
      console.log('[PurchaseService] Restoring purchases...');
      
      logEvent(AnalyticsEvents.PREMIUM_RESTORE_INITIATED, {
        price: this.productPrice,
        currency: this.productCurrency,
      });
      
      const purchases = await RNIap.getAvailablePurchases();
      console.log('[PurchaseService] Available purchases:', purchases);
      
      const productId = getProductId();
      const premiumPurchase = purchases.find(p => p.productId === productId);
      
      if (premiumPurchase) {
        console.log('[PurchaseService] Premium purchase found:', premiumPurchase);
        logEvent(AnalyticsEvents.PREMIUM_RESTORE_SUCCESS, {
          productId: premiumPurchase.productId,
          transactionId: premiumPurchase.transactionId,
          price: this.productPrice,
          currency: this.productCurrency,
        });
        return premiumPurchase;
      }
      
      console.log('[PurchaseService] No premium purchase found');
      logEvent(AnalyticsEvents.PREMIUM_RESTORE_NOT_FOUND, {
        price: this.productPrice,
        currency: this.productCurrency,
      });
      return null;
    } catch (error) {
      console.error('[PurchaseService] Error restoring purchases:', error);
      logEvent(AnalyticsEvents.PREMIUM_RESTORE_ERROR, {
        error: error instanceof Error ? error.message : 'Unknown error',
        price: this.productPrice,
        currency: this.productCurrency,
      });
      throw error;
    }
  }

  /**
   * Clean up IAP connection
   * Should be called when app is closing
   */
  async cleanup(): Promise<void> {
    // Only cleanup if we were actually initialized
    if (!this.isInitialized) {
      return;
    }

    try {
      console.log('[PurchaseService] Cleaning up IAP connection...');
      
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }
      
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }
      
      await RNIap.endConnection();
      this.isInitialized = false;
      // Note: Don't reset initializationFailed - if billing wasn't available,
      // it won't become available without app restart
      
      console.log('[PurchaseService] IAP connection cleaned up');
    } catch (error) {
      console.error('[PurchaseService] Error cleaning up IAP:', error);
    }
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

const purchaseService = new PurchaseService();
export default purchaseService;

