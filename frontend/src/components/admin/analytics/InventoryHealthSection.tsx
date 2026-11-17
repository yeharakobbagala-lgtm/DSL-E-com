'use client';

import React from 'react';
import { Lightbulb, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface InventoryHealthSectionProps {
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  onFilterClick?: (status: 'HEALTHY' | 'LOW_STOCK' | 'OUT_OF_STOCK') => void;
}

export const InventoryHealthSection: React.FC<InventoryHealthSectionProps> = ({
  inStockCount,
  lowStockCount,
  outOfStockCount,
  onFilterClick,
}) => {
  const total = inStockCount + lowStockCount + outOfStockCount;
  const inStockPct = total > 0 ? Math.round((inStockCount / total) * 100) : 0;
  const lowStockPct = total > 0 ? Math.round((lowStockCount / total) * 100) : 0;
  const outOfStockPct = total > 0 ? Math.max(0, 100 - inStockPct - lowStockPct) : 0;

  // Diagnostic message
  let alertMessage = '';
  let alertStyle = '';

  if (outOfStockPct > 30 || lowStockPct > 30) {
    alertMessage = `Your inventory health is generally at risk. ${lowStockCount} items are low in stock and ${outOfStockCount} are out of stock.`;
    alertStyle = 'bg-amber-50/70 border-amber-200/60 text-amber-900';
  } else if (outOfStockCount > 0) {
    alertMessage = `Catalog is performing well. ${inStockPct}% of items have healthy stock, but ${outOfStockCount} items require immediate reordering.`;
    alertStyle = 'bg-blue-50/70 border-blue-200/60 text-blue-900';
  } else {
    alertMessage = `Outstanding inventory status! All products currently have healthy, active stock levels.`;
    alertStyle = 'bg-blue-50/70 border-blue-200/60 text-[#08275E]';
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between shadow-xs">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Inventory Health
          </h2>
          <Link
            href="/admin/inventory"
            className="text-xs font-bold text-[#08275E] hover:text-[#0066CC] inline-flex items-center gap-1 transition-colors"
          >
            <span>View Details</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          {/* In Stock */}
          <div
            onClick={() => onFilterClick && onFilterClick('HEALTHY')}
            className={`space-y-1.5 ${onFilterClick ? 'cursor-pointer group' : ''}`}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 group-hover:text-slate-900">In Stock</span>
              <span className="text-slate-900 font-bold">{inStockPct}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0066CC] rounded-full transition-all duration-500"
                style={{ width: `${inStockPct}%` }}
              />
            </div>
          </div>

          {/* Low Stock */}
          <div
            onClick={() => onFilterClick && onFilterClick('LOW_STOCK')}
            className={`space-y-1.5 ${onFilterClick ? 'cursor-pointer group' : ''}`}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 group-hover:text-slate-900">Low Stock</span>
              <span className="text-slate-900 font-bold">{lowStockPct}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${lowStockPct}%` }}
              />
            </div>
          </div>

          {/* Out of Stock */}
          <div
            onClick={() => onFilterClick && onFilterClick('OUT_OF_STOCK')}
            className={`space-y-1.5 ${onFilterClick ? 'cursor-pointer group' : ''}`}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600 group-hover:text-slate-900">Out of Stock</span>
              <span className="text-slate-900 font-bold">{outOfStockPct}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${outOfStockPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Advisory Callout */}
      <div className={`mt-6 p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${alertStyle}`}>
        <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
        <span className="font-medium">{alertMessage}</span>
      </div>
    </div>
  );
};
