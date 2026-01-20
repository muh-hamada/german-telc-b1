import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAppConfig } from '../config/apps';
import './IntroScreen.css';

// Import all logos
import germanA1Logo from '../assets/german-a1-logo.png';
import germanB1Logo from '../assets/german-b1-logo.png';
import germanB2Logo from '../assets/german-b2-logo.png';

const IntroScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const appId = searchParams.get('appId') || 'german-a1';
  const isCapture = searchParams.get('capture') === 'true';
  const appConfig = getAppConfig(appId);
  
  // Generate logo path based on language and level
  const logoPath = useMemo(() => {
    const key = `${appConfig.language.toLowerCase()}-${appConfig.level.toLowerCase()}`;
    const logoMap: Record<string, string> = {
      'german-a1': germanA1Logo,
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
    <div className="screen intro-screen">
      <div className="intro-content">
        <div className="logo-container">
          <div className="logo-circle">
            <img src={logoPath} alt={`${appConfig.level} TELC`} className="logo-image" />
          </div>
        </div>
        <h1 className="intro-title text-title">
          Prepare for your {appConfig.level} {appConfig.language} TELC exam
        </h1>

        <p className="intro-description text-body-large">
          Answer practice questions to test your knowledge and improve your skills.
        </p>
      </div>
    </div>
  );
};

export default IntroScreen;
