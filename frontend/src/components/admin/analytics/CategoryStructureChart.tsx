'use client';

import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { Layers, FolderTree, CheckCircle2, AlertCircle, Check } from 'lucide-react';

export interface CategoryMetric {
  name: string;
  count: number;
}

interface CategoryStructureChartProps {
  data: CategoryMetric[];
  rootCount: number;
  subCount: number;
  activeCount: number;
  inactiveCount: number;
}

export const CategoryStructureChart: React.FC<CategoryStructureChartProps> = ({
  data,
  rootCount,
  subCount,
  activeCount,
  inactiveCount,
}) => {
  // Format top 5-6 categories for radar polygon
  const radarData = data.slice(0, 6).map((item) => ({
    category: item.name.length > 15 ? `${item.name.substring(0, 13)}...` : item.name,
    fullName: item.name,
    count: item.count,
  }));

  const allActive = inactiveCount === 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between shadow-xs">
      {/* Title */}
      <div className="mb-2">
        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          Category Structure Overview
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Hierarchical balance and product concentration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Radar / Polygon Chart */}
        <div className="md:col-span-7 h-64 sm:h-72 relative flex items-center justify-center">
          {radarData.length > 2 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Tooltip
                  formatter={(val: any, _: any, item: any) => [
                    `${val} products`,
                    item.payload.fullName,
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
                <Radar
                  name="Products"
                  dataKey="count"
                  stroke="#0066CC"
                  fill="#08275E"
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-xs text-slate-400 font-medium">Insufficient categories for radar view</div>
          )}
        </div>

        {/* Hierarchy Stats List */}
        <div className="md:col-span-5 space-y-3.5 pl-0 md:pl-2">
          {/* Root Categories */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <FolderTree className="w-4 h-4 text-[#08275E]" />
              <span>Root Categories</span>
            </div>
            <span className="text-sm font-black text-slate-900">{rootCount}</span>
          </div>

          {/* Subcategories */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Layers className="w-4 h-4 text-[#0066CC]" />
              <span>Subcategories</span>
            </div>
            <span className="text-sm font-black text-slate-900">{subCount}</span>
          </div>

          {/* Active Categories */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-[#08275E]" />
              <span>Active Categories</span>
            </div>
            <span className="text-sm font-black text-slate-900">{activeCount}</span>
          </div>

          {/* Inactive Categories */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>Inactive Categories</span>
            </div>
            <span className="text-sm font-black text-slate-900">{inactiveCount}</span>
          </div>
        </div>
      </div>

      {/* Real-time Health Advisory Note */}
      <div className="mt-4 p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center gap-2.5 text-xs text-[#08275E] font-medium">
        <div className="w-4 h-4 rounded-full bg-blue-100 text-[#08275E] flex items-center justify-center shrink-0">
          <Check className="w-2.5 h-2.5" />
        </div>
        <span>
          {allActive
            ? `Good structure! Your category structure is well organized with all ${activeCount} categories active.`
            : `Notice: You have ${inactiveCount} inactive categories hidden from customers.`}
        </span>
      </div>
    </div>
  );
};
