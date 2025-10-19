import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>German TELC B1</h3>
            <p>Your complete exam preparation companion</p>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/data-deletion">Data Deletion</Link>
          </div>
          <div className="footer-section">
            <h4>Download</h4>
            <a href="https://play.google.com/store/apps/details?id=com.mhamada.telcb1german">
              Android
            </a>
            <a href="https://apps.apple.com/app/id[YOUR_APP_ID]">
              iOS
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} German TELC B1 App. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

