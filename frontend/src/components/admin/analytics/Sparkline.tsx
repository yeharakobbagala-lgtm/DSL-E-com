'use client';

import React from 'react';

interface SparklineProps {
  data: number[];
  color?: string; // hex color or tailwind color
  height?: number;
  width?: number;
  showGradient?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#0066CC',
  height = 36,
  width = 100,
  showGradient = true,
}) => {
  if (!data || data.length < 2) {
    // Fallback decorative wave if insufficient data
    data = [20, 25, 22, 30, 28, 38, 35, 42];
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const padding = 4;
  const effectiveHeight = height - padding * 2;
  const effectiveWidth = width;

  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * effectiveWidth;
    const y = effectiveHeight - ((val - min) / range) * effectiveHeight + padding;
    return { x, y };
  });

  // Build smooth cubic bezier curve
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX = (curr.x + next.x) / 2;
    pathD += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
  }

  const areaD = `${pathD} L ${effectiveWidth} ${height} L 0 ${height} Z`;
  const gradientId = `sparkline-grad-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {showGradient && <path d={areaD} fill={`url(#${gradientId})`} />}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
