/**
 * Cross-App Promotion Context
 *
 * Manages the scheduling, eligibility, and display logic for the cross-app
 * promotion modal. Tracks app opens, dismissals, and resolves app data from
 * remote config.
 *
 * Scheduling rules:
 * - Not shown on 1st app open
 * - Eligible on 2nd open, shown after ~30s
 * - Each "maybe later" dismissal increases the skip count:
 *   0 dismissals → show on open 2
 *   1 dismissal  → skip 1 → show on open 4
 *   2 dismissals → skip 2 → show on open 7
 *   3 dismissals → skip 3 → show on open 11
 *   Pattern: nextEligible = previousShown + dismissCount + 1
 *
 * Manual triggers from profile bypass all scheduling and do not track dismissals.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
import { Platform } from 'react-native';
import { useRemoteConfig } from './RemoteConfigContext';
import { useModalQueue } from './ModalQueueContext';
import { CrossAppPromotionEntry } from '../types/remote-config.types';
import { AnalyticsEvents, logEvent } from '../services/analytics.events';
import StorageService from '../services/storage.service';

interface CrossAppPromotionContextType {
  /** Open the promo modal manually (from profile). Bypasses scheduling rules. */
  showPromoModal: () => void;
  /** Handle "maybe later" dismissal. Updates counters and analytics. */
  handleMaybeLater: () => Promise<void>;
  /** Handle app card click. Opens store URL and logs analytics. */
  handleAppClick: (appId: string, isHero: boolean) => void;
  /** Resolved hero app entry from config */
  heroApp: CrossAppPromotionEntry | null;
  /** Resolved additional app entries from config */
  additionalApps: CrossAppPromotionEntry[];
  /** Whether the modal is triggered manually (no dismiss tracking) */
  isManualTrigger: boolean;
}

const CrossAppPromotionContext = createContext<CrossAppPromotionContextType | undefined>(undefined);

interface CrossAppPromotionProviderProps {
  children: ReactNode;
}

/** Delay before showing the modal after session start (ms) */
const SHOW_DELAY_MS = 30_000;

