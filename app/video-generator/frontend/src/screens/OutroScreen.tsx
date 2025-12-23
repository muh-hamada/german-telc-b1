import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAppConfig } from '../config/apps';
import './OutroScreen.css';

const OutroScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const appId = searchParams.get('appId') || 'german-a1';
  const appConfig = getAppConfig(appId);

  // Signal to Puppeteer that screen is ready
  useEffect(() => {
    (window as any).screenReady = true;
  }, []);

  return (
    <div className="screen outro-screen">
      <div className="outro-content">
        <div className="logo-container">
          <div className="logo-circle">
            <span className="logo-text">{appConfig.level}</span>
          </div>
        </div>
        
        <h2 className="app-name">{appConfig.displayName}</h2>
        
        <div className="cta-container">
          <h3 className="cta-text">Download our app for more questions</h3>
          <div className="store-badges">
            <div className="badge-placeholder">
              <span>📱 App Store</span>
            </div>
            <div className="badge-placeholder">
              <span>📱 Google Play</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutroScreen;

