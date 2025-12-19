import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { examDataService, AppExamData } from '../services/exam-data.service';
import { APP_CONFIGS } from '../config/apps.config';
import { toast } from 'react-toastify';
import './QuestionsOverviewPage.css';

// Define exam types and their display names
const QUESTION_TYPES: { key: string; displayName: string }[] = [
  { key: 'reading-part1', displayName: 'Reading Part 1' },
  { key: 'reading-part2', displayName: 'Reading Part 2' },
  { key: 'reading-part3', displayName: 'Reading Part 3' },
  { key: 'listening-part1', displayName: 'Listening Part 1' },
  { key: 'listening-part2', displayName: 'Listening Part 2' },
  { key: 'listening-part3', displayName: 'Listening Part 3' },
  { key: 'listening-practice', displayName: 'Listening Practice' },
  { key: 'grammar-part1', displayName: 'Grammar Part 1' },
  { key: 'grammar-part2', displayName: 'Grammar Part 2' },
  { key: 'writing', displayName: 'Writing (All Parts)' },
  { key: 'speaking-part1', displayName: 'Speaking Part 1' },
  { key: 'speaking-part2', displayName: 'Speaking Part 2' },
  { key: 'speaking-part3', displayName: 'Speaking Part 3' },
];

// Count exams/items based on the data structure for each type
// We count the number of exams (test sets), not individual questions within them
const countExams = (data: any, questionType: string): number => {
  if (!data) return 0;

  try {
    switch (questionType) {
      case 'reading-part1':
        // Array of exam items at top level
        if (Array.isArray(data)) {
          return data.length;
        }
        return 0;

      case 'reading-part2':
      case 'reading-part3':
      case 'listening-part1':
      case 'listening-part2':
      case 'listening-part3':
      case 'grammar-part1':
      case 'grammar-part2':
        // Has exams array - count the exams themselves
        if (data.exams && Array.isArray(data.exams)) {
          return data.exams.length;
        }
        return 0;

      case 'writing':
        // Combine all writing parts (B1/B2 have 'writing', A1 has 'writing-part1' and 'writing-part2')
        let writingCount = 0;
        
        // Check for standard writing (B1/B2)
        if (data.exams && Array.isArray(data.exams)) {
          writingCount += data.exams.length;
        }
        
        return writingCount;

      case 'writing-part1':
      case 'writing-part2':
        // Has exams array - count the exams themselves
        if (data.exams && Array.isArray(data.exams)) {
          return data.exams.length;
        }
        return 0;

      case 'listening-practice':
        // Has interviews array - count the interviews themselves
        if (data.interviews && Array.isArray(data.interviews)) {
          return data.interviews.length;
        }
        return 0;

      case 'speaking-part1':
        // Has content (1 item) OR topics array (B2 style) OR study_material (A1 style)
        if (data.content) {
          return 1;
        }
        if (data.study_material) {
          return 1; // A1 has study material
        }
        if (data.topics && Array.isArray(data.topics)) {
          return data.topics.length;
        }
        return 0;

      case 'speaking-part2':
        // Has topics array at top level OR questions array (B2 style) OR simulation_data (A1 style)
        if (data.simulation_data) {
          return 1; // A1 has one simulation topic
        }
        if (data.topics && Array.isArray(data.topics)) {
          return data.topics.length;
        }
        if (data.questions && Array.isArray(data.questions)) {
          return data.questions.length;
        }
        return 0;

      case 'speaking-part3':
        // Has scenarios array OR questions array (B2 style) OR simulation_data (A1 style)
        if (data.simulation_data && data.simulation_data.cards_deck) {
          return 1; // A1 has one content with cards_deck
        }
        if (data.scenarios && Array.isArray(data.scenarios)) {
          return data.scenarios.length;
        }
        if (data.questions && Array.isArray(data.questions)) {
          return data.questions.length;
        }
        return 0;

      default:
        return 0;
    }
  } catch (error) {
    console.error(`Error counting exams for ${questionType}:`, error);
    return 0;
  }
};

