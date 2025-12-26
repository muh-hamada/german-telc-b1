import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAppConfig } from '../config/apps';
import logoImage from '../assets/logo.jpg';
import './IntroScreen.css';

const IntroScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const appId = searchParams.get('appId') || 'german-a1';
  const isCapture = searchParams.get('capture') === 'true';
  const appConfig = getAppConfig(appId);

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
            <img src={logoImage} alt={`${appConfig.level} TELC`} className="logo-image" />
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
