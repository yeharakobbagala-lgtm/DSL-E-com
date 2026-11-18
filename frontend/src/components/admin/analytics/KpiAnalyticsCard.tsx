'use client';

import React from 'react';
import { Sparkline } from './Sparkline';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export type KpiColorTheme = 'emerald' | 'blue' | 'amber' | 'rose' | 'purple';

interface KpiAnalyticsCardProps {
  title: string;
  value: string | number;
  trendText?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  colorTheme?: KpiColorTheme;
  icon: React.ReactNode;
  sparklineData?: number[];
  isActive?: boolean;
  onClick?: () => void;
  isLoading?: boolean;
}

const themeStyles: Record<
  KpiColorTheme,
  {
    iconBg: string;
    iconColor: string;
    chartColor: string;
    activeBorder: string;
    trendColor: string;
  }
> = {
  emerald: {
    iconBg: 'bg-[#0066CC]',
    iconColor: 'text-white',
    chartColor: '#0066CC',
    activeBorder: 'border-[#0066CC] ring-2 ring-blue-100',
    trendColor: 'text-[#08275E]',
  },
  blue: {
    iconBg: 'bg-[#08275E]',
    iconColor: 'text-white',
    chartColor: '#0066CC',
    activeBorder: 'border-[#08275E] ring-2 ring-blue-100',
    trendColor: 'text-[#08275E]',
  },
  amber: {
    iconBg: 'bg-amber-500',
    iconColor: 'text-white',
    chartColor: '#F59E0B',
    activeBorder: 'border-amber-500 ring-2 ring-amber-100',
    trendColor: 'text-amber-700',
  },
  rose: {
    iconBg: 'bg-rose-500',
    iconColor: 'text-white',
    chartColor: '#EF4444',
    activeBorder: 'border-rose-500 ring-2 ring-rose-100',
    trendColor: 'text-rose-700',
  },
  purple: {
    iconBg: 'bg-indigo-600',
    iconColor: 'text-white',
    chartColor: '#6366F1',
    activeBorder: 'border-indigo-500 ring-2 ring-indigo-100',
    trendColor: 'text-indigo-700',
  },
};

const renderKpiValue = (val: string | number) => {
  if (typeof val === 'string') {
    const match = val.match(/^([+-]?)\s*(Rs\.?|LKR)\s*([\d,]+(?:\.\d+)?.*)$/i);
    if (match) {
      const sign = match[1];
      const numPart = match[3];
      return (
        <span className="inline-flex items-baseline">
          {sign && <span className="mr-0.5">{sign}</span>}
          <span className="text-xs sm:text-sm font-bold text-slate-400 mr-1.5 uppercase tracking-normal select-none">
            Rs.
          </span>
          <span>{numPart}</span>
        </span>
      );
    }
  }
  return val;
};

export const KpiAnalyticsCard: React.FC<KpiAnalyticsCardProps> = ({
  title,
  value,
  trendText,
  trendDirection = 'up',
  colorTheme = 'blue',
  icon,
  sparklineData,
  isActive = false,
  onClick,
  isLoading = false,
}) => {
  const theme = themeStyles[colorTheme];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`relative bg-white rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between ${
        isActive ? theme.activeBorder : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'
      } ${onClick ? 'cursor-pointer select-none' : ''}`}
    >
      {/* Top row: Icon on left, Sparkline on right */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${theme.iconBg} ${theme.iconColor}`}
        >
          {icon}
        </div>
        <div className="w-24 sm:w-28 flex justify-end">
          {isLoading ? (
            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded" />
          ) : (
            <Sparkline
              data={sparklineData || [15, 18, 16, 24, 22, 29, 35]}
              color={theme.chartColor}
              height={32}
              width={100}
            />
          )}
        </div>
      </div>

      {/* Middle row: Title & Big Value */}
      <div className="space-y-1">
        <div className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          {title}
        </div>
        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {isLoading ? (
            <div className="h-8 w-20 bg-slate-200 animate-pulse rounded" />
          ) : (
            renderKpiValue(value)
          )}
        </div>
      </div>

      {/* Bottom row: Trend or Subtitle */}
      {trendText && (
        <div className="mt-3 pt-2 border-t border-slate-50 flex items-center gap-1.5 text-xs font-semibold">
          {trendDirection === 'up' && (
            <ArrowUpRight className={`w-3.5 h-3.5 ${theme.trendColor}`} />
          )}
          {trendDirection === 'down' && (
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
          )}
          {trendDirection === 'neutral' && (
            <Minus className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className={theme.trendColor}>{trendText}</span>
        </div>
      )}
    </div>
  );
};
