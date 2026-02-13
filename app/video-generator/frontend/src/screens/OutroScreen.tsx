import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAppConfig } from '../config/apps';
import appStoreImage from '../assets/app-store.png';
import googlePlayImage from '../assets/google-play.png';
import './OutroScreen.css';

// Import all logos
import germanA1Logo from '../assets/german-a1-logo.png';
import germanA2Logo from '../assets/german-a2-logo.png';
import germanB1Logo from '../assets/german-b1-logo.png';
import germanB2Logo from '../assets/german-b2-logo.png';

const OutroScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const appId = searchParams.get('appId') || 'german-a1';
  const isCapture = searchParams.get('capture') === 'true';
  const appConfig = getAppConfig(appId);
  
  // Generate logo path based on language and level
  const logoPath = useMemo(() => {
    const key = `${appConfig.language.toLowerCase()}-${appConfig.level.toLowerCase()}`;
    const logoMap: Record<string, string> = {
      'german-a1': germanA1Logo,
      'german-a2': germanA2Logo,
      'german-b1': germanB1Logo,
      'german-b2': germanB2Logo,
    };
    return logoMap[key] || germanA1Logo;
  }, [appConfig.language, appConfig.level]);

  // Signal to Puppeteer that screen is ready
  useEffect(() => {
    if (isCapture) {
      (window as any).seekTo = (timeInMs: number) => {
        return new Promise<void>((resolve) => {
          document.getAnimations().forEach(anim => {
            anim.pause();
            anim.currentTime = timeInMs;
          });
          
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        });
      };
    }
    (window as any).screenReady = true;
  }, [isCapture]);

  return (
    <div className="screen outro-screen">
      <div className="outro-content">
        <div className="logo-container">
          <div className="logo-circle">
            <img src={logoPath} alt={`${appConfig.level} TELC`} className="logo-image" />
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

