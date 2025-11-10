import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { firestoreService, DocumentMetadata } from '../services/firestore.service';
import { getAppConfig, AppConfig } from '../config/apps.config';
import { MigrationPanel } from '../components/MigrationPanel';
import { GrammarStudyUpload } from '../components/GrammarStudyUpload';
import { toast } from 'react-toastify';
import './DashboardPage.css';

export const DashboardPage: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMigration, setShowMigration] = useState(false);
  const [showGrammarUpload, setShowGrammarUpload] = useState(false);
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Validate and load app config
    if (!appId) {
      toast.error('No app selected');
      navigate('/apps');
      return;
    }

    try {
      const config = getAppConfig(appId);
      setAppConfig(config);
      // Set the Firestore collection for this app
      firestoreService.setCollection(config.collectionName);
      loadDocuments();
    } catch (error: any) {
      toast.error(error.message || 'Invalid app configuration');
      navigate('/apps');
    }
  }, [appId, navigate]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await firestoreService.getAllDocuments();
      setDocuments(docs);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error: any) {
      toast.error('Failed to logout');
    }
  };

  const handleEdit = (docId: string) => {
    navigate(`/editor/${appId}/${docId}`);
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm(`Are you sure you want to delete "${docId}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await firestoreService.deleteDocument(docId);
      toast.success(`Document "${docId}" deleted successfully`);
      loadDocuments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete document');
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!appConfig) {
    return <div className="loading-state">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <div className="breadcrumb">
            <Link to="/apps" className="breadcrumb-link">← All Apps</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{appConfig.displayName}</span>
          </div>
          <h1>{appConfig.displayName} - Content Management</h1>
          <p className="user-info">
            Logged in as: {currentUser?.email} | Collection: <code>{appConfig.collectionName}</code>
          </p>
        </div>
        <div className="header-actions">
          <button onClick={loadDocuments} className="btn-refresh" disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button onClick={() => setShowMigration(true)} className="btn-migrate">
            Migrate Data
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {showMigration ? (
          <MigrationPanel onComplete={() => {
            setShowMigration(false);
            loadDocuments();
          }} />
        ) : showGrammarUpload ? (
          <GrammarStudyUpload onComplete={() => {
            setShowGrammarUpload(false);
            loadDocuments();
          }} />
        ) : loading ? (
          <div className="loading-state">Loading documents...</div>
        ) : (
          <>
            {documents.length === 0 ? (
              <div className="empty-state">
                <p>No documents found in {appConfig.displayName}</p>
                <p className="empty-state-hint">
                  You may need to run the data migration to initialize the collection.
                </p>
                <button onClick={() => setShowMigration(true)} className="btn-migrate-link">
                  Start Migration
                </button>
              </div>
            ) : (
              <div className="documents-grid">
                {documents.map((doc) => (
                  <div key={doc.id} className="document-card">
                    <div className="document-header">
                      <h3>{doc.id}</h3>
                    </div>
                    <div className="document-info">
                      <div className="info-row">
                        <span className="info-label">Size:</span>
                        <span className="info-value">{formatSize(doc.size)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Updated:</span>
                        <span className="info-value">{formatDate(doc.updatedAt)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Created:</span>
                        <span className="info-value">{formatDate(doc.createdAt)}</span>
                      </div>
                    </div>
                    <div className="document-actions">
                      <button
                        onClick={() => handleEdit(doc.id)}
                        className="btn-action btn-edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="btn-action btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

