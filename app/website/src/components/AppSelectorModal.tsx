import React, { useState } from 'react';
import { AppLanguage, AppLevel, ExamProvider, getAppConfig } from '../config/apps.config';
import { useAppSelection } from '../contexts/AppSelectionContext';
import { useExamType } from '../contexts/ExamTypeContext';
import { getAvailableAppsForExamType } from '../config/available-apps.config';
import './AppSelectorModal.css';

const AppSelectorModal: React.FC = () => {
  const { showModal, setShowModal, setSelection, selection } = useAppSelection();
  const { examType, examProvider, getExamTypeName } = useExamType();
  const availableLanguages = getAvailableAppsForExamType(examType, examProvider);
  
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage | null>(
    selection?.language || null
  );
  const [selectedLevel, setSelectedLevel] = useState<AppLevel | null>(
    selection?.level || null
  );
  const [selectedProvider, setSelectedProvider] = useState<ExamProvider | null>(
    selection?.examProvider || null
  );

  if (!showModal) return null;

  const handleLanguageSelect = (language: AppLanguage) => {
    setSelectedLanguage(language);
    setSelectedLevel(null);
    setSelectedProvider(null);
  };

  const handleLevelSelect = (level: AppLevel, provider?: ExamProvider) => {
    setSelectedLevel(level);
    setSelectedProvider(provider || null);
  };

  const handleConfirm = () => {
    if (selectedLanguage && selectedLevel) {
      const app = getAppConfig(selectedLanguage, selectedLevel, selectedProvider || undefined);
      if (app && !app.isAvailable) {
        return;
      }
      setSelection({ 
        language: selectedLanguage, 
        level: selectedLevel,
        examProvider: selectedProvider || undefined
      });
    }
  };

  const selectedLanguageConfig = availableLanguages.find(lang => lang.id === selectedLanguage);
  
  const selectedLevelConfig = selectedLanguageConfig?.availableLevels.find(
    lvl => lvl.level === selectedLevel && 
    (!selectedProvider || lvl.examProvider === selectedProvider)
  );
  
  const isComingSoon = selectedLanguage && selectedLevel && selectedLevelConfig && !selectedLevelConfig.isAvailable;
  const canConfirm = selectedLanguage && selectedLevel && !isComingSoon;

  const getProviderDisplayName = (provider?: ExamProvider): string => {
    if (!provider) return '';
    return provider.toUpperCase();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Welcome to {examProvider === 'all' ? 'Language' : getExamTypeName()} Exam Prep</h2>
          <p>Select your language and level to get started</p>
        </div>

        <div className="modal-body">
          {/* Language Selection */}
          <div className="selection-section">
            <h3>Choose Language</h3>
            <div className="selection-grid">
              {availableLanguages.map((language) => (
                <button
                  key={language.id}
                  className={`selection-card ${selectedLanguage === language.id ? 'selected' : ''}`}
                  onClick={() => handleLanguageSelect(language.id)}
                >
                  <span className="card-flag">{language.flag}</span>
                  <span className="card-label">{language.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Level Selection */}
          {selectedLanguage && selectedLanguageConfig && (
            <div className="selection-section">
              <h3>Choose Level</h3>
              <div className="selection-grid">
                {selectedLanguageConfig.availableLevels.map((levelOption, index) => {
                  const key = `${levelOption.level}-${levelOption.examProvider || 'default'}-${index}`;
                  const isSelected = selectedLevel === levelOption.level && 
                    (examProvider !== 'all' || selectedProvider === levelOption.examProvider);
                  
                  return (
                    <button
                      key={key}
                      className={`selection-card ${isSelected ? 'selected' : ''} ${!levelOption.isAvailable ? 'coming-soon' : ''}`}
                      onClick={() => handleLevelSelect(levelOption.level, levelOption.examProvider)}
                    >
                      <span className="card-level">{levelOption.level}</span>
                      <span className="card-sublabel">{levelOption.label}</span>
                      {levelOption.examProvider && examProvider === 'all' && (
                        <span className="card-provider">{getProviderDisplayName(levelOption.examProvider)}</span>
                      )}
                      {!levelOption.isAvailable && (
                        <span className="coming-soon-badge">Soon</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Coming Soon Message */}
          {isComingSoon && (
            <div className="coming-soon-message">
              <span className="coming-soon-icon">🚀</span>
              <h4>Coming Soon!</h4>
              <p>
                {selectedLanguageConfig?.label} {selectedLevel} app is currently in development.
                <br />
                Please select another combination or check back later!
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className={`confirm-button ${canConfirm ? '' : 'disabled'}`}
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {isComingSoon ? 'Not Available Yet' : 'Get Started'}
          </button>
          {selection && (
            <button 
              className="cancel-button" 
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppSelectorModal;

