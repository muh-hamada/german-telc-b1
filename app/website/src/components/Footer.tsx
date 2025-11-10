import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>TELC Exam Preparation</h3>
            <p>Your complete exam preparation companion for all levels</p>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/data-deletion">Data Deletion</Link>
          </div>
          <div className="footer-section">
            <h4>Available Apps</h4>
            <a href="https://play.google.com/store/apps/details?id=com.mhamada.telcb1german">
              German B1 (Android)
            </a>
            <span style={{color: '#999'}}>German B2 (Coming Soon)</span>
            <span style={{color: '#999'}}>English B1/B2 (Coming Soon)</span>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} TELC Exam Preparation. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