export const CrossAppPromotionProvider: React.FC<CrossAppPromotionProviderProps> = ({ children }) => {
  const { config, globalConfig } = useRemoteConfig();
  const { enqueue } = useModalQueue();
  const [isManualTrigger, setIsManualTrigger] = useState(false);
  const hasIncrementedRef = useRef(false);
  const scheduledRef = useRef(false);
  const hasBeenShownRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get the platform-specific selection from the app config
  const platformKey = Platform.OS === 'ios' ? 'ios' : 'android';
  const platformSelection = config?.crossAppPromotion?.[platformKey];

  // Derive a stable key from the config to detect when resolved apps change
  const heroAppId = platformSelection?.heroAppId || '';
  const additionalAppIdsKey = (platformSelection?.additionalAppIds || []).join(',');

  // Resolve app data from global config based on current platform (memoized on stable keys)
  const { heroApp, additionalApps } = useMemo(() => {
    const globalPromo = globalConfig?.crossAppPromotion;

    if (!globalPromo || !platformSelection) {
      return { heroApp: null, additionalApps: [] as CrossAppPromotionEntry[] };
    }

    const platformApps = platformKey === 'ios'
      ? (globalPromo.ios || [])
      : (globalPromo.android || []);

    if (platformApps.length === 0) {
      return { heroApp: null, additionalApps: [] as CrossAppPromotionEntry[] };
    }

    const hId = platformSelection.heroAppId || '';
    const aIds = platformSelection.additionalAppIds || [];

    const hero = hId ? platformApps.find(app => app.appId === hId) || null : null;
    const additional = aIds
      .map(id => platformApps.find(app => app.appId === id))
      .filter((app): app is CrossAppPromotionEntry => app != null);

    return { heroApp: hero, additionalApps: additional };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroAppId, additionalAppIdsKey, globalConfig?.crossAppPromotion]);

  /**
   * Calculate whether this session is eligible for the auto-show.
   * Uses a cumulative skip pattern based on dismiss count.
   *
   * Eligible opens: 2, 4, 7, 11, 16, ...
   * Formula: eligible[0] = 2, eligible[n] = eligible[n-1] + n + 1
   */
  const checkEligibility = useCallback(async (): Promise<boolean> => {
    try {
      const appOpenCount = await StorageService.getCrossAppPromoAppOpenCount();
      const dismissCount = await StorageService.getCrossAppPromoDismissCount();

      // Build the sequence of eligible opens
      // Start at open 2, then skip increases with each dismissal
      let nextEligible = 2;
      for (let i = 0; i < dismissCount; i++) {
        nextEligible += i + 2; // skip 1 more each time
      }

      console.log(`[CrossAppPromo] appOpenCount=${appOpenCount}, dismissCount=${dismissCount}, nextEligible=${nextEligible}`);

      return appOpenCount >= nextEligible;
    } catch (error) {
      console.error('[CrossAppPromo] Error checking eligibility:', error);
      return false;
    }
  }, []);

  // Increment app open count exactly once per session on mount
  useEffect(() => {
    if (hasIncrementedRef.current) return;
    hasIncrementedRef.current = true;

    StorageService.incrementCrossAppPromoAppOpenCount().then(count => {
      console.log(`[CrossAppPromo] App open count incremented to: ${count}`);
    });
  }, []);

  // Keep refs for values needed inside the timer callback so we don't
  // need them as effect dependencies (which would cancel the timer on re-render)
  const heroAppRef = useRef(heroApp);
  const additionalAppsRef = useRef(additionalApps);
  const enqueueRef = useRef(enqueue);
  useEffect(() => { heroAppRef.current = heroApp; }, [heroApp]);
  useEffect(() => { additionalAppsRef.current = additionalApps; }, [additionalApps]);
  useEffect(() => { enqueueRef.current = enqueue; }, [enqueue]);

  // Schedule the modal when config is available and session is eligible
  useEffect(() => {
    if (scheduledRef.current) return;

    // Wait for config to be resolved
    if (!heroApp || additionalApps.length === 0) {
      return;
    }

    const trySchedule = async () => {
      if (scheduledRef.current) return;

      const eligible = await checkEligibility();
      if (!eligible) {
        console.log('[CrossAppPromo] Session not eligible for promo modal');
        // Mark as scheduled to avoid re-checking on config updates
        scheduledRef.current = true;
        return;
      }

      // Schedule the modal after delay
      console.log(`[CrossAppPromo] Scheduling modal in ${SHOW_DELAY_MS}ms`);
      scheduledRef.current = true;

      timerRef.current = setTimeout(() => {
        // Skip if user already saw the modal this session (e.g. opened manually from profile)
        if (hasBeenShownRef.current) {
          console.log('[CrossAppPromo] Modal already shown this session, skipping automatic trigger');
          return;
        }

        const currentHero = heroAppRef.current;
        const currentAdditional = additionalAppsRef.current;

        if (!currentHero) {
          console.log('[CrossAppPromo] No hero app available when timer fired');
          return;
        }

        setIsManualTrigger(false);
        hasBeenShownRef.current = true;
        enqueueRef.current('cross-app-promotion');

        // Log analytics
        logEvent(AnalyticsEvents.CROSS_APP_PROMO_MODAL_SHOWN, {
          app_ids: [currentHero.appId, ...currentAdditional.map(a => a.appId)],
          hero_app_id: currentHero.appId,
          trigger: 'automatic',
        });

        // Record the timestamp
        StorageService.saveCrossAppPromoLastShownAt();
      }, SHOW_DELAY_MS);
    };

    trySchedule();
    // Note: we intentionally do NOT cancel the timer on re-render.
    // The timer is only cleaned up on unmount (see separate effect below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroApp, additionalApps, checkEligibility]);

  // Clean up the timer only on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Manual trigger from profile screen
  const showPromoModal = useCallback(() => {
    if (!heroApp) {
      console.log('[CrossAppPromo] Cannot show modal - no hero app configured');
      return;
    }

    setIsManualTrigger(true);
    hasBeenShownRef.current = true;
    enqueue('cross-app-promotion');

    // Log analytics
    logEvent(AnalyticsEvents.CROSS_APP_PROMO_OPENED_FROM_PROFILE);
    logEvent(AnalyticsEvents.CROSS_APP_PROMO_MODAL_SHOWN, {
      app_ids: [heroApp.appId, ...additionalApps.map(a => a.appId)],
      hero_app_id: heroApp.appId,
      trigger: 'profile',
    });
  }, [heroApp, additionalApps, enqueue]);

  // Handle "maybe later" dismissal
  const handleMaybeLater = useCallback(async () => {
    if (!isManualTrigger) {
      const newDismissCount = await StorageService.incrementCrossAppPromoDismissCount();
      await StorageService.saveCrossAppPromoLastShownAt();

      logEvent(AnalyticsEvents.CROSS_APP_PROMO_MAYBE_LATER, {
        dismiss_count: newDismissCount,
      });
    }
  }, [isManualTrigger]);

  // Handle app card click
  const handleAppClick = useCallback((appId: string, isHero: boolean) => {
    logEvent(AnalyticsEvents.CROSS_APP_PROMO_APP_CLICKED, {
      app_id: appId,
      is_hero: isHero,
    });
  }, []);

  const value: CrossAppPromotionContextType = {
    showPromoModal,
    handleMaybeLater,
    handleAppClick,
    heroApp,
    additionalApps,
    isManualTrigger,
  };

  return (
    <CrossAppPromotionContext.Provider value={value}>
      {children}
    </CrossAppPromotionContext.Provider>
  );
};

export const useCrossAppPromotion = (): CrossAppPromotionContextType => {
  const context = useContext(CrossAppPromotionContext);
  if (context === undefined) {
    throw new Error('useCrossAppPromotion must be used within a CrossAppPromotionProvider');
  }
  return context;
};
