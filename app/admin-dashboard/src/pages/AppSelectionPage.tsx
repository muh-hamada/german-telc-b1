import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllAppConfigs, AppConfig } from '../config/apps.config';
import { toast } from 'react-toastify';
import './AppSelectionPage.css';

export const AppSelectionPage: React.FC = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const apps = getAllAppConfigs();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error: any) {
      toast.error('Failed to logout');
    }
  };

  const handleSelectApp = (appId: string) => {
    navigate(`/dashboard/${appId}`);
  };

  return (
    <div className="app-selection-container">
      <header className="app-selection-header">
        <div>
          <h1>TELC Exam Admin Dashboard</h1>
          <p className="user-info">Logged in as: {currentUser?.email}</p>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </header>

      <main className="app-selection-main">
        <div className="selection-content">
          <h2>Select an App to Manage</h2>
          <p className="selection-subtitle">Choose which app's content you want to edit</p>

          <div className="apps-grid">
            {apps.map((app: AppConfig) => (
              <div
                key={app.id}
                className="app-card"
                onClick={() => handleSelectApp(app.id)}
              >
                <div className="app-card-header">
                  <h3>{app.displayName}</h3>
                </div>
                <p className="app-description">{app.description}</p>
                <div className="app-collection-info">
                  <span className="collection-label">Collection:</span>
                  <code className="collection-name">{app.collectionName}</code>
                </div>
                <button className="btn-select">
                  Manage Content →
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

