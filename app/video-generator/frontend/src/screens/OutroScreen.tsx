import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAppConfig } from '../config/apps';
import logoImage from '../assets/logo.jpg';
import appStoreImage from '../assets/app-store.png';
import googlePlayImage from '../assets/google-play.png';
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
            <img src={logoImage} alt={`${appConfig.level} TELC`} className="logo-image" />
          </div>
        </div>
        
        <h2 className="app-name text-display">{appConfig.displayName}</h2>
        
        <div className="cta-container">
          <h3 className="cta-text text-subtitle">Download our app for more practice questions</h3>
          <div className="store-badges">
            <img src={appStoreImage} alt="Download on App Store" className="store-badge" />
            <img src={googlePlayImage} alt="Get it on Google Play" className="store-badge" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutroScreen;

