import {
  AdsConsent,
  AdsConsentStatus,
  AdsConsentDebugGeography,
} from 'react-native-google-mobile-ads';

/**
 * ConsentService - Manages User Messaging Platform (UMP) consent flow
 * 
 * Handles GDPR and US privacy law compliance for personalized ads.
 * The UMP SDK automatically detects user location and shows appropriate consent forms.
 */
class ConsentService {
  private consentStatus: AdsConsentStatus = AdsConsentStatus.UNKNOWN;

  /**
   * Request consent information and show form if required
   * Should be called before initializing Google Mobile Ads SDK
   * 
   * @param testDeviceIds - Optional array of test device IDs for debugging
   * @param debugGeography - Optional debug geography setting for testing
   * @returns Promise that resolves with consent status
   */
  async requestConsent(
    testDeviceIds?: string[],
    debugGeography?: AdsConsentDebugGeography
  ): Promise<AdsConsentStatus> {
    try {
      console.log('[Consent] Requesting consent information...');

      // Configure consent request options
      const consentInfo = await AdsConsent.requestInfoUpdate({
        debugGeography: debugGeography || undefined,
        testDeviceIdentifiers: testDeviceIds || [],
      });

      console.log('[Consent] Consent info:', {
        status: consentInfo.status,
        isConsentFormAvailable: consentInfo.isConsentFormAvailable,
      });

      this.consentStatus = consentInfo.status;

      // Show consent form if required and available
      if (
        consentInfo.isConsentFormAvailable &&
        consentInfo.status === AdsConsentStatus.REQUIRED
      ) {
        console.log('[Consent] Consent form required, showing form...');
        const formResult = await AdsConsent.showForm();
        console.log('[Consent] Form shown, new status:', formResult.status);
        this.consentStatus = formResult.status;
      }

      // Log final consent status
      this.logConsentStatus(this.consentStatus);

      return this.consentStatus;
    } catch (error) {
      console.error('[Consent] Error requesting consent:', error);
      // Default to unknown if there's an error
      this.consentStatus = AdsConsentStatus.UNKNOWN;
      return this.consentStatus;
    }
  }

  /**
   * Get current consent status
   * @returns Current consent status
   */
  getConsentStatus(): AdsConsentStatus {
    return this.consentStatus;
  }

  /**
   * Check if user has given consent for personalized ads
   * @returns true if user can receive personalized ads
   */
  canShowPersonalizedAds(): boolean {
    return this.consentStatus === AdsConsentStatus.OBTAINED;
  }

  /**
   * Check if we should request non-personalized ads only
   * @returns true if we should request non-personalized ads
   */
  shouldRequestNonPersonalizedAds(): boolean {
    // Request non-personalized ads if:
    // - Consent was not obtained
    // - Status is unknown
    // - User is not required to give consent but hasn't obtained it
    return (
      this.consentStatus === AdsConsentStatus.NOT_REQUIRED ||
      this.consentStatus === AdsConsentStatus.UNKNOWN
    );
  }

  /**
   * Reset consent information - useful for testing or privacy settings
   * This will clear the user's consent choice and show the form again on next request
   */
  async resetConsent(): Promise<void> {
    try {
      console.log('[Consent] Resetting consent...');
      await AdsConsent.reset();
      this.consentStatus = AdsConsentStatus.UNKNOWN;
      console.log('[Consent] Consent reset successfully');
    } catch (error) {
      console.error('[Consent] Error resetting consent:', error);
      throw error;
    }
  }

  /**
   * Load and show the consent form again (for privacy settings)
   * Allows users to review and change their consent choices
   */
  async showConsentForm(): Promise<AdsConsentStatus> {
    try {
      console.log('[Consent] Loading consent form...');
      
      // First, request updated consent info
      const consentInfo = await AdsConsent.requestInfoUpdate();
      
      if (consentInfo.isConsentFormAvailable) {
        console.log('[Consent] Showing consent form...');
        const formResult = await AdsConsent.showForm();
        this.consentStatus = formResult.status;
        console.log('[Consent] Form completed, new status:', formResult.status);
        return this.consentStatus;
      } else {
        console.log('[Consent] Consent form not available');
        return this.consentStatus;
      }
    } catch (error) {
      console.error('[Consent] Error showing consent form:', error);
      throw error;
    }
  }

  /**
   * Log consent status in a human-readable format
   */
  private logConsentStatus(status: AdsConsentStatus): void {
    const statusMap: Record<AdsConsentStatus, string> = {
      [AdsConsentStatus.OBTAINED]: 'OBTAINED - User has given consent for personalized ads',
      [AdsConsentStatus.NOT_REQUIRED]: 'NOT_REQUIRED - User is not in a region requiring consent',
      [AdsConsentStatus.REQUIRED]: 'REQUIRED - User needs to provide consent',
      [AdsConsentStatus.UNKNOWN]: 'UNKNOWN - Consent status not yet determined',
    };

    console.log(`[Consent] Status: ${statusMap[status] || 'Unknown status'}`);
  }

  /**
   * Get test device ID for debugging consent flow
   * Use this in development to test consent forms
   * 
   * @returns Instructions for getting test device ID
   */
  static getTestDeviceIdInstructions(): string {
    return `
To test consent forms in development:

1. Run the app without test device IDs
2. Check the console logs for a message like:
   "Use new ConsentDebugSettings.Builder().addTestDeviceHashedId("33BE2250B43518CCDA7DE426D04EE231")"
3. Add that hashed ID to the testDeviceIds array when calling requestConsent()

Example:
  await consentService.requestConsent(['33BE2250B43518CCDA7DE426D04EE231']);

You can also set debugGeography to test different regions:
- AdsConsentDebugGeography.EEA - Test GDPR (European Economic Area)
- AdsConsentDebugGeography.NOT_EEA - Test non-GDPR regions
    `.trim();
  }
}

export default new ConsentService();
export { AdsConsentStatus, AdsConsentDebugGeography };

