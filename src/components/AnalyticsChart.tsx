import { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Link2, MousePointerClick, Calendar } from 'lucide-react';

interface ChartData {
  date: string;
  count: number;
}

interface TopLinkData {
  linkId: string;
  title: string;
  clicksCount: number;
}

interface AnalyticsChartProps {
  clicksOverTime: ChartData[];
  clicksByLink: TopLinkData[];
}

export default function AnalyticsChart({ clicksOverTime, clicksByLink }: AnalyticsChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG dimensions
  const width = 600;
  const height = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find max click count to scale Y axis
  const maxVal = Math.max(...clicksOverTime.map((d) => d.count), 5); // default minimum of 5 for scaling
  const pointsCount = clicksOverTime.length;

  // Calculate coordinates for points
  const points = clicksOverTime.map((d, index) => {
    const x = paddingLeft + (index / (pointsCount - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (d.count / maxVal) * chartHeight;
    return { x, y, count: d.count, date: d.date };
  });

  // Construct SVG path for area fill and line
  let linePath = '';
  let areaPath = '';

  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');
    areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
  }

  // Format date for visual labels (e.g., "06/25")
  const formatDateLabel = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length >= 3) {
        return `${parts[1]}/${parts[2]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div id="analytics-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Clicks over time chart (2 cols on desktop) */}
      <motion.div
        id="clicks-trend-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="lg:col-span-2 p-5 bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-slate-200">Click Trends (Last 7 Days)</h3>
          </div>
          <div className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Exact Daily Tracker</span>
          </div>
        </div>

        {/* SVG Render */}
        <div id="svg-chart-container" className="relative w-full overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height="100%"
            className="overflow-visible"
          >
            <defs>
              <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = paddingTop + ratio * chartHeight;
              const val = Math.round(maxVal * (1 - ratio));
              return (
                <g key={i} className="opacity-40">
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#334155"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 10}
                    y={y + 4}
                    fill="#94a3b8"
                    fontSize="10"
                    textAnchor="end"
                    className="font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Area under the line */}
            {areaPath && (
              <path
                d={areaPath}
                fill="url(#chart-glow)"
                className="transition-all duration-300"
              />
            )}

            {/* Sparkline Path */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
            )}

            {/* Interactive Data Points */}
            {points.map((point, index) => (
              <g
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Invisible hover capture area */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="15"
                  fill="transparent"
                />
                
                {/* The point itself */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={hoveredIndex === index ? '6' : '4'}
                  fill={hoveredIndex === index ? '#10b981' : '#0f172a'}
                  stroke="#10b981"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />
              </g>
            ))}

            {/* Date Labels (X-Axis) */}
            {points.map((point, index) => (
              <text
                key={index}
                x={point.x}
                y={height - 8}
                fill="#64748b"
                fontSize="10"
                textAnchor="middle"
                className="font-mono"
              >
                {formatDateLabel(point.date)}
              </text>
            ))}
          </svg>

          {/* Interactive Tooltip Overlay */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <motion.div
              id="chart-tooltip"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                position: 'absolute',
                left: `${(points[hoveredIndex].x / width) * 100}%`,
                top: `${(points[hoveredIndex].y / height) * 100 - 35}%`,
                transform: 'translateX(-50%)',
              }}
              className="bg-slate-950 border border-emerald-500/30 text-white p-2 rounded-lg shadow-2xl text-xs flex flex-col pointer-events-none z-10 whitespace-nowrap min-w-[90px]"
            >
              <span className="font-semibold text-emerald-400 font-mono text-center">
                {points[hoveredIndex].count} Click(s)
              </span>
              <span className="text-[10px] text-slate-400 text-center mt-0.5">
                {new Date(points[hoveredIndex].date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Top Performing Links Card */}
      <motion.div
        id="top-links-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="p-5 bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MousePointerClick className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-slate-200">Top Performing Links</h3>
          </div>

          <div id="top-links-list" className="space-y-3">
            {clicksByLink.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-500 text-sm">
                <Link2 className="w-8 h-8 opacity-20 mb-2 stroke-1" />
                <span>No click data recorded yet</span>
              </div>
            ) : (
              clicksByLink.map((item, index) => {
                const maxClicks = Math.max(...clicksByLink.map((l) => l.clicksCount), 1);
                const widthPercent = Math.max((item.clicksCount / maxClicks) * 100, 4);

                return (
                  <div id={`top-link-${item.linkId}`} key={item.linkId} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-300 truncate max-w-[170px]" title={item.title}>
                        {item.title}
                      </span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        {item.clicksCount} Click(s)
                      </span>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPercent}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`h-full rounded-full ${
                          index === 0
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : index === 1
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-400'
                            : 'bg-gradient-to-r from-slate-600 to-slate-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 border-t border-slate-800/60 pt-3 mt-4 flex items-center justify-between">
          <span>Ranking is automatic</span>
          <span className="font-mono text-emerald-400 font-semibold">Live Feed</span>
        </div>
      </motion.div>
    </div>
  );
}
