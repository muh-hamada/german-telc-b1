/**
 * Premium Context
 * 
 * Manages premium subscription state across the app.
 * - Fetches premium status from Firestore on login
 * - Handles purchase and restore operations
 * - Syncs premium status to Firestore
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import firestore from '@react-native-firebase/firestore';
import crashlytics from '@react-native-firebase/crashlytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Purchase, PurchaseError, Product, ErrorCode } from 'react-native-iap';
import { useAuth } from './AuthContext';
import { useRemoteConfig } from './RemoteConfigContext';
import { DEFAULT_REMOTE_CONFIG } from '../types/remote-config.types';
import purchaseService from '../services/purchase.service';
import { activeExamConfig } from '../config/active-exam.config';
import { SIMULATE_PREMIUM_USER } from '../config/development.config';

interface PremiumData {
  isPremium: boolean;
  purchaseDate: number | null;
  productId: string | null;
  transactionId: string | null;
}

interface PremiumContextType {
  // State
  isPremium: boolean;
  isLoading: boolean;
  isPurchasing: boolean;
  error: string | null;

  // Product info (fetched from store)
  productPrice: string | null;        // Localized price e.g., "$4.99", "€4,99", "£3.99"
  productCurrency: string | null;     // Currency code e.g., "USD", "EUR"
  productOriginalPrice: string | null; // Original price if there's a discount
  discountPercentage: number;         // Discount percentage from remote config
  isLoadingProduct: boolean;
  isProductAvailable: boolean;        // Whether the product was successfully loaded from store

  // Actions
  purchasePremium: (sourceScreen?: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshPremiumStatus: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

interface PremiumProviderProps {
  children: ReactNode;
}

const DEFAULT_PREMIUM_DATA: PremiumData = {
  isPremium: false,
  purchaseDate: null,
  productId: null,
  transactionId: null,
};

const PREMIUM_STORAGE_KEY = 'premium_status_v1';

export const PremiumProvider: React.FC<PremiumProviderProps> = ({ children }) => {
  const { user, isInitialized } = useAuth();
  const { isPremiumFeaturesEnabled, config: remoteConfig } = useRemoteConfig();

  const [premiumData, setPremiumData] = useState<PremiumData>(DEFAULT_PREMIUM_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cached premium status on mount
  useEffect(() => {
    const loadCachedStatus = async () => {
      try {
        const cached = await AsyncStorage.getItem(PREMIUM_STORAGE_KEY);
        if (cached) {
          const data = JSON.parse(cached);
          console.log('[PremiumContext] Loaded cached premium status:', data);
          setPremiumData(prev => ({ ...prev, ...data }));
          crashlytics().setAttribute('isPremium', String(data.isPremium));
        }
      } catch (e) {
        console.error('[PremiumContext] Error loading cached status:', e);
      }
    };
    loadCachedStatus();
  }, []);

  // Product info from store (localized price)
  const [productPrice, setProductPrice] = useState<string | null>(null);
  const [productCurrency, setProductCurrency] = useState<string | null>(null);
  const [productOriginalPrice, setProductOriginalPrice] = useState<string | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [isProductAvailable, setIsProductAvailable] = useState(false);
  const [isIAPReady, setIsIAPReady] = useState(false);
  
  // Store raw product data for recalculation when config changes
  const [rawProductData, setRawProductData] = useState<{
    price: string;
    currency: string | null;
  } | null>(null);

  /**
   * Get Firestore path for user's premium data
   */
  const getPremiumPath = useCallback((userId: string): string => {
    return `users/${userId}/premium/${activeExamConfig.id}`;
  }, []);

  /**
   * Load premium status from Firestore
   */
  const loadPremiumStatus = useCallback(async () => {
    // If auth is not initialized yet, don't reset premium status
    // We want to keep the cached status visible while auth loads
    if (!isInitialized) {
      console.log('[PremiumContext] Auth not initialized yet, skipping load');
      return;
    }

    if (!user?.uid) {
      console.log('[PremiumContext] No user and auth initialized, setting premium to false');
      // If no user, we should clear the premium cache to avoid showing premium for guest
      setPremiumData(DEFAULT_PREMIUM_DATA); 
      setIsLoading(false);
      return;
    }

    try {
      console.log('[PremiumContext] Loading premium status for user:', user.uid);
      setIsLoading(true);

      const docPath = getPremiumPath(user.uid);
      console.log('[PremiumContext] Doc path:', docPath);
      const docRef = firestore().doc(docPath);
      const docSnapshot = await docRef.get();

      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as PremiumData;
        console.log('[PremiumContext] Premium data loaded:', data);
        setPremiumData(data);
        crashlytics().setAttribute('isPremium', String(data.isPremium));
        // Cache the data
        await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(data));
      } else {
        console.log('[PremiumContext] No premium data found, user is not premium');
        // Only reset if we don't have cached data showing premium, 
        // OR if we are sure this is a fresh authoritative check.
        // But since this is a check against Firestore, it IS authoritative.
        const newData = DEFAULT_PREMIUM_DATA;
        setPremiumData(newData);
        crashlytics().setAttribute('isPremium', 'false');
        await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(newData));
      }

      setError(null);
    } catch (err) {
      console.error('[PremiumContext] Error loading premium status:', err);
      // If error (e.g. offline), we rely on cached data which we loaded on mount
      // Don't overwrite with default unless we have no cache? 
      // We already loaded cache in mount. So if we fail here, we just keep what we have.
      setError('Failed to load premium status');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, getPremiumPath, isInitialized]);

  /**
   * Save premium status to Firestore
   */
  const savePremiumStatus = useCallback(async (data: PremiumData): Promise<void> => {
    if (!user?.uid) {
      console.error('[PremiumContext] Cannot save premium status: no user');
      return;
    }

    try {
      console.log('[PremiumContext] Saving premium status:', data);

      // Save to cache first for immediate feedback next time
      await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(data));
      setPremiumData(data); // Optimistic update
      crashlytics().setAttribute('isPremium', String(data.isPremium));

      const docPath = getPremiumPath(user.uid);
      const docRef = firestore().doc(docPath);
      await docRef.set(data, { merge: true });

      console.log('[PremiumContext] Premium status saved');
    } catch (err) {
      console.error('[PremiumContext] Error saving premium status:', err);
      throw err;
    }
  }, [user?.uid, getPremiumPath]);

  /**
   * Handle successful purchase
   */
  const handlePurchaseComplete = useCallback(async (purchase: Purchase) => {
    console.log('[PremiumContext] Purchase complete:', purchase);
    // Analytics logged in purchase.service.ts

    const newPremiumData: PremiumData = {
      isPremium: true,
      purchaseDate: Date.now(),
      productId: purchase.productId,
      transactionId: purchase.transactionId || null,
    };

    try {
      await savePremiumStatus(newPremiumData);
      setPremiumData(newPremiumData);
      setIsPurchasing(false);
      setError(null);
    } catch (err) {
      console.error('[PremiumContext] Error saving purchase:', err);
      setError('Purchase successful but failed to save. Please restore purchases.');
      setIsPurchasing(false);
    }
  }, [savePremiumStatus]);

  /**
   * Handle "already owned" scenario - when a purchase exists on the store account
   * but not associated with the current app user
   */
  const handleAlreadyOwned = useCallback(async (): Promise<boolean> => {
    console.log('[PremiumContext] Handling already owned scenario...');
    
    try {
      // Get the existing purchase from the store
      const purchase = await purchaseService.restorePurchases();
      
      if (purchase) {
        console.log('[PremiumContext] Found existing purchase, granting to current user:', purchase);
        
        const newPremiumData: PremiumData = {
          isPremium: true,
          purchaseDate: purchase.transactionDate || Date.now(),
          productId: purchase.productId,
          transactionId: purchase.transactionId || null,
        };

        await savePremiumStatus(newPremiumData);
        setPremiumData(newPremiumData);
        setError(null);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('[PremiumContext] Error handling already owned:', err);
      return false;
    }
  }, [savePremiumStatus]);

  /**
   * Handle purchase error
   */
  const handlePurchaseError = useCallback(async (purchaseError: PurchaseError) => {
    console.error('[PremiumContext] Purchase error:', purchaseError);
    // Analytics logged in purchase.service.ts

    // User cancelled is not really an error
    if (purchaseError.code === ErrorCode.E_USER_CANCELLED) {
      setError(null);
      setIsPurchasing(false);
      return;
    }
    
    // Handle "already owned" error - this happens when a different app user
    // tries to purchase on the same device/store account
    if (purchaseError.code === ErrorCode.E_ALREADY_OWNED) {
      console.log('[PremiumContext] Item already owned, attempting to restore for current user...');
      const success = await handleAlreadyOwned();
      
      if (success) {
        console.log('[PremiumContext] Successfully restored already-owned purchase');
        setIsPurchasing(false);
        return;
      }
      
      // If restore failed, show a helpful error
      setError('This item was already purchased. Please use "Restore Purchases" to access premium features.');
      setIsPurchasing(false);
      return;
    }

    setError(purchaseError.message || 'Purchase failed');
    setIsPurchasing(false);
  }, [handleAlreadyOwned]);

  /**
   * Initialize IAP service and fetch product info (runs once on mount)
   */
  useEffect(() => {
    let isMounted = true;

    const initIAP = async () => {
      const initialized = await purchaseService.initialize();
      if (!isMounted) return;

      if (initialized) {
        // Mark IAP as ready so callbacks can be set
        setIsIAPReady(true);
        
        // Fetch product info to get localized price
        try {
          setIsLoadingProduct(true);
          const products = await purchaseService.getProducts();

          if (!isMounted) return;

          if (products.length > 0) {
            const product = products[0] as any; // Type assertion for cross-platform properties
            console.log('[PremiumContext] Product info loaded:', product);

            // Get current price from store (this is the discounted price if manually reduced)
            const price = product.displayPrice || product.localizedPrice || null;
            const currency = product.currency ||
              product.oneTimePurchaseOfferDetailsAndroid?.priceCurrencyCode || null;
            
            if (price) {
              // Store raw product data for offer calculation
              setRawProductData({ price, currency });
              setProductPrice(price);
              setProductCurrency(currency);
              setIsProductAvailable(true);
              console.log('[PremiumContext] Product data stored:', { price, currency });
            } else {
              console.warn('[PremiumContext] Product has no price information');
              setIsProductAvailable(false);
            }
          } else {
            console.log('[PremiumContext] No products found - purchase will not be available');
            setIsProductAvailable(false);
          }
        } catch (err) {
          console.error('[PremiumContext] Error fetching products:', err);
        } finally {
          if (isMounted) {
            setIsLoadingProduct(false);
          }
        }
      } else {
        setIsLoadingProduct(false);
      }
    };

    initIAP();

    // Only cleanup on actual unmount
    return () => {
      isMounted = false;
      purchaseService.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  /**
   * Recalculate offer pricing when remote config or product data changes
   */
  useEffect(() => {
    if (!rawProductData) {
      return;
    }

    const { price, currency } = rawProductData;
    let originalPrice = null;
    
    // Check if offer is active via remote config
    const offerConfig = remoteConfig?.premiumOffer || DEFAULT_REMOTE_CONFIG.premiumOffer;
    
    console.log('[PremiumContext] Recalculating offer with config:', offerConfig);

    if (isPremiumFeaturesEnabled() && price && offerConfig.isActive && offerConfig.discountPercentage > 0) {
      // Calculate original price from discount percentage
      // If current price is $3.74 and discount is 25%, original = $3.74 / (1 - 0.25) = $4.99
      const discountMultiplier = 1 - (offerConfig.discountPercentage / 100);
      
      // Parse price string (remove currency symbols, convert to number)
      const priceMatch = price.match(/[\d.,]+/);
      if (priceMatch) {
        const numericPrice = parseFloat(priceMatch[0].replace(',', '.'));
        const calculatedOriginal = numericPrice / discountMultiplier;
        
        // Round to nearest 0.5 (e.g., 15.37 → 15.5, 10.1 → 10, 18.93 → 19)
        const roundedOriginal = Math.round(calculatedOriginal * 2) / 2;
        
        // Format back to currency string with same symbol
        const currencySymbol = price.replace(/[\d.,\s]+/g, '').trim();
        
        // Format original price (whole number or .5)
        const formattedOriginal = roundedOriginal % 1 === 0 
          ? roundedOriginal.toFixed(0) 
          : roundedOriginal.toFixed(1);
        
        originalPrice = currencySymbol ? `${currencySymbol}${formattedOriginal}` : formattedOriginal;
        
        console.log('[PremiumContext] Server-side offer active:', {
          discountPercentage: offerConfig.discountPercentage,
          currentPrice: price,
          calculatedOriginal: originalPrice,
          roundedOriginalNumeric: roundedOriginal,
          actualDiscountFromRounded: ((roundedOriginal - numericPrice) / roundedOriginal * 100).toFixed(1) + '%',
        });
      }
    }

    console.log('[PremiumContext] Final prices - Current:', price, 'Original:', originalPrice, 'Currency:', currency);
    setProductOriginalPrice(originalPrice);
  }, [rawProductData, remoteConfig, isPremiumFeaturesEnabled]);

  /**
   * Update purchase callbacks when IAP is ready or callbacks change
   */
  useEffect(() => {
    if (isIAPReady && purchaseService.isReady()) {
      console.log('[PremiumContext] Setting purchase callbacks');
      purchaseService.setCallbacks(handlePurchaseComplete, handlePurchaseError);
    }
  }, [isIAPReady, handlePurchaseComplete, handlePurchaseError]);

  /**
   * Load premium status when user changes
   */
  useEffect(() => {
    loadPremiumStatus();
  }, [loadPremiumStatus]);

  /**
   * Purchase premium
   */
  const purchasePremium = useCallback(async (sourceScreen?: string): Promise<boolean> => {
    if (!user?.uid) {
      setError('Please sign in to purchase premium');
      return false;
    }

    if (!isProductAvailable) {
      console.error('[PremiumContext] Cannot purchase - product not available');
      setError('Product not available. Please try again later.');
      return false;
    }

    // Check if IAP service is ready before attempting purchase
    if (!purchaseService.isReady()) {
      console.error('[PremiumContext] Cannot purchase - IAP service not ready');
      setError('Billing service not ready. Please try again.');
      return false;
    }

    try {
      // Analytics logged in purchase.service.ts
      setIsPurchasing(true);
      setError(null);

      // First, check if user already has this purchase on their store account
      // This handles the case where a different app user purchased on the same device
      console.log('[PremiumContext] Checking for existing purchases before purchase...');
      const existingPurchase = await purchaseService.restorePurchases();
      
      if (existingPurchase) {
        console.log('[PremiumContext] Found existing purchase, granting to current user');
        const newPremiumData: PremiumData = {
          isPremium: true,
          purchaseDate: existingPurchase.transactionDate || Date.now(),
          productId: existingPurchase.productId,
          transactionId: existingPurchase.transactionId || null,
        };

        await savePremiumStatus(newPremiumData);
        setPremiumData(newPremiumData);
        setIsPurchasing(false);
        setError(null);
        return true;
      }

      // No existing purchase found, proceed with new purchase
      await purchaseService.purchasePremium(sourceScreen);
      // Result will come through handlePurchaseComplete callback
      return true;
    } catch (err) {
      console.error('[PremiumContext] Error initiating purchase:', err);
      // Analytics logged in purchase.service.ts
      setError('Failed to start purchase');
      setIsPurchasing(false);
      return false;
    }
  }, [user?.uid, isProductAvailable, savePremiumStatus]);

  /**
   * Restore purchases
   */
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!user?.uid) {
      setError('Please sign in to restore purchases');
      return false;
    }

    try {
      // Analytics logged in purchase.service.ts
      setIsPurchasing(true);
      setError(null);

      const purchase = await purchaseService.restorePurchases();

      if (purchase) {
        // Analytics logged in purchase.service.ts
        const newPremiumData: PremiumData = {
          isPremium: true,
          purchaseDate: purchase.transactionDate || Date.now(),
          productId: purchase.productId,
          transactionId: purchase.transactionId || null,
        };

        await savePremiumStatus(newPremiumData);
        setPremiumData(newPremiumData);
        setIsPurchasing(false);
        return true;
      } else {
        // Analytics logged in purchase.service.ts
        setError('No previous purchases found');
        setIsPurchasing(false);
        return false;
      }
    } catch (err) {
      console.error('[PremiumContext] Error restoring purchases:', err);
      // Analytics logged in purchase.service.ts
      setError('Failed to restore purchases');
      setIsPurchasing(false);
      return false;
    }
  }, [user?.uid, savePremiumStatus]);

  /**
   * Refresh premium status
   */
  const refreshPremiumStatus = useCallback(async (): Promise<void> => {
    await loadPremiumStatus();
  }, [loadPremiumStatus]);

  const value: PremiumContextType = {
    isPremium: SIMULATE_PREMIUM_USER ? true : (premiumData?.isPremium ?? false),
    isLoading,
    isPurchasing,
    error,
    productPrice,
    productCurrency,
    productOriginalPrice,
    discountPercentage: remoteConfig?.premiumOffer?.discountPercentage || 0,
    isLoadingProduct,
    isProductAvailable,
    purchasePremium,
    restorePurchases,
    refreshPremiumStatus,
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
};

/**
 * Hook to use the PremiumContext
 */
export const usePremium = (): PremiumContextType => {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};

