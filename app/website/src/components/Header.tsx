import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <h1>TELC Exam Preparation</h1>
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/privacy" className="nav-link">Privacy</Link>
          <Link to="/terms" className="nav-link">Terms</Link>
          <Link to="/data-deletion" className="nav-link">Data Deletion</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;

