import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { firestoreService } from '../services/firestore.service';
import { getAllAppConfigs } from '../config/apps.config';
import { toast } from 'react-toastify';
import './UsersPage.css';

interface User {
  uid: string;
  email: string;
  displayName?: string;
  appId?: string;
  platform?: string;
  createdAt?: any;
  lastLoginAt?: any;
  stats?: any;
}

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppFilter, setSelectedAppFilter] = useState<string>('all');
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const apps = getAllAppConfigs();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await firestoreService.getAllUsers();
      const sortedByCreatedAt = allUsers.sort((a, b) => {
        console.log('Comparing createdAt:', a.createdAt, b.createdAt);
        // Firebase Timestamp objects can be compared with their .toMillis() or .seconds properties.
        // This handles cases where createdAt may be undefined/null.
        const getTimestamp = (user: User) => {
          if (user.createdAt && typeof user.createdAt.toMillis === 'function') {
            return user.createdAt.toMillis();
          } else if (user.createdAt && typeof user.createdAt.seconds === 'number') {
            return user.createdAt.seconds * 1000; // Convert to ms for consistency
          }
          return 0;
        };
        return getTimestamp(b) - getTimestamp(a);
      });
      setUsers(sortedByCreatedAt);
      toast.success(`Loaded ${allUsers.length} users`);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUserDetails = async (user: User) => {
    try {
      setLoadingDetails(true);
      setShowDetailsModal(true);
      const detailedData = await firestoreService.getDetailedUserData(user.uid);
      setSelectedUser(detailedData);
    } catch (error: any) {
      console.error('Error loading user details:', error);
      toast.error(error.message || 'Failed to load user details');
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser({ uid: user.uid, profile: { email: user.email } });
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    try {
      const result = await firestoreService.callDeleteUserAccount(
        selectedUser.uid,
        selectedUser.profile?.email || 'unknown@email.com'
      );

      if (result.success) {
        toast.success('User account deleted successfully');
        setShowDeleteModal(false);
        setSelectedUser(null);
        loadUsers();
      } else {
        toast.error(result.message || 'Failed to delete user account');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    toast.success('UID copied to clipboard');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error: any) {
      toast.error('Failed to logout');
    }
  };

  // Simple substring search function
  const substringMatch = (text: string, query: string): boolean => {
    if (!query) return true;
    return text.toLowerCase().includes(query.toLowerCase());
  };

  // Filtered users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // App filter
      if (selectedAppFilter !== 'all' && user.appId !== selectedAppFilter) {
        return false;
      }

      // Platform filter
      if (selectedPlatformFilter !== 'all') {
        const userPlatform = user.platform?.toLowerCase();
        if (userPlatform !== selectedPlatformFilter) {
          return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const searchableText = [
          user.email || '',
          user.displayName || '',
          user.uid || '',
        ].join(' ');
        
        return substringMatch(searchableText, searchQuery);
      }

      return true;
    });
  }, [users, searchQuery, selectedAppFilter, selectedPlatformFilter]);

  const formatDate = (date: any): string => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="users-container">
        <div className="users-loading">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <header className="users-header">
        <div>
          <div className="breadcrumb">
            <Link to="/apps" className="breadcrumb-link">← All Apps</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Users</span>
          </div>
          <h1>Users Management</h1>
          <p className="users-subtitle">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>
        <div className="header-actions">
          <button onClick={loadUsers} className="btn-refresh" disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <main className="users-main">
        {/* Filters */}
        <div className="users-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, email, or UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="filter-group">
            <div className="app-filter">
              <label htmlFor="appFilter">App:</label>
              <select
                id="appFilter"
                value={selectedAppFilter}
                onChange={(e) => setSelectedAppFilter(e.target.value)}
                className="app-filter-select"
              >
                <option value="all">All Apps</option>
                {apps.map(app => (
                  <option key={app.id} value={app.id}>
                    {app.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="app-filter">
              <label htmlFor="platformFilter">Platform:</label>
              <select
                id="platformFilter"
                value={selectedPlatformFilter}
                onChange={(e) => setSelectedPlatformFilter(e.target.value)}
                className="app-filter-select"
              >
                <option value="all">All Platforms</option>
                <option value="ios">iOS</option>
                <option value="android">Android</option>
                <option value="web">Web</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="users-table-container">
          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <p>No users found matching your criteria</p>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Display Name</th>
                  <th>App</th>
                  <th>Platform</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.uid}>
                    <td className="email-cell">{user.email || 'N/A'}
                      <button
                        onClick={() => handleCopyUid(user.uid)}
                        className="mr-2 btn-copy"
                        style={{ background: 'transparent', border: 'none', marginLeft: 8, padding: 0, cursor: 'pointer' }}
                      >
                        <img src="/copy.png" alt="Copy" style={{ width: 16, height: 16 }} />
                      </button>
                    </td>
                    <td>{user.displayName || 'N/A'}</td>
                    <td>
                      <span className="app-badge">{user.appId || 'N/A'}</span>
                    </td>
                    <td>
                      <span className={`platform-badge ${user.platform}`}>
                        {user.platform || 'N/A'}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{formatDate(user.lastLoginAt)}</td>
                    <td className="actions-cell">
                      <button
                        onClick={() => handleViewUserDetails(user)}
                        className="btn-action btn-view"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="btn-action btn-delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* User Details Modal */}
      {showDetailsModal && (
        <div className="modal-overlay" onClick={() => !loadingDetails && setShowDetailsModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button
                className="modal-close"
                onClick={() => setShowDetailsModal(false)}
                disabled={loadingDetails}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {loadingDetails ? (
                <div className="modal-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading user details...</p>
                </div>
              ) : selectedUser ? (
                <div className="user-details">
                  {/* Profile Section */}
                  <section className="detail-section">
                    <h3>Profile Information</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>UID:</label>
                        <code>{selectedUser.uid}</code>
                      </div>
                      <div className="detail-item">
                        <label>Email:</label>
                        <span>{selectedUser.profile?.email || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Display Name:</label>
                        <span>{selectedUser.profile?.displayName || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>App ID:</label>
                        <span className="app-badge">{selectedUser.profile?.appId || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Platform:</label>
                        <span className={`platform-badge ${selectedUser.profile?.platform}`}>
                          {selectedUser.profile?.platform || 'N/A'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>Provider:</label>
                        <span>{selectedUser.profile?.provider || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Created At:</label>
                        <span>{formatDate(selectedUser.profile?.createdAt)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Last Login:</label>
                        <span>{formatDate(selectedUser.profile?.lastLoginAt)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Timezone:</label>
                        <span>{selectedUser.profile?.timezone || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Interface Language:</label>
                        <span>{selectedUser.profile?.preferences?.interfaceLanguage || 'N/A'}</span>
                      </div>
                    </div>
                  </section>

                  {/* Stats Section */}
                  {selectedUser.profile?.stats && (
                    <section className="detail-section">
                      <h3>Statistics</h3>
                      <div className="stats-grid">
                        <div className="stat-card">
                          <div className="stat-value">{selectedUser.profile.stats.totalExams || 0}</div>
                          <div className="stat-label">Total Exams</div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-value">{selectedUser.profile.stats.completedExams || 0}</div>
                          <div className="stat-label">Completed</div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-value">
                            {selectedUser.profile.stats.averageScore?.toFixed(1) || 0}%
                          </div>
                          <div className="stat-label">Average Score</div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-value">{selectedUser.profile.stats.streak || 0}</div>
                          <div className="stat-label">Streak Days</div>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Premium Section */}
                  {selectedUser.premium && Object.keys(selectedUser.premium).length > 0 && (
                    <section className="detail-section">
                      <h3>Premium Subscriptions</h3>
                      {apps.map(app => {
                        const premiumData = selectedUser.premium[app.id];
                        if (!premiumData) return null;
                        
                        return (
                          <div key={app.id} className="premium-app-section">
                            <h4>{app.displayName}</h4>
                            <div className="detail-grid">
                              <div className="detail-item">
                                <label>Status:</label>
                                <span className={`premium-badge ${premiumData.isPremium ? 'active' : 'inactive'}`}>
                                  {premiumData.isPremium ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <div className="detail-item">
                                <label>Product ID:</label>
                                <span>{premiumData.productId || 'N/A'}</span>
                              </div>
                              <div className="detail-item">
                                <label>Purchase Date:</label>
                                <span>{premiumData.purchaseDate ? formatDate(premiumData.purchaseDate) : 'N/A'}</span>
                              </div>
                              <div className="detail-item">
                                <label>Transaction ID:</label>
                                <span>{premiumData.transactionId || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </section>
                  )}

                  {/* Progress Section */}
                  {Object.keys(selectedUser.progress).length > 0 && (
                    <section className="detail-section">
                      <h3>Progress Data</h3>
                      {Object.entries(selectedUser.progress).map(([key, value]: [string, any]) => (
                        <div key={key} className="progress-item">
                          <h4>{key.replace(/_/g, ' ').toUpperCase()}</h4>
                          <div className="code-block">
                            <pre>{JSON.stringify(value, null, 2)}</pre>
                          </div>
                        </div>
                      ))}
                    </section>
                  )}

                  {/* Streaks Section */}
                  {selectedUser.streaks && selectedUser.streaks.length > 0 && (
                    <section className="detail-section">
                      <h3>Streaks</h3>
                      <div className="code-block">
                        <pre>{JSON.stringify(selectedUser.streaks, null, 2)}</pre>
                      </div>
                    </section>
                  )}

                  {/* Completions Section */}
                  {Object.keys(selectedUser.completions).length > 0 && (
                    <section className="detail-section">
                      <h3>Completions</h3>
                      {Object.entries(selectedUser.completions).map(([examType, parts]: [string, any]) => (
                        <div key={examType} className="completions-item">
                          <h4>{examType.toUpperCase()}</h4>
                          {Object.entries(parts).map(([partNum, exams]: [string, any]) => (
                            <div key={partNum} className="completion-part">
                              <h5>Part {partNum} ({exams.length} completions)</h5>
                              <div className="code-block">
                                <pre>{JSON.stringify(exams, null, 2)}</pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </section>
                  )}

                  {/* Vocabulary Progress Section */}
                  {Object.keys(selectedUser.vocabularyProgress).length > 0 && (
                    <section className="detail-section">
                      <h3>Vocabulary Progress</h3>
                      {Object.entries(selectedUser.vocabularyProgress).map(([key, value]: [string, any]) => (
                        <div key={key} className="vocab-item">
                          <h4>{key.replace(/_/g, ' ').toUpperCase()}</h4>
                          <div className="code-block">
                            <pre>{JSON.stringify(value, null, 2)}</pre>
                          </div>
                        </div>
                      ))}
                    </section>
                  )}
                </div>
              ) : (
                <p>No user data available</p>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowDetailsModal(false)}
                disabled={loadingDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="modal-overlay" onClick={() => !isDeleting && setShowDeleteModal(false)}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm User Deletion</h2>
              <button
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-message">
                <p>⚠️ You are about to permanently delete this user account:</p>
                <div className="account-details">
                  <p><strong>Email:</strong> {selectedUser.profile?.email || 'N/A'}</p>
                  <p><strong>UID:</strong> <code>{selectedUser.uid}</code></p>
                </div>
                <p className="warning-text">This action will delete:</p>
                <ul>
                  <li>User authentication account</li>
                  <li>User profile data</li>
                  <li>All progress data</li>
                  <li>All completions data</li>
                  <li>Streaks and statistics</li>
                  <li>Vocabulary progress</li>
                  <li>Premium subscription data</li>
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
                onClick={confirmDeleteUser}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

