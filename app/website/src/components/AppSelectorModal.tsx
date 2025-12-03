import React, { useState } from 'react';
import { AppLanguage, AppLevel, getAppConfig } from '../config/apps.config';
import { useAppSelection } from '../contexts/AppSelectionContext';
import './AppSelectorModal.css';

const AppSelectorModal: React.FC = () => {
  const { showModal, setShowModal, setSelection, selection } = useAppSelection();
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

  const isComingSoon = selectedLanguage && selectedLevel && 
    !getAppConfig(selectedLanguage, selectedLevel)?.isAvailable;

  const canConfirm = selectedLanguage && selectedLevel && !isComingSoon;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Welcome to TELC Exam Prep</h2>
          <p>Select your language and level to get started</p>
        </div>

        <div className="modal-body">
          {/* Language Selection */}
          <div className="selection-section">
            <h3>Choose Language</h3>
            <div className="selection-grid">
              <button
                className={`selection-card ${selectedLanguage === 'german' ? 'selected' : ''}`}
                onClick={() => handleLanguageSelect('german')}
              >
                <span className="card-flag">🇩🇪</span>
                <span className="card-label">German</span>
              </button>
              <button
                className={`selection-card ${selectedLanguage === 'english' ? 'selected' : ''}`}
                onClick={() => handleLanguageSelect('english')}
              >
                <span className="card-flag">🇬🇧</span>
                <span className="card-label">English</span>
              </button>
            </div>
          </div>

          {/* Level Selection */}
          {selectedLanguage && (
            <div className="selection-section">
              <h3>Choose Level</h3>
              <div className="selection-grid">
                <button
                  className={`selection-card ${selectedLevel === 'B1' ? 'selected' : ''}`}
                  onClick={() => handleLevelSelect('B1')}
                >
                  <span className="card-level">B1</span>
                  <span className="card-sublabel">Intermediate</span>
                </button>
                <button
                  className={`selection-card ${selectedLevel === 'B2' ? 'selected' : ''}`}
                  onClick={() => handleLevelSelect('B2')}
                >
                  <span className="card-level">B2</span>
                  <span className="card-sublabel">Upper Intermediate</span>
                </button>
              </div>
            </div>
          )}

          {/* Coming Soon Message */}
          {isComingSoon && (
            <div className="coming-soon-message">
              <span className="coming-soon-icon">🚀</span>
              <h4>Coming Soon!</h4>
              <p>
                {selectedLanguage === 'english' ? 'English' : 'German'} {selectedLevel} app is currently in development.
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

