import React from 'react';
import { Link } from 'react-router-dom';
import { useAppSelection } from '../contexts/AppSelectionContext';
import './Header.css';

const Header: React.FC = () => {
  const { selectedApp, setShowModal } = useAppSelection();

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <h1>TELC Exam Preparation</h1>
        </Link>
        <div className="header-right">
          {selectedApp && (
            <button 
              className="app-selector-button"
              onClick={() => setShowModal(true)}
            >
              <span className="selected-app-flag">{selectedApp.flag}</span>
              <span className="selected-app-name">{selectedApp.displayName}</span>
              <svg 
                className="change-icon" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
              </svg>
            </button>
          )}
          <nav className="nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/privacy" className="nav-link">Privacy</Link>
            <Link to="/terms" className="nav-link">Terms</Link>
            <Link to="/support" className="nav-link">Support</Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
