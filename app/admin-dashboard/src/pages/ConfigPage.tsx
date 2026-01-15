import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { configService } from '../services/config.service';
import { GlobalConfig, RemoteConfig, DEFAULT_GLOBAL_CONFIG, DEFAULT_REMOTE_CONFIG } from '../types/remote-config.types';
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

  const apps = getAllAppConfigs();

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
    </div>
  );
};

