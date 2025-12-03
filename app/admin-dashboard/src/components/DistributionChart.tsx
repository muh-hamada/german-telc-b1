import React from 'react';
import './DistributionChart.css';

interface DistributionItem {
  label: string;
  value: number;
  color?: string;
}

interface DistributionChartProps {
  title: string;
  data: DistributionItem[];
  showPercentage?: boolean;
}

export const DistributionChart: React.FC<DistributionChartProps> = ({
  title,
  data,
  showPercentage = true,
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  const colors = [
    '#4285f4', // Blue
    '#34a853', // Green
    '#fbbc04', // Yellow
    '#ea4335', // Red
    '#9c27b0', // Purple
    '#ff9800', // Orange
    '#00bcd4', // Cyan
    '#795548', // Brown
  ];

  return (
    <div className="distribution-chart">
      <h3 className="distribution-chart-title">{title}</h3>
      <div className="distribution-chart-content">
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          const color = item.color || colors[index % colors.length];
          
          return (
            <div key={item.label} className="distribution-item">
              <div className="distribution-item-header">
                <span className="distribution-item-label">
                  <span 
                    className="distribution-item-color" 
                    style={{ backgroundColor: color }}
                  ></span>
                  {item.label}
                </span>
                <span className="distribution-item-value">
                  {item.value}
                  {showPercentage && ` (${percentage.toFixed(1)}%)`}
                </span>
              </div>
              <div className="distribution-item-bar-container">
                <div 
                  className="distribution-item-bar" 
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: color,
                  }}
                ></div>
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <div className="distribution-empty">No data available</div>
        )}
      </div>
    </div>
  );
};

