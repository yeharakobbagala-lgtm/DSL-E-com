'use client';

import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

interface DonutDistributionChartProps {
  title: string;
  subtitle?: string;
  segments: DonutSegment[];
  centerLabel?: string;
  centerSublabel?: string;
  filterOptions?: Array<{ id: string; name: string }>;
  selectedFilter?: string;
  onFilterChange?: (filterId: string) => void;
  height?: number;
}

export const DonutDistributionChart: React.FC<DonutDistributionChartProps> = ({
  title,
  subtitle,
  segments,
  centerLabel,
  centerSublabel = 'Total Items',
  filterOptions,
  selectedFilter = 'all',
  onFilterChange,
  height = 240,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalValue = segments.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        {filterOptions && filterOptions.length > 0 && (
          <div className="relative">
            <select
              value={selectedFilter}
              onChange={(e) => onFilterChange && onFilterChange(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {filterOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Content: Donut + Legend */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Donut Chart with Center Text */}
        <div className="md:col-span-6 relative flex items-center justify-center" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                formatter={(val: any) => [
                  `${Number(val).toLocaleString()} (${totalValue > 0 ? Math.round((Number(val) / totalValue) * 100) : 0}%)`,
                  '',
                ]}
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
                itemStyle={{ color: '#FFFFFF' }}
              />
              <Pie
                data={segments}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={88}
                paddingAngle={segments.filter((s) => s.value > 0).length > 1 ? 3 : 0}
                dataKey="value"
                onMouseEnter={(_, index) => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {segments.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.6}
                    className="transition-opacity duration-200 cursor-pointer"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center absolute text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {centerLabel || totalValue.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {centerSublabel}
            </span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="md:col-span-6 space-y-3.5 pl-0 md:pl-4">
          {segments.map((seg, idx) => {
            const percentage = totalValue > 0 ? Math.round((seg.value / totalValue) * 100) : 0;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between text-xs py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                  hoveredIndex === idx ? 'bg-slate-50' : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="font-semibold text-slate-700">{seg.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-slate-900">
                    {seg.value.toLocaleString()}
                  </span>
                  <span className="font-semibold text-slate-400 w-10 text-right">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
