import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { reportsService, AppAnalytics, DailySnapshot } from '../services/reports.service';
import { StatCard } from '../components/StatCard';
import { DistributionChart } from '../components/DistributionChart';
import { toast } from 'react-toastify';
import './ReportsPage.css';

type MetricKey = 'totalUsers' | 'activeStreaks' | 'wordsStudied' | 'examsCompleted' | 'notificationsEnabled' | 'premiumUsers';

interface TrendData {
  date: string;
  value: number;
}

const APP_DISPLAY_NAMES: { [key: string]: string } = {
  'german-b1': 'German B1',
  'german-b2': 'German B2',
  'english-b1': 'English B1',
  'english-b2': 'English B2',
};

export const ReportsPage: React.FC = () => {
  const [allAppsData, setAllAppsData] = useState<AppAnalytics[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>('german-b1');
  const [loading, setLoading] = useState(true);
  const [daysBack, setDaysBack] = useState(30);

  const loadData = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      if (forceRefresh) {
        reportsService.clearCache();
      }
      const data = await reportsService.getAllAppsAnalytics(daysBack);
      setAllAppsData(data);
    } catch (error: any) {
      console.error('Error loading reports:', error);
      toast.error(error.message || 'Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daysBack]);

  const handleRefresh = () => {
    loadData(true);
    toast.info('Refreshing reports data...');
  };

  const selectedAppData = useMemo(() => {
    return allAppsData.find(app => app.appId === selectedApp) || null;
  }, [allAppsData, selectedApp]);

  // Calculate totals across all apps
  const totals = useMemo(() => {
    return allAppsData.reduce((acc, app) => {
      if (app.current) {
        acc.totalUsers += app.current.totalUsers;
        acc.activeStreaks += app.current.streaks.activeStreaks;
        acc.wordsStudied += app.current.vocabulary.totalWordsStudied;
        acc.wordsMastered += app.current.vocabulary.totalMastered;
        acc.examsCompleted += app.current.progress.examsCompleted;
        acc.notificationsEnabled += app.current.notifications.enabled;
        acc.premiumUsers += app.current.premium?.total || 0;
      }
      return acc;
    }, {
      totalUsers: 0,
      activeStreaks: 0,
      wordsStudied: 0,
      wordsMastered: 0,
      examsCompleted: 0,
      notificationsEnabled: 0,
      premiumUsers: 0,
    });
  }, [allAppsData]);

  // Extract trend data for a specific metric
  const getTrendData = (snapshots: DailySnapshot[], metric: MetricKey): TrendData[] => {
    return snapshots.map(snap => {
      let value = 0;
      switch (metric) {
        case 'totalUsers':
          value = snap.totalUsers;
          break;
        case 'activeStreaks':
          value = snap.streaks?.activeStreaks || 0;
          break;
        case 'wordsStudied':
          value = snap.vocabulary?.totalWordsStudied || 0;
          break;
        case 'examsCompleted':
          value = snap.progress?.examsCompleted || 0;
          break;
        case 'notificationsEnabled':
          value = snap.notifications?.enabled || 0;
          break;
        case 'premiumUsers':
          value = snap.premium?.total || 0;
          break;
      }
      return { date: snap.date, value };
    });
  };

  // Calculate streak distribution for display
  const getStreakDistribution = (distribution: { [key: string]: number } | undefined) => {
    if (!distribution) return [];
    return Object.entries(distribution)
      .map(([streak, count]) => ({
        label: `${streak} days`,
        value: count,
      }))
      .sort((a, b) => parseInt(a.label) - parseInt(b.label))
      .slice(0, 15); // Top 15 streak values
  };

  if (loading) {
    return (
      <div className="reports-container">
        <div className="reports-header">
          <h1>Reports Dashboard</h1>
        </div>
        <div className="reports-loading">
          <div className="loading-spinner"></div>
          <p>Loading reports data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div>
          <div className="breadcrumb">
            <Link to="/apps" className="breadcrumb-link">← All Apps</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Reports</span>
          </div>
          <h1>Reports Dashboard</h1>
          <p className="reports-subtitle">User analytics from aggregated data</p>
        </div>
        <div className="reports-controls">
          <select 
            value={daysBack} 
            onChange={(e) => setDaysBack(Number(e.target.value))}
            className="days-selector"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={handleRefresh} className="btn-refresh" disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="reports-content">
        {/* Global Overview */}
        <section className="reports-section">
          <h2 className="section-title">Global Overview (All Apps)</h2>
          <div className="stat-cards-grid">
            <StatCard
              title="Total Users"
              value={totals.totalUsers.toLocaleString()}
              icon="👥"
              color="primary"
            />
            <StatCard
              title="Active Streaks"
              value={totals.activeStreaks.toLocaleString()}
              subtitle="Users with streak > 0"
              icon="🔥"
              color="success"
            />
            <StatCard
              title="Words Studied"
              value={totals.wordsStudied.toLocaleString()}
              subtitle={`${totals.wordsMastered.toLocaleString()} mastered`}
              icon="📚"
              color="info"
            />
            <StatCard
              title="Exams Completed"
              value={totals.examsCompleted.toLocaleString()}
              icon="✅"
              color="warning"
            />
            <StatCard
              title="Premium Users"
              value={totals.premiumUsers.toLocaleString()}
              subtitle={totals.totalUsers > 0 ? `${((totals.premiumUsers / totals.totalUsers) * 100).toFixed(1)}% of users` : '0% of users'}
              icon="⭐"
              color="success"
            />
          </div>
        </section>

        {/* Per-App Summary */}
        <section className="reports-section">
          <h2 className="section-title">Per-App Summary</h2>
          <div className="app-summary-grid">
            {allAppsData.map(app => (
              <div 
                key={app.appId} 
                className={`app-summary-card ${selectedApp === app.appId ? 'selected' : ''}`}
                onClick={() => setSelectedApp(app.appId)}
              >
                <h3>{APP_DISPLAY_NAMES[app.appId] || app.appId}</h3>
                {app.current ? (
                  <div className="app-summary-stats">
                    <div className="app-stat">
                      <span className="app-stat-value">{app.current.totalUsers.toLocaleString()}</span>
                      <span className="app-stat-label">Users</span>
                    </div>
                    <div className="app-stat">
                      <span className="app-stat-value">{app.current.premium?.total || 0}</span>
                      <span className="app-stat-label">Premium</span>
                    </div>
                    <div className="app-stat">
                      <span className="app-stat-value">{app.current.streaks.activeStreaks}</span>
                      <span className="app-stat-label">Active Streaks</span>
                    </div>
                    <div className="app-stat">
                      <span className="app-stat-value">{app.current.vocabulary.totalWordsStudied.toLocaleString()}</span>
                      <span className="app-stat-label">Words</span>
                    </div>
                    <div className="app-stat">
                      <span className="app-stat-value">{app.current.progress.examsCompleted}</span>
                      <span className="app-stat-label">Exams</span>
                    </div>
                  </div>
                ) : (
                  <p className="no-data">No data available</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Selected App Details */}
        {selectedAppData && selectedAppData.current && (
          <>
            <section className="reports-section">
              <h2 className="section-title">{APP_DISPLAY_NAMES[selectedApp]} - Detailed View</h2>
              
              {/* Trends */}
              <div className="trends-section">
                <h3 className="subsection-title">Trends (Last {daysBack} Days)</h3>
                {selectedAppData.snapshots.length > 0 ? (
                  <div className="trends-grid">
                    <TrendChart 
                      title="Total Users" 
                      data={getTrendData(selectedAppData.snapshots, 'totalUsers')} 
                      color="#4285f4"
                    />
                    <TrendChart 
                      title="Active Streaks" 
                      data={getTrendData(selectedAppData.snapshots, 'activeStreaks')} 
                      color="#34a853"
                    />
                    <TrendChart 
                      title="Words Studied" 
                      data={getTrendData(selectedAppData.snapshots, 'wordsStudied')} 
                      color="#9c27b0"
                    />
                    <TrendChart 
                      title="Exams Completed" 
                      data={getTrendData(selectedAppData.snapshots, 'examsCompleted')} 
                      color="#ff9800"
                    />
                    <TrendChart 
                      title="Premium Users" 
                      data={getTrendData(selectedAppData.snapshots, 'premiumUsers')} 
                      color="#ffc107"
                    />
                  </div>
                ) : (
                  <p className="no-snapshots">No historical snapshots available yet.</p>
                )}
              </div>
            </section>

            {/* Distributions */}
            <section className="reports-section">
              <h2 className="section-title">{APP_DISPLAY_NAMES[selectedApp]} - Distributions</h2>
              <div className="charts-grid">
                <DistributionChart
                  title="Platform Distribution"
                  data={Object.entries(selectedAppData.current.platforms)
                    .filter(([_, count]) => count > 0)
                    .map(([platform, count]) => ({
                      label: platform.charAt(0).toUpperCase() + platform.slice(1),
                      value: count,
                    }))}
                />
                <DistributionChart
                  title="Interface Language"
                  data={Object.entries(selectedAppData.current.languages)
                    .filter(([_, count]) => count > 0)
                    .map(([lang, count]) => ({
                      label: lang.toUpperCase(),
                      value: count,
                    }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 10)}
                />
                <DistributionChart
                  title="Notification Status"
                  data={[
                    { label: 'Enabled', value: selectedAppData.current.notifications.enabled },
                    { label: 'Disabled', value: selectedAppData.current.notifications.disabled },
                  ]}
                />
                <DistributionChart
                  title="Premium Status"
                  data={[
                    { label: 'Premium', value: selectedAppData.current.premium?.total || 0 },
                    { label: 'Free', value: selectedAppData.current.premium?.nonPremium || 0 },
                  ]}
                />
                <DistributionChart
                  title="Vocabulary Persona"
                  data={Object.entries(selectedAppData.current.personas)
                    .filter(([_, count]) => count > 0)
                    .map(([persona, count]) => ({
                      label: persona.charAt(0).toUpperCase() + persona.slice(1),
                      value: count,
                    }))}
                />
              </div>
            </section>

            {/* Streak Distributions */}
            <section className="reports-section">
              <h2 className="section-title">{APP_DISPLAY_NAMES[selectedApp]} - Streak Analysis</h2>
              <div className="charts-grid">
                <DistributionChart
                  title="Current Streak Distribution"
                  data={getStreakDistribution(selectedAppData.current.streaks.currentStreakDistribution)}
                  showPercentage={false}
                />
                <DistributionChart
                  title="Longest Streak Distribution"
                  data={getStreakDistribution(selectedAppData.current.streaks.longestStreakDistribution)}
                  showPercentage={false}
                />
              </div>
            </section>
          </>
        )}

        {/* Data Info */}
        <section className="reports-section">
          <div className="reports-info">
            <p>
              <strong>Note:</strong> This data is aggregated from the <code>user_analytics</code> collection 
              and updated in real-time by Cloud Functions. Daily snapshots capture the state at the end of each day.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

// Simple Trend Chart Component
interface TrendChartProps {
  title: string;
  data: TrendData[];
  color: string;
}

const TrendChart: React.FC<TrendChartProps> = ({ title, data, color }) => {
  if (data.length === 0) {
    return (
      <div className="trend-chart">
        <h4 className="trend-chart-title">{title}</h4>
        <div className="trend-chart-empty">No data</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value));
  const latestValue = data[data.length - 1]?.value || 0;
  const previousValue = data.length > 1 ? data[data.length - 2]?.value || 0 : latestValue;
  const change = latestValue - previousValue;
  const changePercent = previousValue > 0 ? ((change / previousValue) * 100).toFixed(1) : '0';

  // Format number for Y-axis (e.g., 1000 -> 1K, 1000000 -> 1M)
  const formatYAxisValue = (value: number): string => {
    if (value >= 1000000) return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return value.toString();
  };

  // Calculate middle value for Y-axis
  const midValue = Math.round((maxValue + minValue) / 2);

  return (
    <div className="trend-chart">
      <div className="trend-chart-header">
        <h4 className="trend-chart-title">{title}</h4>
        <div className="trend-chart-value">
          <span className="trend-value">{latestValue.toLocaleString()}</span>
          {change !== 0 && (
            <span className={`trend-change ${change > 0 ? 'positive' : 'negative'}`}>
              {change > 0 ? '+' : ''}{change.toLocaleString()} ({changePercent}%)
            </span>
          )}
        </div>
      </div>
      <div className="trend-chart-body">
        <div className="trend-chart-yaxis">
          <span>{formatYAxisValue(maxValue)}</span>
          <span>{formatYAxisValue(midValue)}</span>
          <span>{formatYAxisValue(minValue)}</span>
        </div>
        <div className="trend-chart-graph">
          <svg viewBox="0 0 200 80" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="10" x2="200" y2="10" stroke="#30363d" strokeWidth="1" />
            <line x1="0" y1="40" x2="200" y2="40" stroke="#30363d" strokeWidth="1" />
            <line x1="0" y1="70" x2="200" y2="70" stroke="#30363d" strokeWidth="1" />
            
            {/* Area fill */}
            <path
              d={`M 0 80 ${data.map((d, i) => {
                const x = (i / (data.length - 1 || 1)) * 200;
                const y = 70 - ((d.value - minValue) / (maxValue - minValue || 1)) * 60;
                return `L ${x} ${y}`;
              }).join(' ')} L 200 80 Z`}
              fill={color}
              fillOpacity="0.15"
            />
            
            {/* Line */}
            <path
              d={data.map((d, i) => {
                const x = (i / (data.length - 1 || 1)) * 200;
                const y = 70 - ((d.value - minValue) / (maxValue - minValue || 1)) * 60;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {/* Data points rendered as absolute positioned divs to avoid SVG scaling issues */}
          {data.map((d, i) => {
            const xPercent = (i / (data.length - 1 || 1)) * 100;
            const yPercent = 87.5 - ((d.value - minValue) / (maxValue - minValue || 1)) * 75;
            return (
              <div
                key={i}
                className="trend-data-point"
                style={{
                  left: `${xPercent}%`,
                  top: `${yPercent}%`,
                  backgroundColor: color,
                }}
              />
            );
          })}
        </div>
      </div>
      <div className="trend-chart-labels">
        <span className="trend-chart-label-spacer"></span>
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
};

