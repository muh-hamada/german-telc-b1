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
          <div className="apps-section">
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
        </div>
      </main>

      <hr className="separator" />

      <div className="admin-actions-section">
        <h2>Admin Actions</h2>
        <div className="admin-actions-grid">
          <div
            className="admin-action-card vocabulary-upload"
            onClick={() => navigate('/vocabulary-upload')}
          >
            <div className="admin-action-icon">📚</div>
            <h3>Vocabulary Upload</h3>
            <p>Upload vocabulary words from JSON files to Firebase</p>
            <button className="btn-action-select">
              Upload Vocabulary →
            </button>
          </div>
          
          <div
            className="admin-action-card reports"
            onClick={() => navigate('/reports')}
          >
            <div className="admin-action-icon">📈</div>
            <h3>Reports & Trends</h3>
            <p>View aggregated analytics with daily trends</p>
            <button className="btn-action-select">
              View Reports →
            </button>
          </div>
          <div
            className="admin-action-card deletion-requests"
            onClick={() => navigate('/deletion-requests')}
          >
            <div className="admin-action-icon">🗑️</div>
            <h3>Account Deletion Requests</h3>
            <p>Manage user account deletion requests</p>
            <button className="btn-action-select">
              View Requests →
            </button>
          </div>
          <div
            className="admin-action-card questions-overview"
            onClick={() => navigate('/questions-overview')}
          >
            <div className="admin-action-icon">📝</div>
            <h3>Exam Questions Overview</h3>
            <p>View question counts across all apps with heatmap</p>
            <button className="btn-action-select">
              View Overview →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

