import React, { useState } from 'react';
import { AppLanguage, AppLevel, getAppConfig } from '../config/apps.config';
import { useAppSelection } from '../contexts/AppSelectionContext';
import { useExamType } from '../contexts/ExamTypeContext';
import { getAvailableAppsForExamType } from '../config/available-apps.config';
import './AppSelectorModal.css';

const AppSelectorModal: React.FC = () => {
  const { showModal, setShowModal, setSelection, selection } = useAppSelection();
  const { examType, getExamTypeName } = useExamType();
  const availableLanguages = getAvailableAppsForExamType(examType);
  
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage | null>(
    selection?.language || null
  );
  const [selectedLevel, setSelectedLevel] = useState<AppLevel | null>(
    selection?.level || null
  );

  if (!showModal) return null;

  const handleLanguageSelect = (language: AppLanguage) => {
    setSelectedLanguage(language);
    setSelectedLevel(null); // Reset level when language changes
  };

  const handleLevelSelect = (level: AppLevel) => {
    setSelectedLevel(level);
  };

  const handleConfirm = () => {
    if (selectedLanguage && selectedLevel) {
      const app = getAppConfig(selectedLanguage, selectedLevel);
      if (app && !app.isAvailable) {
        // Don't close modal for unavailable apps
        return;
      }
      setSelection({ language: selectedLanguage, level: selectedLevel });
    }
  };

  // Check if selected combination is available
  const selectedLanguageConfig = availableLanguages.find(lang => lang.id === selectedLanguage);
  const selectedLevelConfig = selectedLanguageConfig?.availableLevels.find(lvl => lvl.level === selectedLevel);
  const isComingSoon = selectedLanguage && selectedLevel && selectedLevelConfig && !selectedLevelConfig.isAvailable;

  const canConfirm = selectedLanguage && selectedLevel && !isComingSoon;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Welcome to {getExamTypeName()} Exam Prep</h2>
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
                {selectedLanguageConfig.availableLevels.map((levelOption) => (
                  <button
                    key={levelOption.level}
                    className={`selection-card ${selectedLevel === levelOption.level ? 'selected' : ''} ${!levelOption.isAvailable ? 'coming-soon' : ''}`}
                    onClick={() => handleLevelSelect(levelOption.level)}
                  >
                    <span className="card-level">{levelOption.level}</span>
                    <span className="card-sublabel">{levelOption.label}</span>
                    {!levelOption.isAvailable && (
                      <span className="coming-soon-badge">Soon</span>
                    )}
                  </button>
                ))}
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

