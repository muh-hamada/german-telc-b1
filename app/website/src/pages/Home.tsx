import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useAppSelection } from '../contexts/AppSelectionContext';
import './Home.css';

const screenshots = [
  '/app-screenshots/1.png',
  '/app-screenshots/2.png',
  '/app-screenshots/3.png',
  '/app-screenshots/4.png',
  '/app-screenshots/5.png',
  '/app-screenshots/6.png',
  '/app-screenshots/7.png',
  '/app-screenshots/8.png',
  '/app-screenshots/9.png',
];

const Home: React.FC = () => {
  const { selectedApp, setShowModal } = useAppSelection();
  
  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    arrows: false,
    pauseOnHover: false,
  };

  // Get store links based on selection
  const androidLink = selectedApp?.storeLinks.android || 'https://play.google.com/store/apps/details?id=com.mhamada.telcb1german';
  const iosLink = selectedApp?.storeLinks.ios || '#';
  const appDisplayName = selectedApp?.displayName || 'TELC Exam';

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Master Your {selectedApp ? (
                <span className="hero-app-name">
                  {selectedApp.flag} {selectedApp.displayName}
                </span>
              ) : 'TELC'} Exam.
            </h1>
            <p className="hero-subtitle">
              Comprehensive exam preparation for all levels and languages.
              Practice reading, writing, listening, and speaking with our specialized apps designed for B1, B2, and more.
            </p>
            
            {selectedApp ? (
              <div className="download-buttons">
                <a
                  href={androidLink}
                  className="download-btn android-btn"
                  aria-label="Download on Google Play"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <div>
                    <span className="btn-label">GET IT ON</span>
                    <span className="btn-store">Google Play</span>
                  </div>
                </a>
                <a
                  href={iosLink}
                  className="download-btn ios-btn"
                  aria-label="Download on App Store"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                  </svg>
                  <div>
                    <span className="btn-label">Download on the</span>
                    <span className="btn-store">App Store</span>
                  </div>
                </a>
              </div>
            ) : (
              <button 
                className="select-app-btn"
                onClick={() => setShowModal(true)}
              >
                Select Your App to Get Started
              </button>
            )}
          </div>
          <div className="hero-image">
            <Slider {...settings}>
              {screenshots.map((src, index) => (
                <div key={index} className="slider-image-container">
                  <img
                    src={src}
                    alt={`App Screenshot ${index + 1}`}
                    className="app-screenshot"
                  />
                </div>
              ))}
            </Slider>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Everything You Need to Succeed</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">📖</div>
              <h3>Reading Comprehension</h3>
              <p>Practice with authentic texts and improve your reading skills with multiple-choice questions and text matching exercises.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✍️</div>
              <h3>Writing Skills</h3>
              <p>Master formal and informal writing with guided practice exercises and AI-powered feedback on your responses.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🎧</div>
              <h3>Listening Practice</h3>
              <p>Enhance your listening comprehension with audio exercises covering various scenarios from the TELC exam.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🗣️</div>
              <h3>Speaking Training</h3>
              <p>Prepare for the oral exam with structured speaking exercises, vocabulary lists, and conversation practice.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📝</div>
              <h3>Grammar Exercises</h3>
              <p>Strengthen your grammar with targeted exercises including gap-fill questions and multiple-choice tests.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <h3>Progress Tracking</h3>
              <p>Monitor your improvement with detailed statistics and track your performance across all exam sections.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about">
        <div className="container">
          <h2 className="section-title">About Our Apps</h2>
          <div className="about-content">
            <p>
              Our TELC Exam Preparation apps are comprehensive tools designed to help you succeed in your language certification journey.
              We offer specialized apps for different levels and languages, providing structured practice for all exam sections including reading,
              writing, listening, and speaking components.
            </p>
            <p>
              With authentic exam-style questions, detailed explanations, and AI-powered
              feedback, you'll be fully prepared to achieve your certification. Practice
              anytime, anywhere, and track your progress as you prepare for success.
            </p>
            <div className="stats">
              <div className="stat-item">
                <h3>Multiple Levels</h3>
                <p>B1, B2 & More</p>
              </div>
              <div className="stat-item">
                <h3>Multiple Languages</h3>
                <p>German, English & More</p>
              </div>
              <div className="stat-item">
                <h3>Track Progress</h3>
                <p>Monitor Your Success</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Apps Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Available Apps</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🇩🇪</div>
              <h3>German B1</h3>
              <p>Complete preparation for TELC German B1 exam with all sections covered.</p>
              <a href="https://play.google.com/store/apps/details?id=com.mhamada.telcb1german" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 'bold' }}>Download Now →</a>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🇩🇪</div>
              <h3>German B2</h3>
              <p>Advanced level preparation for TELC German B2 exam.</p>
              <a href="https://play.google.com/store/apps/details?id=com.mhamada.telcb2german" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 'bold' }}>Download Now →</a>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🇬🇧</div>
              <h3>English B1</h3>
              <p>Comprehensive preparation for TELC English B1 exam.</p>
              <a href="https://play.google.com/store/apps/details?id=com.mhamada.telcb1english" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 'bold' }}>Download Now →</a>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🇬🇧</div>
              <h3>English B2</h3>
              <p>Advanced level preparation for TELC English B2 exam.</p>
              <span style={{ color: '#999' }}>Coming Soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Start Your Preparation Today</h2>
          <p>Download our apps and begin your journey to TELC certification</p>
          {selectedApp ? (
            <div className="download-buttons">
              <a 
                href={androidLink} 
                className="download-btn android-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                <div>
                  <span className="btn-label">GET IT ON</span>
                  <span className="btn-store">Google Play</span>
                </div>
              </a>
              <a 
                href={iosLink} 
                className="download-btn ios-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                </svg>
                <div>
                  <span className="btn-label">Download on the</span>
                  <span className="btn-store">App Store</span>
                </div>
              </a>
            </div>
          ) : (
            <button 
              className="select-app-btn cta-select-btn"
              onClick={() => setShowModal(true)}
            >
              Select Your App to Get Started
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
