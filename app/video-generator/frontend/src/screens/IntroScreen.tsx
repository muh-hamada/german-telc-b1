import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAppConfig } from '../config/apps';
import './IntroScreen.css';

const IntroScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const appId = searchParams.get('appId') || 'german-a1';
  const appConfig = getAppConfig(appId);

  // Signal to Puppeteer that screen is ready
  useEffect(() => {
    (window as any).screenReady = true;
  }, []);

  return (
    <div className="screen intro-screen">
      <div className="intro-content">
        <div className="logo-container">
          <div className="logo-circle">
            <span className="logo-text">{appConfig.level}</span>
          </div>
        </div>
        <h1 className="intro-title">
          Prepare for your {appConfig.level} {appConfig.language} TELC exam
        </h1>
      </div>
    </div>
  );
};

export default IntroScreen;