// Get color based on value position between min and max
const getHeatmapColor = (value: number, min: number, max: number): string => {
  if (value === 0) return '#1a1a2e'; // Very dark for zero values
  
  const range = max - min;
  if (range === 0) return '#238636'; // All same value, use green
  
  const ratio = (value - min) / range;
  
  // Color gradient from red (low) through yellow (mid) to green (high)
  if (ratio < 0.25) {
    const r = 220;
    const g = Math.round(60 + ratio * 4 * 100);
    const b = 60;
    return `rgb(${r}, ${g}, ${b})`;
  } else if (ratio < 0.5) {
    const r = 220;
    const g = Math.round(160 + (ratio - 0.25) * 4 * 60);
    const b = 60;
    return `rgb(${r}, ${g}, ${b})`;
  } else if (ratio < 0.75) {
    const r = Math.round(220 - (ratio - 0.5) * 4 * 120);
    const g = 220;
    const b = 60;
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const r = Math.round(100 - (ratio - 0.75) * 4 * 60);
    const g = Math.round(220 - (ratio - 0.75) * 4 * 80);
    const b = Math.round(60 + (ratio - 0.75) * 4 * 40);
    return `rgb(${r}, ${g}, ${b})`;
  }
};

// Get text color based on background brightness
const getTextColor = (bgColor: string): string => {
  const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return '#ffffff';
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#1a1a2e' : '#ffffff';
};

