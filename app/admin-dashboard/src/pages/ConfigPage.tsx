import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { configService } from '../services/config.service';
import {
  GlobalConfig,
  RemoteConfig,
  CrossAppPromotionEntry,
  DEFAULT_GLOBAL_CONFIG,
  DEFAULT_REMOTE_CONFIG,
  DEFAULT_CROSS_APP_PROMOTION_APP_CONFIG,
} from '../types/remote-config.types';
import { getAllAppConfigs } from '../config/apps.config';
import { toast } from 'react-toastify';
import './ConfigPage.css';

type ConfigTab = 'global' | 'app';

const APP_DISPLAY_NAMES: { [key: string]: string } = {
  'german-a1': 'German A1',
  'german-b1': 'German B1',
  'german-b2': 'German B2',
  'english-b1': 'English B1',
  'english-b2': 'English B2',
  'dele-spanish-b1': 'DELE Spanish B1',
};

export const ConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('global');
  const [selectedAppId, setSelectedAppId] = useState<string>('german-b1');
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>(DEFAULT_GLOBAL_CONFIG);
  const [appConfigs, setAppConfigs] = useState<Record<string, RemoteConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Cross-app promotion modal state
  const [showAddAppModal, setShowAddAppModal] = useState(false);
  const [addAppPlatform, setAddAppPlatform] = useState<'ios' | 'android'>('ios');
  const [addAppStoreUrl, setAddAppStoreUrl] = useState('');
  const [addAppIconUrl, setAddAppIconUrl] = useState('');
  const [addAppTitle, setAddAppTitle] = useState('');
  const [addAppSubtitle, setAddAppSubtitle] = useState('');
  const [fetchingAppInfo, setFetchingAppInfo] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [editingApp, setEditingApp] = useState<{ platform: 'ios' | 'android'; index: number } | null>(null);
  const [editAppTitle, setEditAppTitle] = useState('');
  const [editAppSubtitle, setEditAppSubtitle] = useState('');

  const apps = getAllAppConfigs();

  /** Extract app ID from a store URL */
  const extractAppIdFromUrl = (url: string): string => {
    // iOS App Store: https://apps.apple.com/.../id123456789
    const iosMatch = url.match(/\/id(\d+)/);
    if (iosMatch) return `id${iosMatch[1]}`;

    // Google Play: https://play.google.com/store/apps/details?id=com.example.app
    const androidMatch = url.match(/[?&]id=([^&]+)/);
    if (androidMatch) return androidMatch[1];

    return '';
  };

  const FUNCTIONS_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:5001/telc-b1-german/us-central1'
    : 'https://us-central1-telc-b1-german.cloudfunctions.net';

  /** Fetch app metadata from store URL via Cloud Function */
  const fetchAppInfoFromUrl = async (url: string, platform: 'ios' | 'android') => {
    setFetchingAppInfo(true);
    setFetchError('');
    setAddAppIconUrl('');
    setAddAppTitle('');
    setAddAppSubtitle('');

    try {
      const params = new URLSearchParams({ platform, storeUrl: url });
      const response = await fetch(`${FUNCTIONS_BASE_URL}/fetchAppStoreInfo?${params}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setFetchError(data.error || 'App not found');
        return;
      }

      setAddAppTitle(data.title);
      setAddAppSubtitle(data.subtitle);
      setAddAppIconUrl(data.iconUrl);
    } catch (error: any) {
      console.error('Error fetching app info:', error);
      setFetchError(error.message || 'Failed to fetch app information');
    } finally {
      setFetchingAppInfo(false);
    }
  };

  /** Reset add app modal fields */
  const resetAddAppModal = () => {
    setAddAppStoreUrl('');
    setAddAppIconUrl('');
    setAddAppTitle('');
    setAddAppSubtitle('');
    setFetchingAppInfo(false);
    setFetchError('');
    setShowAddAppModal(false);
  };

  /** Handle adding a new app to the global promo list */
  const handleAddPromoApp = () => {
    const appId = extractAppIdFromUrl(addAppStoreUrl);
    if (!appId) {
      toast.error('Could not extract app ID from the provided URL');
      return;
    }
    if (!addAppStoreUrl || !addAppIconUrl || !addAppTitle) {
      toast.error('Please fill in all required fields (URL, Icon URL, Title)');
      return;
    }

    const currentPromo = globalConfig.crossAppPromotion || { ios: [], android: [] };
    const platformList = [...(currentPromo[addAppPlatform] || [])];

    // Check for duplicates
    if (platformList.some(app => app.appId === appId)) {
      toast.error(`An app with ID "${appId}" already exists in the ${addAppPlatform.toUpperCase()} list`);
      return;
    }

    const newEntry: CrossAppPromotionEntry = {
      appId,
      storeUrl: addAppStoreUrl,
      iconUrl: addAppIconUrl,
      title: addAppTitle,
      subtitle: addAppSubtitle,
    };

    platformList.push(newEntry);
    updateGlobalConfig({
      crossAppPromotion: {
        ...currentPromo,
        [addAppPlatform]: platformList,
      },
    });

    resetAddAppModal();
    toast.success(`App "${addAppTitle}" added to ${addAppPlatform.toUpperCase()} list`);
  };

  /** Handle deleting a promo app */
  const handleDeletePromoApp = (platform: 'ios' | 'android', index: number) => {
    const currentPromo = globalConfig.crossAppPromotion || { ios: [], android: [] };
    const platformList = [...(currentPromo[platform] || [])];
    const appName = platformList[index]?.title || 'this app';

    openConfirmModal(
      'Delete App',
      `Are you sure you want to delete "${appName}" from the ${platform.toUpperCase()} list?`,
      () => {
        platformList.splice(index, 1);
        updateGlobalConfig({
          crossAppPromotion: {
            ...currentPromo,
            [platform]: platformList,
          },
        });
        toast.success(`App "${appName}" removed`);
      }
    );
  };

  /** Start editing a promo app */
  const startEditPromoApp = (platform: 'ios' | 'android', index: number) => {
    const currentPromo = globalConfig.crossAppPromotion || { ios: [], android: [] };
    const app = currentPromo[platform]?.[index];
    if (app) {
      setEditingApp({ platform, index });
      setEditAppTitle(app.title);
      setEditAppSubtitle(app.subtitle);
    }
  };

  /** Save edits to a promo app (title and subtitle only) */
  const handleSaveEditPromoApp = () => {
    if (!editingApp) return;
    const { platform, index } = editingApp;

    const currentPromo = globalConfig.crossAppPromotion || { ios: [], android: [] };
    const platformList = [...(currentPromo[platform] || [])];

    if (platformList[index]) {
      platformList[index] = {
        ...platformList[index],
        title: editAppTitle,
        subtitle: editAppSubtitle,
      };
      updateGlobalConfig({
        crossAppPromotion: {
          ...currentPromo,
          [platform]: platformList,
        },
      });
      toast.success('App updated');
    }
    setEditingApp(null);
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const openConfirmModal = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModalConfig({ title, message, onConfirm });
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmModalConfig(null);
  };

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const [global, allAppConfigs] = await Promise.all([
        configService.getGlobalConfig(),
        configService.getAllAppConfigs(),
      ]);

      // Ensure global config has all required fields with defaults
      const fullGlobalConfig: GlobalConfig = {
        ...DEFAULT_GLOBAL_CONFIG,
        ...global,
        // Ensure onboardingImages is always an array
        onboardingImages: global?.onboardingImages || DEFAULT_GLOBAL_CONFIG.onboardingImages,
        // Ensure crossAppPromotion is always defined
        crossAppPromotion: global?.crossAppPromotion || DEFAULT_GLOBAL_CONFIG.crossAppPromotion,
      };

      setGlobalConfig(fullGlobalConfig);
      setAppConfigs(allAppConfigs);
    } catch (error: any) {
      console.error('Error loading configs:', error);
      toast.error(error.message || 'Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGlobalConfig = async () => {
    try {
      setSaving(true);
      await configService.saveGlobalConfig(globalConfig);
      toast.success('Global configuration saved successfully!');
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error saving global config:', error);
      toast.error(error.message || 'Failed to save global configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAppConfig = async (applyToAll: boolean = false) => {
    try {
      setSaving(true);
      const currentConfig = appConfigs[selectedAppId];

      if (!currentConfig) {
        throw new Error('No configuration found for selected app');
      }

      if (applyToAll) {
        const allAppIds = Object.keys(appConfigs);
        await configService.applyConfigToMultipleApps(allAppIds, currentConfig);
        
        // Update local state for all apps
        const updatedConfigs = { ...appConfigs };
        allAppIds.forEach(appId => {
          updatedConfigs[appId] = {
            ...currentConfig,
            appId,
            updatedAt: Date.now(),
          };
        });
        setAppConfigs(updatedConfigs);
        toast.success(`Configuration applied to all ${allAppIds.length} apps!`);
      } else {
        await configService.saveAppConfig(selectedAppId, currentConfig);
        toast.success(`Configuration saved for ${APP_DISPLAY_NAMES[selectedAppId]}!`);
      }

      setHasChanges(false);
    } catch (error: any) {
      console.error('Error saving app config:', error);
      toast.error(error.message || 'Failed to save app configuration');
    } finally {
      setSaving(false);
    }
  };

  const confirmApplyToAll = () => {
    openConfirmModal(
      'Apply to All Apps',
      'Are you sure you want to apply these changes to ALL apps? This will overwrite their current configurations.',
      () => handleSaveAppConfig(true)
    );
  };

  const updateGlobalConfig = (updates: Partial<GlobalConfig>) => {
    setGlobalConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateAppConfig = (updates: Partial<RemoteConfig>) => {
    setAppConfigs(prev => ({
      ...prev,
      [selectedAppId]: {
        ...(prev[selectedAppId] || { ...DEFAULT_REMOTE_CONFIG, appId: selectedAppId }),
        ...updates,
      },
    }));
    setHasChanges(true);
  };

  // Ensure we always have a valid config with all required fields
  const currentAppConfig: RemoteConfig = appConfigs[selectedAppId] 
    ? {
        ...DEFAULT_REMOTE_CONFIG,
        ...appConfigs[selectedAppId],
        // Ensure arrays are always defined
        streaksWhitelistedUserIDs: appConfigs[selectedAppId].streaksWhitelistedUserIDs || [],
        // Ensure premiumOffer is always defined
        premiumOffer: appConfigs[selectedAppId].premiumOffer || DEFAULT_REMOTE_CONFIG.premiumOffer,
        // Ensure dataVersion is always defined
        dataVersion: appConfigs[selectedAppId].dataVersion ?? DEFAULT_REMOTE_CONFIG.dataVersion,
        // Ensure crossAppPromotion is always defined
        crossAppPromotion: appConfigs[selectedAppId].crossAppPromotion || DEFAULT_CROSS_APP_PROMOTION_APP_CONFIG,
      }
    : { 
        ...DEFAULT_REMOTE_CONFIG, 
        appId: selectedAppId,
        streaksWhitelistedUserIDs: [],
      };

  if (loading) {
    return (
      <div className="config-container">
        <div className="config-header">
          <h1>App Configuration</h1>
        </div>
        <div className="config-loading">
          <div className="loading-spinner"></div>
          <p>Loading configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="config-container">
      <div className="config-header">
        <div>
          <div className="breadcrumb">
            <Link to="/apps" className="breadcrumb-link">← All Apps</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Configuration</span>
          </div>
          <h1>App Configuration</h1>
          <p className="config-subtitle">Manage global and per-app configurations</p>
        </div>
      </div>

      <div className="config-content">
        {/* Tab Navigation */}
        <div className="config-tabs">
          <button
            className={`config-tab ${activeTab === 'global' ? 'active' : ''}`}
            onClick={() => {
              if (hasChanges) {
                openConfirmModal(
                  'Unsaved Changes',
                  'You have unsaved changes. Discard them?',
                  () => {
                    setActiveTab('global');
                    setHasChanges(false);
                  }
                );
              } else {
                setActiveTab('global');
              }
            }}
          >
            🌍 Global Configuration
          </button>
          <button
            className={`config-tab ${activeTab === 'app' ? 'active' : ''}`}
            onClick={() => {
              if (hasChanges) {
                openConfirmModal(
                  'Unsaved Changes',
                  'You have unsaved changes. Discard them?',
                  () => {
                    setActiveTab('app');
                    setHasChanges(false);
                  }
                );
              } else {
                setActiveTab('app');
              }
            }}
          >
            📱 App-Specific Configuration
          </button>
        </div>

        {/* Global Config Form */}
        {activeTab === 'global' && (
          <div className="config-section">
            <div className="config-form">
              <div className="config-form-header">
                <h2>Global Configuration</h2>
                <p>These settings apply to all apps</p>
              </div>

              <div className="config-group">
                <h3>Support Ad Intervals</h3>
                <p className="config-group-description">
                  Configure how often support ads should be shown in different screens
                </p>

                <div className="config-field">
                  <label htmlFor="grammarStudyInterval">
                    Grammar Study Interval
                    <span className="field-hint">Show ad after every N grammar questions</span>
                  </label>
                  <input
                    id="grammarStudyInterval"
                    type="number"
                    min="1"
                    value={globalConfig.supportAdIntervals.grammarStudy}
                    onChange={(e) => updateGlobalConfig({
                      supportAdIntervals: {
                        ...globalConfig.supportAdIntervals,
                        grammarStudy: parseInt(e.target.value) || 1,
                      },
                    })}
                    className="config-input"
                  />
                </div>

                <div className="config-field">
                  <label htmlFor="vocabularyStudyInterval">
                    Vocabulary Study Interval
                    <span className="field-hint">Show ad after every N vocabulary items</span>
                  </label>
                  <input
                    id="vocabularyStudyInterval"
                    type="number"
                    min="1"
                    value={globalConfig.supportAdIntervals.vocabularyStudy}
                    onChange={(e) => updateGlobalConfig({
                      supportAdIntervals: {
                        ...globalConfig.supportAdIntervals,
                        vocabularyStudy: parseInt(e.target.value) || 1,
                      },
                    })}
                    className="config-input"
                  />
                </div>
              </div>

              <div className="config-group">
                <h3>Onboarding Images</h3>
                <p className="config-group-description">
                  Configure the 5 images shown in the onboarding flow (Firebase Storage URLs)
                </p>

                {[0, 1, 2, 3, 4].map((index) => (
                  <div className="config-field" key={index}>
                    <label htmlFor={`onboardingImage${index}`}>
                      Step {index + 1} Image URL
                      <span className="field-hint">Firebase Storage URL for onboarding step {index + 1}</span>
                    </label>
                    <input
                      id={`onboardingImage${index}`}
                      type="text"
                      value={globalConfig.onboardingImages?.[index] || ''}
                      onChange={(e) => {
                        const newImages = [...(globalConfig.onboardingImages || [])];
                        newImages[index] = e.target.value;
                        updateGlobalConfig({ onboardingImages: newImages });
                      }}
                      className="config-input"
                      placeholder="https://firebasestorage.googleapis.com/..."
                    />
                  </div>
                ))}
              </div>

              <div className="config-group">
                <h3>iOS Settings</h3>
                <p className="config-group-description">
                  Platform-specific settings for iOS apps
                </p>

                <div className="config-field-checkbox">
                  <input
                    id="removeTelcFromText_iOS"
                    type="checkbox"
                    checked={globalConfig.removeTelcFromText_iOS ?? true}
                    onChange={(e) => updateGlobalConfig({ removeTelcFromText_iOS: e.target.checked })}
                  />
                  <label htmlFor="removeTelcFromText_iOS">
                    Remove "Telc" from Text on iOS
                    <span className="field-hint">Automatically remove "Telc" references from all translations on iOS</span>
                  </label>
                </div>
              </div>

              {/* Cross-App Promotion Directory */}
              <div className="config-group">
                <h3>Cross-App Promotion - App Directory</h3>
                <p className="config-group-description">
                  Manage the list of apps shown in cross-app promotion modals. Each platform (iOS/Android) has its own list.
                </p>

                {(['ios', 'android'] as const).map((platform) => {
                  const platformApps = globalConfig.crossAppPromotion?.[platform] || [];
                  return (
                    <div key={platform} className="promo-platform-section">
                      <div className="promo-platform-header">
                        <h4>{platform === 'ios' ? 'iOS Apps' : 'Android Apps'} ({platformApps.length})</h4>
                        <button
                          type="button"
                          className="btn-add-promo-app"
                          onClick={() => {
                            setAddAppPlatform(platform);
                            setShowAddAppModal(true);
                          }}
                        >
                          + Add App
                        </button>
                      </div>

                      {platformApps.length === 0 ? (
                        <p className="promo-empty-message">No apps configured for {platform.toUpperCase()}</p>
                      ) : (
                        <div className="promo-app-list">
                          {platformApps.map((app, index) => (
                            <div key={app.appId} className="promo-app-item">
                              {editingApp?.platform === platform && editingApp?.index === index ? (
                                <div className="promo-app-edit-form">
                                  <img src={app.iconUrl} alt={app.title} className="promo-app-icon" />
                                  <div className="promo-app-edit-fields">
                                    <input
                                      type="text"
                                      value={editAppTitle}
                                      onChange={(e) => setEditAppTitle(e.target.value)}
                                      className="config-input"
                                      placeholder="App Title"
                                    />
                                    <input
                                      type="text"
                                      value={editAppSubtitle}
                                      onChange={(e) => setEditAppSubtitle(e.target.value)}
                                      className="config-input"
                                      placeholder="App Subtitle"
                                    />
                                    <div className="promo-app-edit-actions">
                                      <button type="button" className="btn-promo-save" onClick={handleSaveEditPromoApp}>Save</button>
                                      <button type="button" className="btn-promo-cancel" onClick={() => setEditingApp(null)}>Cancel</button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <img src={app.iconUrl} alt={app.title} className="promo-app-icon" />
                                  <div className="promo-app-info">
                                    <span className="promo-app-title">{app.title}</span>
                                    <span className="promo-app-subtitle">{app.subtitle}</span>
                                    <span className="promo-app-id">ID: {app.appId}</span>
                                  </div>
                                  <div className="promo-app-actions">
                                    <button type="button" className="btn-promo-edit" onClick={() => startEditPromoApp(platform, index)}>Edit</button>
                                    <button type="button" className="btn-promo-delete" onClick={() => handleDeletePromoApp(platform, index)}>Delete</button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="config-actions">
                <button
                  onClick={handleSaveGlobalConfig}
                  disabled={saving || !hasChanges}
                  className="btn-save-primary"
                >
                  {saving ? 'Saving...' : 'Save Global Configuration'}
                </button>
                {hasChanges && (
                  <button
                    onClick={() => {
                      loadConfigs();
                      setHasChanges(false);
                    }}
                    className="btn-cancel"
                  >
                    Discard Changes
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* App-Specific Config Form */}
        {activeTab === 'app' && (
          <div className="config-section">
            {/* App Selector */}
            <div className="app-selector-section">
              <h3>Select App</h3>
              <div className="app-selector-grid">
                {apps.map((app) => (
                  <button
                    key={app.id}
                    className={`app-selector-card ${selectedAppId === app.id ? 'selected' : ''}`}
                    onClick={() => {
                      if (hasChanges) {
                        openConfirmModal(
                          'Unsaved Changes',
                          'You have unsaved changes. Discard them?',
                          () => {
                            setSelectedAppId(app.id);
                            setHasChanges(false);
                          }
                        );
                      } else {
                        setSelectedAppId(app.id);
                      }
                    }}
                  >
                    <div className="app-selector-name">{app.displayName}</div>
                    <div className="app-selector-id">{app.id}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* App Config Form */}
            <div className="config-form">
              <div className="config-form-header">
                <h2>{APP_DISPLAY_NAMES[selectedAppId]} Configuration</h2>
                <p>App-specific settings for {selectedAppId}</p>
              </div>

              {/* Data Cache Version */}
              <div className="config-group">
                <h3>📦 Data Cache Version</h3>
                <p className="config-group-description">
                  Increment this number when you update exam data (questions, content) to force users to refresh their cached data.
                  Users' app will automatically clear their local cache and fetch fresh data when this version increases.
                </p>

                <div className="config-field">
                  <label htmlFor="dataVersion">
                    Data Version
                    <span className="field-hint">Current: {currentAppConfig.dataVersion ?? 1}. Increment when exam data changes.</span>
                  </label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      id="dataVersion"
                      type="number"
                      min="1"
                      value={currentAppConfig.dataVersion ?? 1}
                      onChange={(e) => updateAppConfig({ dataVersion: parseInt(e.target.value) || 1 })}
                      className="config-input"
                      style={{ width: '120px' }}
                    />
                    <button
                      type="button"
                      onClick={() => updateAppConfig({ dataVersion: (currentAppConfig.dataVersion ?? 1) + 1 })}
                      className="btn-increment"
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      + Increment
                    </button>
                  </div>
                </div>
              </div>

              {/* Version Configuration */}
              <div className="config-group">
                <h3>Version & Updates</h3>
                
                <div className="config-field">
                  <label htmlFor="minRequiredVersion">
                    Minimum Required Version
                    <span className="field-hint">Users below this version will be forced to update</span>
                  </label>
                  <input
                    id="minRequiredVersion"
                    type="text"
                    value={currentAppConfig.minRequiredVersion}
                    onChange={(e) => updateAppConfig({ minRequiredVersion: e.target.value })}
                    className="config-input"
                    placeholder="1.0.0"
                  />
                </div>

                <div className="config-field">
                  <label htmlFor="latestVersion">
                    Latest Version
                    <span className="field-hint">The current latest version available</span>
                  </label>
                  <input
                    id="latestVersion"
                    type="text"
                    value={currentAppConfig.latestVersion}
                    onChange={(e) => updateAppConfig({ latestVersion: e.target.value })}
                    className="config-input"
                    placeholder="1.0.0"
                  />
                </div>

                <div className="config-field-checkbox">
                  <input
                    id="forceUpdate"
                    type="checkbox"
                    checked={currentAppConfig.forceUpdate}
                    onChange={(e) => updateAppConfig({ forceUpdate: e.target.checked })}
                  />
                  <label htmlFor="forceUpdate">
                    Force Update
                    <span className="field-hint">Force users to update to the latest version</span>
                  </label>
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="config-group">
                <h3>Feature Toggles</h3>

                <div className="config-field-checkbox">
                  <input
                    id="enablePremiumFeatures"
                    type="checkbox"
                    checked={currentAppConfig.enablePremiumFeatures}
                    onChange={(e) => updateAppConfig({ enablePremiumFeatures: e.target.checked })}
                  />
                  <label htmlFor="enablePremiumFeatures">
                    Enable Premium Features
                    <span className="field-hint">Show premium UI and modals to users</span>
                  </label>
                </div>

                <div className="config-field-checkbox">
                  <input
                    id="enableStreaksForAllUsers"
                    type="checkbox"
                    checked={currentAppConfig.enableStreaksForAllUsers}
                    onChange={(e) => updateAppConfig({ enableStreaksForAllUsers: e.target.checked })}
                  />
                  <label htmlFor="enableStreaksForAllUsers">
                    Enable Streaks for All Users
                    <span className="field-hint">Enable streak functionality for all users</span>
                  </label>
                </div>

                <div className="config-field-checkbox">
                  <input
                    id="enableVocabularyNativeAd"
                    type="checkbox"
                    checked={currentAppConfig.enableVocabularyNativeAd}
                    onChange={(e) => updateAppConfig({ enableVocabularyNativeAd: e.target.checked })}
                  />
                  <label htmlFor="enableVocabularyNativeAd">
                    Enable Vocabulary Native Ads
                    <span className="field-hint">Show native ads in vocabulary study</span>
                  </label>
                </div>
              </div>

              {/* Vocabulary Native Ad Config */}
              <div className="config-group">
                <h3>Vocabulary Native Ad Settings</h3>

                <div className="config-field">
                  <label htmlFor="vocabularyNativeAdInterval">
                    Ad Interval
                    <span className="field-hint">Show ad after every N vocabulary words</span>
                  </label>
                  <input
                    id="vocabularyNativeAdInterval"
                    type="number"
                    min="1"
                    value={currentAppConfig.vocabularyNativeAdInterval}
                    onChange={(e) => updateAppConfig({ vocabularyNativeAdInterval: parseInt(e.target.value) || 1 })}
                    className="config-input"
                  />
                </div>
              </div>

              {/* Premium Offer Configuration */}
              <div className="config-group">
                <h3>Premium Offer</h3>
                <p className="config-group-description">
                  Configure promotional pricing for premium purchases. Manually reduce the store price on iOS/Android, 
                  then activate the offer here to show the original price with strikethrough.
                </p>

                <div className="config-field-checkbox">
                  <input
                    id="premiumOfferActive"
                    type="checkbox"
                    checked={currentAppConfig.premiumOffer?.isActive || false}
                    onChange={(e) => updateAppConfig({
                      premiumOffer: {
                        ...currentAppConfig.premiumOffer,
                        isActive: e.target.checked,
                      }
                    })}
                  />
                  <label htmlFor="premiumOfferActive">
                    Offer Active
                    <span className="field-hint">Enable to show offer badge and original price with strikethrough</span>
                  </label>
                </div>

                <div className="config-field">
                  <label htmlFor="discountPercentage">
                    Discount Percentage
                    <span className="field-hint">
                      The app will calculate the original price based on this percentage. 
                      Example: If store price is $3.74 and discount is 25%, original will be calculated as $4.99
                    </span>
                  </label>
                  <input
                    id="discountPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={currentAppConfig.premiumOffer?.discountPercentage || 0}
                    onChange={(e) => updateAppConfig({
                      premiumOffer: {
                        ...currentAppConfig.premiumOffer,
                        discountPercentage: parseInt(e.target.value) || 0,
                      }
                    })}
                    className="config-input"
                    placeholder="e.g., 25 for 25% off"
                  />
                </div>
              </div>

              {/* Streak Whitelist */}
              <div className="config-group">
                <h3>Streak Whitelist</h3>
                <p className="config-group-description">
                  User IDs with special streak access (one per line)
                </p>

                <div className="config-field">
                  <textarea
                    value={(currentAppConfig.streaksWhitelistedUserIDs || []).join('\n')}
                    onChange={(e) => updateAppConfig({
                      streaksWhitelistedUserIDs: e.target.value
                        .split('\n')
                        .map(id => id.trim())
                        .filter(id => id.length > 0),
                    })}
                    className="config-textarea"
                    rows={5}
                    placeholder="user-id-1&#10;user-id-2&#10;user-id-3"
                  />
                </div>
              </div>

              {/* Cross-App Promotion */}
              <div className="config-group">
                <h3>Cross-App Promotion</h3>
                <p className="config-group-description">
                  Select which apps to promote in this app's cross-promotion modal.
                  Configured separately for iOS and Android since app IDs differ per platform.
                  Choose 1 hero app and 4 additional apps for each platform.
                </p>

                {(['ios', 'android'] as const).map((platform) => {
                  const platformLabel = platform === 'ios' ? 'iOS' : 'Android';
                  const platformApps = globalConfig.crossAppPromotion?.[platform] || [];
                  const currentPromoConfig = currentAppConfig.crossAppPromotion || DEFAULT_CROSS_APP_PROMOTION_APP_CONFIG;
                  const platformSelection = currentPromoConfig[platform] || { heroAppId: '', additionalAppIds: [] };
                  const selectedHero = platformSelection.heroAppId || '';
                  const selectedAdditional = platformSelection.additionalAppIds || [];

                  return (
                    <div key={platform} className="promo-platform-config-section">
                      <h4 className="promo-platform-config-title">{platformLabel}</h4>

                      {platformApps.length === 0 ? (
                        <p className="promo-empty-message">
                          No {platformLabel} apps in the global directory yet. Add apps in the Global Configuration tab first.
                        </p>
                      ) : (
                        <>
                          <div className="config-field">
                            <label htmlFor={`promoHeroApp-${platform}`}>
                              Hero App
                              <span className="field-hint">The featured app shown prominently at the top</span>
                            </label>
                            <select
                              id={`promoHeroApp-${platform}`}
                              value={selectedHero}
                              onChange={(e) => {
                                const newHero = e.target.value;
                                const newAdditional = selectedAdditional.filter(id => id !== newHero);
                                updateAppConfig({
                                  crossAppPromotion: {
                                    ...currentPromoConfig,
                                    [platform]: {
                                      heroAppId: newHero,
                                      additionalAppIds: newAdditional,
                                    },
                                  },
                                });
                              }}
                              className="config-input"
                            >
                              <option value="">-- Select Hero App --</option>
                              {platformApps.map((app) => (
                                <option key={app.appId} value={app.appId}>
                                  {app.title} ({app.appId})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="config-field">
                            <label>
                              Additional Apps (select up to 4)
                              <span className="field-hint">
                                These apps are shown in a 2x2 grid below the hero.
                                Selected: {selectedAdditional.length}/4
                              </span>
                            </label>
                            <div className="promo-additional-grid">
                              {platformApps
                                .filter(app => app.appId !== selectedHero)
                                .map((app) => {
                                  const isSelected = selectedAdditional.includes(app.appId);
                                  return (
                                    <label key={app.appId} className={`promo-additional-option ${isSelected ? 'selected' : ''}`}>
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          let newAdditional: string[];
                                          if (e.target.checked) {
                                            if (selectedAdditional.length >= 4) {
                                              toast.warning('Maximum 4 additional apps allowed');
                                              return;
                                            }
                                            newAdditional = [...selectedAdditional, app.appId];
                                          } else {
                                            newAdditional = selectedAdditional.filter(id => id !== app.appId);
                                          }
                                          updateAppConfig({
                                            crossAppPromotion: {
                                              ...currentPromoConfig,
                                              [platform]: {
                                                heroAppId: selectedHero,
                                                additionalAppIds: newAdditional,
                                              },
                                            },
                                          });
                                        }}
                                      />
                                      <img src={app.iconUrl} alt={app.title} className="promo-option-icon" />
                                      <span className="promo-option-title">{app.title}</span>
                                    </label>
                                  );
                                })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="config-actions">
                <button
                  onClick={() => handleSaveAppConfig(false)}
                  disabled={saving || !hasChanges}
                  className="btn-save-primary"
                >
                  {saving ? 'Saving...' : `Save Configuration for ${APP_DISPLAY_NAMES[selectedAppId]}`}
                </button>
                <button
                  onClick={confirmApplyToAll}
                  disabled={saving || !hasChanges}
                  className="btn-apply-all"
                >
                  Apply to All Apps
                </button>
                {hasChanges && (
                  <button
                    onClick={() => {
                      loadConfigs();
                      setHasChanges(false);
                    }}
                    className="btn-cancel"
                  >
                    Discard Changes
                  </button>
                )}
              </div>

              <div className="config-info">
                <p>
                  <strong>Note:</strong> "Apply to All Apps" will overwrite all app configurations with the current settings.
                  This is useful for applying the same feature flags or version requirements across all apps.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmModalConfig && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{confirmModalConfig.title}</h3>
            </div>
            <div className="modal-body">
              <p>{confirmModalConfig.message}</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-modal-cancel"
                onClick={closeConfirmModal}
              >
                Cancel
              </button>
              <button
                className="btn-modal-confirm"
                onClick={() => {
                  confirmModalConfig.onConfirm();
                  closeConfirmModal();
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Promo App Modal */}
      {showAddAppModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-wide">
            <div className="modal-header">
              <h3>Add App to {addAppPlatform.toUpperCase()} List</h3>
            </div>
            <div className="modal-body">
              <div className="add-app-field">
                <label>Platform</label>
                <select
                  value={addAppPlatform}
                  onChange={(e) => {
                    setAddAppPlatform(e.target.value as 'ios' | 'android');
                    // Reset fetched data when platform changes
                    setAddAppIconUrl('');
                    setAddAppTitle('');
                    setAddAppSubtitle('');
                    setFetchError('');
                  }}
                  className="add-app-input"
                >
                  <option value="ios">iOS (App Store)</option>
                  <option value="android">Android (Google Play)</option>
                </select>
              </div>

              <div className="add-app-field">
                <label>Store URL *</label>
                <div className="add-app-url-row">
                  <input
                    type="text"
                    value={addAppStoreUrl}
                    onChange={(e) => setAddAppStoreUrl(e.target.value)}
                    className="add-app-input"
                    placeholder={addAppPlatform === 'ios'
                      ? 'https://apps.apple.com/app/app-name/id123456789'
                      : 'https://play.google.com/store/apps/details?id=com.example.app'}
                  />
                  <button
                    type="button"
                    className="btn-fetch-info"
                    onClick={() => fetchAppInfoFromUrl(addAppStoreUrl, addAppPlatform)}
                    disabled={!addAppStoreUrl || !extractAppIdFromUrl(addAppStoreUrl) || fetchingAppInfo}
                  >
                    {fetchingAppInfo ? 'Fetching...' : 'Fetch Info'}
                  </button>
                </div>
                {addAppStoreUrl && (
                  <span className="add-app-hint" style={{ color: extractAppIdFromUrl(addAppStoreUrl) ? '#3fb950' : '#f85149' }}>
                    {extractAppIdFromUrl(addAppStoreUrl)
                      ? `Extracted ID: ${extractAppIdFromUrl(addAppStoreUrl)}`
                      : 'Could not extract ID from URL'}
                  </span>
                )}
                {fetchError && (
                  <span className="add-app-hint" style={{ color: '#f85149' }}>{fetchError}</span>
                )}
              </div>

              {/* App preview / fetched data */}
              {(addAppIconUrl || addAppTitle) && (
                <div className="add-app-preview">
                  {addAppIconUrl && (
                    <img src={addAppIconUrl} alt="App icon" className="add-app-preview-icon" />
                  )}
                  <div className="add-app-preview-info">
                    {addAppTitle && <span className="add-app-preview-title">{addAppTitle}</span>}
                    {addAppSubtitle && <span className="add-app-preview-subtitle">{addAppSubtitle}</span>}
                  </div>
                </div>
              )}

              {/* Editable fields for title and subtitle (pre-filled by fetch) */}
              <div className="add-app-field">
                <label>Title *</label>
                <input
                  type="text"
                  value={addAppTitle}
                  onChange={(e) => setAddAppTitle(e.target.value)}
                  className="add-app-input"
                  placeholder="App display name"
                />
              </div>

              <div className="add-app-field">
                <label>Subtitle</label>
                <input
                  type="text"
                  value={addAppSubtitle}
                  onChange={(e) => setAddAppSubtitle(e.target.value)}
                  className="add-app-input"
                  placeholder="Short description shown below the title"
                />
              </div>

              <div className="add-app-field">
                <label>Icon URL *</label>
                <input
                  type="text"
                  value={addAppIconUrl}
                  onChange={(e) => setAddAppIconUrl(e.target.value)}
                  className="add-app-input"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={resetAddAppModal}>
                Cancel
              </button>
              <button
                className="btn-modal-confirm"
                onClick={handleAddPromoApp}
                disabled={!addAppStoreUrl || !addAppIconUrl || !addAppTitle || !extractAppIdFromUrl(addAppStoreUrl)}
              >
                Add App
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

