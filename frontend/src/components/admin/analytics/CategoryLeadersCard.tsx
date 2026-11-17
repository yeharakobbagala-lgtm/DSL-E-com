'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';

export interface CategoryLeader {
  id: string;
  name: string;
  count: number;
}

interface CategoryLeadersCardProps {
  categories: CategoryLeader[];
  totalProducts: number;
}

export const CategoryLeadersCard: React.FC<CategoryLeadersCardProps> = ({
  categories,
  totalProducts,
}) => {
  const topFive = categories.slice(0, 5);
  const topCountSum = topFive.reduce((acc, curr) => acc + curr.count, 0);
  const topPercentageShare =
    totalProducts > 0 ? Math.round((topCountSum / totalProducts) * 100) : 0;

  // Max count for scaling the progress bar
  const maxCount = Math.max(...topFive.map((c) => c.count), 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between shadow-xs">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Top Category Leaders
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Ranked by catalog volume</p>
          </div>
          <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
            By Product Count
          </span>
        </div>

        {/* Ranked Progress Bars */}
        <div className="space-y-4">
          {topFive.map((cat, idx) => {
            const pctShare =
              totalProducts > 0 ? Math.round((cat.count / totalProducts) * 100) : 0;
            const barWidth = Math.round((cat.count / maxCount) * 100);

            return (
              <div key={cat.id || idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 truncate max-w-[200px]">
                    {cat.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">{cat.count}</span>
                    <span className="text-[11px] font-semibold text-slate-400 w-8 text-right">
                      {pctShare}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#08275E] rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}

          {topFive.length === 0 && (
            <div className="text-xs text-slate-400 py-6 text-center">
              No categories found.
            </div>
          )}
        </div>
      </div>

      {/* Footer Share Summary */}
      <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-2 text-xs font-semibold text-[#08275E]">
        <TrendingUp className="w-4 h-4 text-[#0066CC] shrink-0" />
        <span>
          These top categories account for {topPercentageShare}% of all products in your catalog.
        </span>
      </div>
    </div>
  );
};