export const QuestionsOverviewPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<Record<string, AppExamData>>({});
  const appIds = Object.keys(APP_CONFIGS);

  // Fetch data from Firebase
  const loadData = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      const data = await examDataService.getAllAppsExamData(forceRefresh);
      setExamData(data);
    } catch (error: any) {
      console.error('Error loading exam data:', error);
      toast.error(error.message || 'Failed to load exam data from Firebase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    examDataService.clearCache();
    loadData(true);
    toast.info('Refreshing exam data from Firebase...');
  };

  // Calculate exam counts for all apps and types
  const examCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    
    for (const appId of appIds) {
      counts[appId] = {};
      const appData = examData[appId];
      
      for (const { key } of QUESTION_TYPES) {
        if (key === 'writing') {
          // For writing, combine all writing parts
          let totalWriting = 0;
          
          // Check for standard writing section (B1/B2)
          const writingData = appData?.sections?.['writing']?.data;
          totalWriting += countExams(writingData, 'writing');
          
          // Check for writing-part1 (A1)
          const writingPart1Data = appData?.sections?.['writing-part1']?.data;
          totalWriting += countExams(writingPart1Data, 'writing-part1');
          
          // Check for writing-part2 (A1)
          const writingPart2Data = appData?.sections?.['writing-part2']?.data;
          totalWriting += countExams(writingPart2Data, 'writing-part2');
          
          counts[appId][key] = totalWriting;
        } else {
          const sectionData = appData?.sections?.[key]?.data;
          counts[appId][key] = countExams(sectionData, key);
        }
      }
    }
    
    return counts;
  }, [appIds, examData]);

  // Calculate min and max across all values (excluding zeros for better gradation)
  const { min, max, allValues } = useMemo(() => {
    const values: number[] = [];
    
    for (const appId of appIds) {
      for (const { key } of QUESTION_TYPES) {
        const count = examCounts[appId]?.[key] || 0;
        values.push(count);
      }
    }
    
    const nonZeroValues = values.filter(v => v > 0);
    const minVal = nonZeroValues.length > 0 ? Math.min(...nonZeroValues) : 0;
    const maxVal = values.length > 0 ? Math.max(...values) : 0;
    
    return { min: minVal, max: maxVal, allValues: values };
  }, [appIds, examCounts]);

  // Calculate totals per app
  const appTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const appId of appIds) {
      totals[appId] = QUESTION_TYPES.reduce(
        (sum, { key }) => sum + (examCounts[appId]?.[key] || 0), 0
      );
    }
    return totals;
  }, [appIds, examCounts]);

  // Calculate totals per question type
  const typeTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const { key } of QUESTION_TYPES) {
      totals[key] = appIds.reduce(
        (sum, appId) => sum + (examCounts[appId]?.[key] || 0), 0
      );
    }
    return totals;
  }, [appIds, examCounts]);

  // Grand total
  const grandTotal = useMemo(() => {
    return Object.values(appTotals).reduce((sum, val) => sum + val, 0);
  }, [appTotals]);

  if (loading) {
    return (
      <div className="questions-overview-container">
        <div className="questions-overview-header">
          <h1>Exam Content Overview</h1>
        </div>
        <div className="questions-loading">
          <div className="loading-spinner"></div>
          <p>Loading exam data from Firebase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="questions-overview-container">
      <div className="questions-overview-header">
        <div>
          <div className="breadcrumb">
            <Link to="/apps" className="breadcrumb-link">← All Apps</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Exam Content Overview</span>
          </div>
          <h1>Exam Content Overview</h1>
          <p className="questions-overview-subtitle">
            Exam/test counts across all apps (from Firebase) • 
            <span className="total-badge">{grandTotal.toLocaleString()} total exams</span>
          </p>
        </div>
        <div className="header-controls">
          <button onClick={handleRefresh} className="btn-refresh" disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="questions-overview-content">
        {/* Legend */}
        <div className="heatmap-legend">
          <span className="legend-label">Fewer exams</span>
          <div className="legend-gradient">
            <div className="legend-color" style={{ background: 'rgb(220, 60, 60)' }}></div>
            <div className="legend-color" style={{ background: 'rgb(220, 160, 60)' }}></div>
            <div className="legend-color" style={{ background: 'rgb(220, 220, 60)' }}></div>
            <div className="legend-color" style={{ background: 'rgb(100, 220, 60)' }}></div>
            <div className="legend-color" style={{ background: 'rgb(40, 140, 100)' }}></div>
          </div>
          <span className="legend-label">More exams</span>
          <span className="legend-range">Range: {min} - {max}</span>
        </div>

        {/* Table */}
        <div className="questions-table-wrapper">
          <table className="questions-table">
            <thead>
              <tr>
                <th className="question-type-header">Exam Section</th>
                {appIds.map(appId => (
                  <th key={appId} className="app-header">
                    {APP_CONFIGS[appId].displayName}
                  </th>
                ))}
                <th className="total-header">Total</th>
              </tr>
            </thead>
            <tbody>
              {QUESTION_TYPES.map(({ key, displayName }) => (
                <tr key={key}>
                  <td className="question-type-cell">{displayName}</td>
                  {appIds.map(appId => {
                    const count = examCounts[appId]?.[key] || 0;
                    const bgColor = getHeatmapColor(count, min, max);
                    const textColor = getTextColor(bgColor);
                    
                    return (
                      <td 
                        key={appId} 
                        className="count-cell"
                        style={{ 
                          backgroundColor: bgColor,
                          color: textColor
                        }}
                      >
                        <span className="count-value">{count}</span>
                        {count === 0 && <span className="zero-indicator">⚠</span>}
                      </td>
                    );
                  })}
                  <td className="row-total-cell">
                    {typeTotals[key]}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="total-label">App Total</td>
                {appIds.map(appId => (
                  <td key={appId} className="app-total-cell">
                    {appTotals[appId].toLocaleString()}
                  </td>
                ))}
                <td className="grand-total-cell">
                  {grandTotal.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Summary Cards */}
        <div className="questions-summary-section">
          <h2 className="section-title">Summary</h2>
          <div className="summary-cards-grid">
            <div className="summary-card">
              <div className="summary-icon">📊</div>
              <div className="summary-content">
                <span className="summary-value">{grandTotal.toLocaleString()}</span>
                <span className="summary-label">Total Exams</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">📈</div>
              <div className="summary-content">
                <span className="summary-value">{max}</span>
                <span className="summary-label">Highest Count</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">📉</div>
              <div className="summary-content">
                <span className="summary-value">{min}</span>
                <span className="summary-label">Lowest Count (non-zero)</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">⚠️</div>
              <div className="summary-content">
                <span className="summary-value">{allValues.filter(v => v === 0).length}</span>
                <span className="summary-label">Empty Sections</span>
              </div>
            </div>
          </div>
        </div>

        {/* Areas needing attention */}
        <div className="attention-section">
          <h2 className="section-title">Areas Needing Attention</h2>
          <div className="attention-list">
            {QUESTION_TYPES.map(({ key, displayName }) => {
              const counts = appIds.map(appId => ({
                appId,
                appName: APP_CONFIGS[appId].displayName,
                count: examCounts[appId]?.[key] || 0
              }));
              
              const lowCounts = counts.filter(c => c.count === 0 || c.count < min * 0.5);
              
              if (lowCounts.length === 0) return null;
              
              return (
                <div key={key} className="attention-item">
                  <span className="attention-type">{displayName}</span>
                  <div className="attention-apps">
                    {lowCounts.map(({ appName, count }) => (
                      <span 
                        key={appName} 
                        className={`attention-badge ${count === 0 ? 'empty' : 'low'}`}
                      >
                        {appName}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </div>
      </div>
    </div>
  );
};
