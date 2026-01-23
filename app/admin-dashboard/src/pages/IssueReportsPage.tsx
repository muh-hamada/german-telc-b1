import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { issueReportsService, IssueReport, IssueReportFilters } from '../services/issue-reports.service';
import { toast } from 'react-toastify';
import './IssueReportsPage.css';
import { APP_DISPLAY_NAMES } from '../utils/examDisplayName';

const STATUS_LABELS: { [key: string]: string } = {
  'pending': 'Pending',
  'in_progress': 'In Progress',
  'cannot_reproduce': 'Cannot Reproduce',
  'fixed': 'Fixed',
  'not_a_bug': 'Not a Bug',
};

const STATUS_COLORS: { [key: string]: string } = {
  'pending': '#ff9800',
  'in_progress': '#2196f3',
  'cannot_reproduce': '#9e9e9e',
  'fixed': '#4caf50',
  'not_a_bug': '#9c27b0',
};

export const IssueReportsPage: React.FC = () => {
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<IssueReport | null>(null);
  const [editingComments, setEditingComments] = useState(false);
  const [editingResponse, setEditingResponse] = useState(false);
  const [internalComments, setInternalComments] = useState('');
  const [adminResponse, setAdminResponse] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Filters
  const [filterAppId, setFilterAppId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    cannotReproduce: 0,
    fixed: 0,
    notABug: 0,
  });

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, filterAppId, filterStatus, filterPlatform, searchQuery]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await issueReportsService.getAllIssueReports();
      setReports(data);
      
      // Calculate stats
      const counts = await issueReportsService.getReportCounts();
      setStats(counts);
    } catch (error: any) {
      console.error('Error loading issue reports:', error);
      toast.error(error.message || 'Failed to load issue reports');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    // Filter by app
    if (filterAppId !== 'all') {
      filtered = filtered.filter(r => r.appId === filterAppId);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    // Filter by platform
    if (filterPlatform !== 'all') {
      filtered = filtered.filter(r => r.platform === filterPlatform);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.userFeedback.toLowerCase().includes(query) ||
        r.section.toLowerCase().includes(query) ||
        r.examId.toString().includes(query) ||
        (r.internalComments && r.internalComments.toLowerCase().includes(query)) ||
        (r.adminResponse && r.adminResponse.toLowerCase().includes(query))
      );
    }

    setFilteredReports(filtered);
  };

  const handleStatusChange = async (reportId: string, newStatus: IssueReport['status']) => {
    try {
      setUpdatingStatus(true);
      await issueReportsService.updateIssueReport(reportId, { status: newStatus });
      
      // Update local state
      setReports(reports.map(r => 
        r.id === reportId ? { ...r, status: newStatus } : r
      ));
      
      if (selectedReport?.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
      
      toast.success('Status updated successfully');
      
      // Reload to update stats
      await loadReports();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveComments = async () => {
    if (!selectedReport) return;

    try {
      setUpdatingStatus(true);
      await issueReportsService.updateIssueReport(selectedReport.id, {
        internalComments: internalComments,
      });

      // Update local state
      setReports(reports.map(r => 
        r.id === selectedReport.id ? { ...r, internalComments: internalComments } : r
      ));
      setSelectedReport({ ...selectedReport, internalComments: internalComments });
      
      setEditingComments(false);
      toast.success('Comments saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save comments');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveResponse = async () => {
    if (!selectedReport) return;

    try {
      setUpdatingStatus(true);
      await issueReportsService.updateIssueReport(selectedReport.id, {
        adminResponse: adminResponse,
      });

      // Update local state
      setReports(reports.map(r => 
        r.id === selectedReport.id ? { ...r, adminResponse: adminResponse } : r
      ));
      setSelectedReport({ ...selectedReport, adminResponse: adminResponse });
      
      setEditingResponse(false);
      toast.success('Response saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save response');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSelectReport = (report: IssueReport) => {
    setSelectedReport(report);
    setInternalComments(report.internalComments || '');
    setAdminResponse(report.adminResponse || '');
    setEditingComments(false);
    setEditingResponse(false);
  };

  const formatDate = (timestamp: number | Date | any) => {
    if (!timestamp) return 'N/A';
    
    let date: Date;
    if (timestamp.toDate) {
      // Firestore Timestamp
      date = timestamp.toDate();
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp);
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getUniqueApps = () => {
    const apps = new Set(reports.map(r => r.appId));
    return Array.from(apps).sort();
  };

  if (loading) {
    return (
      <div className="issue-reports-container">
        <div className="issue-reports-header">
          <h1>Issue Reports</h1>
        </div>
        <div className="issue-reports-loading">
          <div className="loading-spinner"></div>
          <p>Loading issue reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="issue-reports-container">
      <div className="issue-reports-header">
        <div>
          <div className="breadcrumb">
            <Link to="/apps" className="breadcrumb-link">← All Apps</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Issue Reports</span>
          </div>
          <h1>Issue Reports</h1>
          <p className="issue-reports-subtitle">Manage user-reported issues from all apps</p>
        </div>
        <button onClick={loadReports} className="btn-refresh" disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Reports</div>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-card in-progress">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>
        <div className="stat-card cannot-reproduce">
          <div className="stat-icon">❓</div>
          <div className="stat-content">
            <div className="stat-value">{stats.cannotReproduce}</div>
            <div className="stat-label">Cannot Reproduce</div>
          </div>
        </div>
        <div className="stat-card fixed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.fixed}</div>
            <div className="stat-label">Fixed</div>
          </div>
        </div>
        <div className="stat-card not-a-bug">
          <div className="stat-icon">🚫</div>
          <div className="stat-content">
            <div className="stat-value">{stats.notABug}</div>
            <div className="stat-label">Not a Bug</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <input
          type="text"
          placeholder="Search by feedback, section, or exam ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        
        <select 
          value={filterAppId} 
          onChange={(e) => setFilterAppId(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Apps</option>
          {getUniqueApps().map(appId => (
            <option key={appId} value={appId}>
              {APP_DISPLAY_NAMES[appId] || appId}
            </option>
          ))}
        </select>

        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="cannot_reproduce">Cannot Reproduce</option>
          <option value="fixed">Fixed</option>
          <option value="not_a_bug">Not a Bug</option>
        </select>

        <select 
          value={filterPlatform} 
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Platforms</option>
          <option value="ios">iOS</option>
          <option value="android">Android</option>
        </select>

        <div className="filter-info">
          Showing {filteredReports.length} of {reports.length} reports
        </div>
      </div>

      {/* Main Content */}
      <div className="issue-reports-content">
        {/* Reports List */}
        <div className="reports-list">
          {filteredReports.length === 0 ? (
            <div className="no-reports">
              <p>No issue reports found</p>
            </div>
          ) : (
            filteredReports.map(report => (
              <div
                key={report.id}
                className={`report-item ${selectedReport?.id === report.id ? 'selected' : ''}`}
                onClick={() => handleSelectReport(report)}
              >
                <div className="report-item-header">
                  <div className="report-app-badge">
                    {APP_DISPLAY_NAMES[report.appId] || report.appId}
                  </div>
                  <div className="report-header-badges">
                    {report.seenByUserAt && (
                      <span 
                        className="report-seen-badge"
                        title={`Seen by user on ${formatDate(report.seenByUserAt)}`}
                      >
                        👁️
                      </span>
                    )}
                    <span 
                      className="report-status-badge"
                      style={{ backgroundColor: STATUS_COLORS[report.status] }}
                    >
                      {STATUS_LABELS[report.status]}
                    </span>
                  </div>
                </div>
                
                <div className="report-item-content">
                  <div className="report-meta">
                    <span className="report-section">
                      {report.section} - Part {report.part} (Exam #{report.examId})
                    </span>
                    <span className="report-platform">{report.platform}</span>
                  </div>
                  <div className="report-feedback">
                    {report.userFeedback.substring(0, 120)}
                    {report.userFeedback.length > 120 ? '...' : ''}
                  </div>
                  <div className="report-date">
                    {formatDate(report.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Report Details Panel */}
        <div className="report-details-panel">
          {selectedReport ? (
            <>
              <div className="report-details-header">
                <h2>Report Details</h2>
                <button 
                  className="btn-close"
                  onClick={() => setSelectedReport(null)}
                >
                  ✕
                </button>
              </div>

              <div className="report-details-content">
                {/* Status Control */}
                <div className="detail-section">
                  <label className="detail-label">Status</label>
                  <select
                    value={selectedReport.status}
                    onChange={(e) => handleStatusChange(selectedReport.id, e.target.value as IssueReport['status'])}
                    className="status-select"
                    disabled={updatingStatus}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="cannot_reproduce">Cannot Reproduce</option>
                    <option value="fixed">Fixed</option>
                    <option value="not_a_bug">Not a Bug</option>
                  </select>
                </div>

                {/* Report Info */}
                <div className="detail-section">
                  <label className="detail-label">App</label>
                  <div className="detail-value">
                    {APP_DISPLAY_NAMES[selectedReport.appId] || selectedReport.appId}
                  </div>
                </div>

                <div className="detail-section">
                  <label className="detail-label">Location</label>
                  <div className="detail-value">
                    {selectedReport.section} - Part {selectedReport.part} (Exam #{selectedReport.examId})
                  </div>
                </div>

                <div className="detail-section">
                  <label className="detail-label">Platform</label>
                  <div className="detail-value">
                    {selectedReport.platform} (v{selectedReport.appVersion})
                  </div>
                </div>

                <div className="detail-section">
                  <label className="detail-label">User ID</label>
                  <div className="detail-value">
                    {selectedReport.userId || 'Anonymous'}
                  </div>
                </div>

                <div className="detail-section">
                  <label className="detail-label">Device UUID</label>
                  <div className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                    {selectedReport.deviceUUID || 'N/A'}
                  </div>
                </div>

                <div className="detail-section">
                  <label className="detail-label">Reported At</label>
                  <div className="detail-value">
                    {formatDate(selectedReport.timestamp)}
                  </div>
                </div>

                <div className="detail-section">
                  <label className="detail-label">Seen By User</label>
                  <div className="detail-value">
                    {selectedReport.seenByUserAt ? (
                      <>
                        <div>{formatDate(selectedReport.seenByUserAt)}</div>
                        <div style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>
                          via {selectedReport.seenByUserSource === 'modal' ? '🔔 Update Modal' : '📱 Reports Screen'}
                        </div>
                      </>
                    ) : (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>Not yet viewed</span>
                    )}
                  </div>
                </div>

                {/* User Feedback */}
                <div className="detail-section">
                  <label className="detail-label">User Feedback</label>
                  <div className="detail-value feedback-box">
                    {selectedReport.userFeedback}
                  </div>
                </div>

                {/* Question Snapshot */}
                <div className="detail-section">
                  <label className="detail-label">Question Snapshot</label>
                  <details className="question-snapshot-details">
                    <summary>View Question Data</summary>
                    <pre className="question-snapshot">
                      {JSON.stringify(selectedReport.questionSnapshot, null, 2)}
                    </pre>
                  </details>
                </div>

                {/* Internal Comments */}
                <div className="detail-section">
                  <div className="detail-label-with-action">
                    <label className="detail-label">Internal Comments (Private)</label>
                    {!editingComments && (
                      <button
                        className="btn-edit-comments"
                        onClick={() => setEditingComments(true)}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  
                  {editingComments ? (
                    <div className="comments-editor">
                      <textarea
                        value={internalComments}
                        onChange={(e) => setInternalComments(e.target.value)}
                        className="comments-textarea"
                        placeholder="Add internal notes about this report (not visible to users)..."
                        rows={6}
                      />
                      <div className="comments-actions">
                        <button
                          className="btn-save"
                          onClick={handleSaveComments}
                          disabled={updatingStatus}
                        >
                          {updatingStatus ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={() => {
                            setEditingComments(false);
                            setInternalComments(selectedReport.internalComments || '');
                          }}
                          disabled={updatingStatus}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="detail-value comments-display">
                      {selectedReport.internalComments || 'No internal comments yet'}
                    </div>
                  )}
                </div>

                {/* Admin Response (Public - visible to users) */}
                <div className="detail-section">
                  <div className="detail-label-with-action">
                    <label className="detail-label">
                      Admin Response (Public - Visible to User) 
                      <span style={{ fontSize: '0.85em', color: '#666', fontWeight: 'normal' }}> ⚠️ Users can see this</span>
                    </label>
                    {!editingResponse && (
                      <button
                        className="btn-edit-comments"
                        onClick={() => setEditingResponse(true)}
                      >
                        {selectedReport.adminResponse ? 'Edit' : 'Add Response'}
                      </button>
                    )}
                  </div>
                  
                  {editingResponse ? (
                    <div className="comments-editor">
                      <textarea
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        className="comments-textarea"
                        placeholder="Write your response to the user. This will be visible in their 'Reported Issues' screen..."
                        rows={6}
                      />
                      <div className="comments-actions">
                        <button
                          className="btn-save"
                          onClick={handleSaveResponse}
                          disabled={updatingStatus}
                        >
                          {updatingStatus ? 'Saving...' : 'Save Response'}
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={() => {
                            setEditingResponse(false);
                            setAdminResponse(selectedReport.adminResponse || '');
                          }}
                          disabled={updatingStatus}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="detail-value comments-display" style={{ 
                      backgroundColor: selectedReport.adminResponse ? '#e8f5e9' : '#fff3e0',
                      border: selectedReport.adminResponse ? '1px solid #4caf50' : '1px solid #ff9800',
                      padding: '12px',
                      borderRadius: '4px'
                    }}>
                      {selectedReport.adminResponse || '⚠️ No response yet - User will see "Under review"'}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <div className="no-selection-icon">📋</div>
              <p>Select a report to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

