import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsDataService, AnalyticsData } from '../services/analytics-data.service';
import { StatCard } from '../components/StatCard';
import { DistributionChart } from '../components/DistributionChart';
import { toast } from 'react-toastify';
import './AnalyticsPage.css';

export const AnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      const data = await analyticsDataService.getAnalyticsData(forceRefresh);
      setAnalyticsData(data);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast.error(error.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    analyticsDataService.clearCache();
    loadAnalytics(true);
    toast.info('Refreshing analytics data...');
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="analytics-header">
          <h1>Analytics Dashboard</h1>
        </div>
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="analytics-container">
        <div className="analytics-header">
          <h1>Analytics Dashboard</h1>
        </div>
        <div className="analytics-error">
          <p>Failed to load analytics data</p>
          <button onClick={() => loadAnalytics(true)} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare language distribution data
  const languageData = Object.entries(analyticsData.languages).map(([lang, count]) => ({
    label: lang.toUpperCase(),
    value: count,
  })).sort((a, b) => b.value - a.value);

  // Prepare sign-in method data
  const signInData = [
    { label: 'Google', value: analyticsData.signInMethods.google },
    { label: 'Apple', value: analyticsData.signInMethods.apple },
    { label: 'Email', value: analyticsData.signInMethods.email },
    { label: 'Anonymous', value: analyticsData.signInMethods.anonymous },
  ].filter(item => item.value > 0);

  // Prepare notification data
  const notificationData = [
    { label: 'Enabled', value: analyticsData.notifications.enabled },
    { label: 'Disabled', value: analyticsData.notifications.disabled },
    { label: 'Not Set', value: analyticsData.notifications.notSet },
  ];

  // Prepare B1 completion data
  const b1CompletionData = Object.entries(analyticsData.completionRates.b1).map(([key, count]) => ({
    label: key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count,
  })).sort((a, b) => b.value - a.value);

  // Prepare B2 completion data
  const b2CompletionData = Object.entries(analyticsData.completionRates.b2).map(([key, count]) => ({
    label: key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count,
  })).sort((a, b) => b.value - a.value);

  const notificationEnabledPercentage = analyticsData.totalUsers > 0
    ? ((analyticsData.notifications.enabled / analyticsData.totalUsers) * 100).toFixed(1)
    : '0';

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div>
          <div className="breadcrumb">
            <Link to="/apps" className="breadcrumb-link">← All Apps</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Analytics</span>
          </div>
          <h1>Analytics Dashboard</h1>
          {lastUpdated && (
            <p className="last-updated">Last updated: {formatLastUpdated()}</p>
          )}
        </div>
        <button onClick={handleRefresh} className="btn-refresh" disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="analytics-content">
        {/* Overview Section */}
        <section className="analytics-section">
          <h2 className="section-title">Overview</h2>
          <div className="stat-cards-grid">
            <StatCard
              title="Total Users"
              value={analyticsData.totalUsers}
              icon="👥"
              color="primary"
            />
            <StatCard
              title="Active Users (7d)"
              value={analyticsData.activeUsers7d}
              subtitle={`${((analyticsData.activeUsers7d / analyticsData.totalUsers) * 100).toFixed(1)}% of total`}
              icon="🔥"
              color="success"
            />
            <StatCard
              title="Active Users (30d)"
              value={analyticsData.activeUsers30d}
              subtitle={`${((analyticsData.activeUsers30d / analyticsData.totalUsers) * 100).toFixed(1)}% of total`}
              icon="📊"
              color="info"
            />
            <StatCard
              title="New This Month"
              value={analyticsData.newUsersThisMonth}
              icon="🆕"
              color="warning"
            />
          </div>
        </section>

        {/* Notifications Section */}
        <section className="analytics-section">
          <h2 className="section-title">Notifications</h2>
          <div className="stat-cards-grid">
            <StatCard
              title="Notifications Enabled"
              value={analyticsData.notifications.enabled}
              subtitle={`${notificationEnabledPercentage}% of users`}
              icon="🔔"
              color="success"
            />
            <StatCard
              title="Notifications Disabled"
              value={analyticsData.notifications.disabled}
              icon="🔕"
              color="default"
            />
            <StatCard
              title="Not Configured"
              value={analyticsData.notifications.notSet}
              icon="❓"
              color="default"
            />
          </div>
          <div className="charts-grid">
            <DistributionChart
              title="Notification Settings Distribution"
              data={notificationData}
            />
          </div>
        </section>

        {/* Languages & Sign-in Methods */}
        <section className="analytics-section">
          <h2 className="section-title">User Preferences & Authentication</h2>
          <div className="charts-grid">
            <DistributionChart
              title="Interface Language Distribution"
              data={languageData}
            />
            <DistributionChart
              title="Sign-in Methods"
              data={signInData}
            />
          </div>
        </section>

        {/* Progress Statistics */}
        <section className="analytics-section">
          <h2 className="section-title">User Progress</h2>
          <div className="stat-cards-grid">
            <StatCard
              title="Users With Progress"
              value={analyticsData.progressStats.usersWithProgress}
              subtitle={`${((analyticsData.progressStats.usersWithProgress / analyticsData.totalUsers) * 100).toFixed(1)}% of total`}
              icon="📈"
              color="primary"
            />
            <StatCard
              title="B1 Users"
              value={analyticsData.progressStats.b1Users}
              icon="📚"
              color="success"
            />
            <StatCard
              title="B2 Users"
              value={analyticsData.progressStats.b2Users}
              icon="📖"
              color="info"
            />
            <StatCard
              title="Average Progress"
              value={`${analyticsData.progressStats.averageProgress.toFixed(1)}%`}
              icon="🎯"
              color="warning"
            />
          </div>
        </section>

        {/* Exam Completions */}
        <section className="analytics-section">
          <h2 className="section-title">Exam Completions</h2>
          <div className="charts-grid">
            <DistributionChart
              title="B1 Exam Completions (by Section)"
              data={b1CompletionData}
              showPercentage={false}
            />
            <DistributionChart
              title="B2 Exam Completions (by Section)"
              data={b2CompletionData}
              showPercentage={false}
            />
          </div>
        </section>

        {/* Data Info */}
        <section className="analytics-section">
          <div className="analytics-info">
            <p>
              <strong>Note:</strong> Progress and completion statistics are based on a sample 
              of up to 100 users for performance optimization. Data is cached for 5 minutes.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

