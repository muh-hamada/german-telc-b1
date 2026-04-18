import React, { useRef, useState, useCallback } from 'react';
import './LineChart.css';

export interface LineChartDataPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface LineChartSeries {
  label: string;
  color: string;
  data: LineChartDataPoint[];
}

interface LineChartProps {
  series: LineChartSeries[];
  height?: number;
  yLabel?: string;
  formatY?: (v: number) => string;
  emptyMessage?: string;
}

const PADDING = { top: 20, right: 16, bottom: 40, left: 52 };

export const LineChart: React.FC<LineChartProps> = ({
  series,
  height = 220,
  yLabel,
  formatY = v => v % 1 === 0 ? String(v) : v.toFixed(1),
  emptyMessage = 'No data yet',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; items: { color: string; name: string; value: string }[] } | null>(null);

  const allPoints = series.flatMap(s => s.data);
  const isEmpty = allPoints.length === 0;

  // Compute bounds (only meaningful when non-empty)
  const allDates = Array.from(new Set(allPoints.map(p => p.date))).sort((a, b) => a.localeCompare(b));
  const allValues = allPoints.map(p => p.value);
  const minVal = isEmpty ? 0 : Math.min(...allValues);
  const maxVal = isEmpty ? 1 : Math.max(...allValues);
  const valRange = maxVal - minVal || 1;

  // We don't know the SVG width at render time, use 100% with viewBox
  const svgW = 600;
  const svgH = height;
  const chartW = svgW - PADDING.left - PADDING.right;
  const chartH = svgH - PADDING.top - PADDING.bottom;

  const xScale = (date: string) => {
    const idx = allDates.indexOf(date);
    return PADDING.left + (idx / Math.max(allDates.length - 1, 1)) * chartW;
  };

  const yScale = (value: number) =>
    PADDING.top + (1 - (value - minVal) / valRange) * chartH;

  // Y axis ticks
  const Y_TICKS = 5;
  const yTicks = Array.from({ length: Y_TICKS }, (_, i) => {
    const val = minVal + (valRange / (Y_TICKS - 1)) * i;
    return { val, y: yScale(val) };
  });

  // X axis labels (show max 7)
  const maxXLabels = 7;
  const step = Math.max(1, Math.floor(allDates.length / maxXLabels));
  const xLabels = allDates.filter((_, i) => i % step === 0 || i === allDates.length - 1);

  const buildPolyline = (s: LineChartSeries) =>
    s.data
      .filter(p => allDates.includes(p.date))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(p => `${xScale(p.date)},${yScale(p.value)}`)
      .join(' ');

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || allDates.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * svgW;
    let nearestIdx = 0;
    let minDist = Infinity;
    allDates.forEach((d, i) => {
      const dist = Math.abs(xScale(d) - mouseX);
      if (dist < minDist) { minDist = dist; nearestIdx = i; }
    });
    const nearestDate = allDates[nearestIdx];
    const items = series
      .map(s => {
        const pt = s.data.find(p => p.date === nearestDate);
        return pt ? { color: s.color, name: s.label, value: formatY(pt.value) } : null;
      })
      .filter((x): x is { color: string; name: string; value: string } => x !== null);

    if (items.length === 0) { setTooltip(null); return; }
    const tipX = xScale(nearestDate) / svgW * (svgRef.current?.getBoundingClientRect().width ?? svgW);
    setTooltip({ x: tipX, y: 0, label: nearestDate, items });
  }, [allDates, series, formatY]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isEmpty) {
    return (
      <div className="linechart-empty" style={{ height }}>{emptyMessage}</div>
    );
  }

  return (
    <div className="linechart-wrapper">
      {yLabel && <div className="linechart-ylabel">{yLabel}</div>}
      <div className="linechart-inner" style={{ position: 'relative' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio="none"
          className="linechart-svg"
          style={{ height }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Grid lines */}
          {yTicks.map(t => (
            <line
              key={t.val}
              x1={PADDING.left} y1={t.y}
              x2={svgW - PADDING.right} y2={t.y}
              stroke="#30363d" strokeWidth="1"
            />
          ))}

          {/* Y axis labels */}
          {yTicks.map(t => (
            <text
              key={`yl-${t.val}`}
              x={PADDING.left - 6} y={t.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#8b949e"
            >
              {formatY(t.val)}
            </text>
          ))}

          {/* X axis labels */}
          {xLabels.map(d => (
            <text
              key={`xl-${d}`}
              x={xScale(d)} y={svgH - 6}
              textAnchor="middle"
              fontSize="10"
              fill="#8b949e"
            >
              {d.slice(5)} {/* MM-DD */}
            </text>
          ))}

          {/* Series lines */}
          {series.map(s => (
            <polyline
              key={s.label}
              points={buildPolyline(s)}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* Series dots on hover date */}
          {tooltip && series.map(s => {
            const pt = s.data.find(p => p.date === tooltip.label);
            if (!pt) return null;
            return (
              <circle
                key={`dot-${s.label}`}
                cx={xScale(pt.date)} cy={yScale(pt.value)}
                r="4" fill={s.color} stroke="#0d1117" strokeWidth="2"
              />
            );
          })}

          {/* Hover vertical line */}
          {tooltip && (
            <line
              x1={tooltip.x * (svgW / (svgRef.current?.getBoundingClientRect().width ?? svgW))}
              y1={PADDING.top}
              x2={tooltip.x * (svgW / (svgRef.current?.getBoundingClientRect().width ?? svgW))}
              y2={svgH - PADDING.bottom}
              stroke="#58a6ff"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
          )}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="linechart-tooltip"
            style={{ left: Math.min(tooltip.x + 12, (svgRef.current?.getBoundingClientRect().width ?? 400) - 140) }}
          >
            <div className="linechart-tooltip-date">{tooltip.label}</div>
            {tooltip.items.map(item => (
              <div key={item.name} className="linechart-tooltip-row">
                <span className="linechart-tooltip-dot" style={{ background: item.color }} />
                <span className="linechart-tooltip-name">{item.name}</span>
                <span className="linechart-tooltip-val">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="linechart-legend">
        {series.map(s => (
          <span key={s.label} className="linechart-legend-item">
            <span className="linechart-legend-dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
};
