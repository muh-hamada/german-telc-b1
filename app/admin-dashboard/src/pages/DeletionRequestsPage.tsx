import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { firestoreService, DeletionRequest, UserData } from '../services/firestore.service';
import { toast } from 'react-toastify';
import './DeletionRequestsPage.css';

interface RequestWithDaysLeft extends DeletionRequest {
  daysLeft: number;
}

export const DeletionRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<RequestWithDaysLeft[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithDaysLeft | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDeletionRequests();
  }, []);

  const loadDeletionRequests = async () => {
    try {
      setLoading(true);
      const deletionRequests = await firestoreService.getDeletionRequests();
      
      // Calculate days left for each request
      const requestsWithDaysLeft = deletionRequests.map(request => {
        const now = new Date();
        const requestDate = new Date(request.requestedAt);
        const deadlineDate = new Date(requestDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...request,
          daysLeft,
        };
      });
      
      setRequests(requestsWithDaysLeft);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load deletion requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewActivity = async (request: RequestWithDaysLeft) => {
    try {
      const userData = await firestoreService.getUserData(request.uid);
      setSelectedUser(userData);
      setSelectedRequest(request);
      setShowActivityModal(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load user data');
    }
  };

  const handleDeleteAccount = (request: RequestWithDaysLeft) => {
    setSelectedRequest(request);
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!selectedRequest) return;

    setIsDeleting(true);
    try {
      const result = await firestoreService.callDeleteUserAccount(
        selectedRequest.uid,
        selectedRequest.email
      );

      if (result.success) {
        toast.success('User account deleted successfully');
        setShowDeleteModal(false);
        setSelectedRequest(null);
        loadDeletionRequests();
      } else {
        toast.error(result.message || 'Failed to delete user account');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user account');
    } finally {
      setIsDeleting(false);
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

  const getUrgencyClass = (daysLeft: number): string => {
    if (daysLeft < 0) return 'overdue';
    if (daysLeft <= 2) return 'urgent';
    if (daysLeft <= 4) return 'warning';
    return 'normal';
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

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const completedRequests = requests.filter(r => r.status === 'completed');

  if (loading) {
    return <div className="loading-state">Loading deletion requests...</div>;
  }

  return (
    <div className="deletion-requests-container">
      <header className="deletion-requests-header">
        <div>
          <div className="breadcrumb">
            <Link to="/apps" className="breadcrumb-link">← All Apps</Link>
          </div>
          <h1>Account Deletion Requests</h1>
          <p className="user-info">
            Logged in as: {currentUser?.email}
          </p>
        </div>
        <div className="header-actions">
          <button onClick={loadDeletionRequests} className="btn-refresh" disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <main className="deletion-requests-main">
        <div className="requests-summary">
          <div className="summary-card">
            <h3>Pending Requests</h3>
            <p className="summary-count">{pendingRequests.length}</p>
          </div>
          <div className="summary-card">
            <h3>Completed</h3>
            <p className="summary-count">{completedRequests.length}</p>
          </div>
        </div>

        <div className="requests-section">
          <h2>Pending Deletion Requests</h2>
          {pendingRequests.length === 0 ? (
            <div className="empty-state">
              <p>No pending deletion requests</p>
            </div>
          ) : (
            <div className="requests-table-container">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>UID</th>
                    <th>Request Date</th>
                    <th>Days Left</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((request) => (
                    <tr key={request.uid} className={getUrgencyClass(request.daysLeft)}>
                      <td className="email-cell">{request.email}</td>
                      <td className="uid-cell">
                        <code>{request.uid.substring(0, 10)}...</code>
                      </td>
                      <td>{formatDate(request.requestedAt)}</td>
                      <td className="days-left-cell">
                        <span className={`days-badge ${getUrgencyClass(request.daysLeft)}`}>
                          {request.daysLeft < 0 ? 'OVERDUE' : `${request.daysLeft} days`}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          onClick={() => handleViewActivity(request)}
                          className="btn-action btn-view"
                        >
                          View Activity
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(request)}
                          className="btn-action btn-delete"
                        >
                          Delete Account
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="requests-section">
          <h2>Completed Deletions</h2>
          {completedRequests.length === 0 ? (
            <div className="empty-state">
              <p>No completed deletions yet</p>
            </div>
          ) : (
            <div className="requests-table-container">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>UID</th>
                    <th>Request Date</th>
                    <th>Completed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {completedRequests.map((request) => (
                    <tr key={request.uid} className="completed">
                      <td className="email-cell">{request.email}</td>
                      <td className="uid-cell">
                        <code>{request.uid.substring(0, 10)}...</code>
                      </td>
                      <td>{formatDate(request.requestedAt)}</td>
                      <td>{request.completedAt ? formatDate(request.completedAt) : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* User Activity Modal */}
      {showActivityModal && selectedUser && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowActivityModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Activity</h2>
              <button className="modal-close" onClick={() => setShowActivityModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="user-info-section">
                <h3>Account Information</h3>
                <p><strong>Email:</strong> {selectedRequest.email}</p>
                <p><strong>UID:</strong> <code>{selectedRequest.uid}</code></p>
                {selectedUser.profile && (
                  <>
                    <p><strong>Display Name:</strong> {selectedUser.profile.displayName || 'N/A'}</p>
                    <p><strong>Provider:</strong> {selectedUser.profile.provider || 'N/A'}</p>
                    <p><strong>Created At:</strong> {selectedUser.profile.createdAt ? formatDate(selectedUser.profile.createdAt.toDate()) : 'N/A'}</p>
                    <p><strong>Last Login:</strong> {selectedUser.profile.lastLoginAt ? formatDate(selectedUser.profile.lastLoginAt.toDate()) : 'N/A'}</p>
                  </>
                )}
              </div>

              <div className="progress-section">
                <h3>German B1 Progress</h3>
                {selectedUser.progressB1 ? (
                  <>
                    <p><strong>Total Score:</strong> {selectedUser.progressB1.totalScore || 0} / {selectedUser.progressB1.totalMaxScore || 0}</p>
                    <p><strong>Total Exams:</strong> {selectedUser.progressB1.exams?.length || 0}</p>
                    <p><strong>Last Updated:</strong> {selectedUser.progressB1.lastUpdated ? formatDate(selectedUser.progressB1.lastUpdated.toDate()) : 'N/A'}</p>
                  </>
                ) : (
                  <p className="no-data">No B1 progress data</p>
                )}
              </div>

              <div className="progress-section">
                <h3>German B2 Progress</h3>
                {selectedUser.progressB2 ? (
                  <>
                    <p><strong>Total Score:</strong> {selectedUser.progressB2.totalScore || 0} / {selectedUser.progressB2.totalMaxScore || 0}</p>
                    <p><strong>Total Exams:</strong> {selectedUser.progressB2.exams?.length || 0}</p>
                    <p><strong>Last Updated:</strong> {selectedUser.progressB2.lastUpdated ? formatDate(selectedUser.progressB2.lastUpdated.toDate()) : 'N/A'}</p>
                  </>
                ) : (
                  <p className="no-data">No B2 progress data</p>
                )}
              </div>

              {selectedUser.profile?.stats && (
                <div className="stats-section">
                  <h3>Overall Statistics</h3>
                  <p><strong>Total Exams:</strong> {selectedUser.profile.stats.totalExams || 0}</p>
                  <p><strong>Completed Exams:</strong> {selectedUser.profile.stats.completedExams || 0}</p>
                  <p><strong>Average Score:</strong> {selectedUser.profile.stats.averageScore || 0}%</p>
                  <p><strong>Streak:</strong> {selectedUser.profile.stats.streak || 0} days</p>
                </div>
              )}

              <div className="completions-section">
                <h3>German B1 Completions</h3>
                {selectedUser.completionsB1 && selectedUser.completionsB1.length > 0 ? (
                  <div className="completions-grid">
                    {selectedUser.completionsB1.map((stat, idx) => (
                      <div key={idx} className="completion-card">
                        <div className="completion-header">
                          <span className="completion-type">{stat.examType}</span>
                          <span className="completion-part">Part {stat.partNumber}</span>
                        </div>
                        <div className="completion-count">
                          <strong>{stat.completedCount}</strong> exams completed
                        </div>
                        {stat.completions.length > 0 && (
                          <div className="completion-average">
                            Avg Score: {Math.round(stat.completions.reduce((sum, c) => sum + c.score, 0) / stat.completions.length)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No B1 completions</p>
                )}
              </div>

              <div className="completions-section">
                <h3>German B2 Completions</h3>
                {selectedUser.completionsB2 && selectedUser.completionsB2.length > 0 ? (
                  <div className="completions-grid">
                    {selectedUser.completionsB2.map((stat, idx) => (
                      <div key={idx} className="completion-card">
                        <div className="completion-header">
                          <span className="completion-type">{stat.examType}</span>
                          <span className="completion-part">Part {stat.partNumber}</span>
                        </div>
                        <div className="completion-count">
                          <strong>{stat.completedCount}</strong> exams completed
                        </div>
                        {stat.completions.length > 0 && (
                          <div className="completion-average">
                            Avg Score: {Math.round(stat.completions.reduce((sum, c) => sum + c.score, 0) / stat.completions.length)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No B2 completions</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowActivityModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => !isDeleting && setShowDeleteModal(false)}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Account Deletion</h2>
              <button
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-message">
                <p>⚠️ You are about to permanently delete the following user account:</p>
                <div className="account-details">
                  <p><strong>Email:</strong> {selectedRequest.email}</p>
                  <p><strong>UID:</strong> <code>{selectedRequest.uid}</code></p>
                </div>
                <p className="warning-text">
                  This action will delete:
                </p>
                <ul>
                  <li>User authentication account</li>
                  <li>User profile data</li>
                  <li>German B1 progress</li>
                  <li>German B2 progress</li>
                  <li>All completions data</li>
                </ul>
                <p className="danger-text">
                  <strong>This action cannot be undone!</strong>
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={confirmDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

