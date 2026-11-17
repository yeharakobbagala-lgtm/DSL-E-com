'use client';

import React from 'react';
import {
  Clock,
  CheckCircle,
  PackageCheck,
  Package,
  Truck,
  CheckCheck,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { OrderStatus } from '@/types/order';

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  onSelectStage?: (stageKey: OrderStatus) => void;
  allowedTransitions?: string[];
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({
  currentStatus,
  createdAt,
  updatedAt,
  onSelectStage,
  allowedTransitions = [],
}) => {
  const norm = (currentStatus || 'PENDING').toUpperCase();
  const isCancelled = norm === 'CANCELLED';

  const stages = [
    { key: 'PENDING', label: 'Order Placed', icon: Clock },
    { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
    { key: 'PROCESSING', label: 'Processing', icon: PackageCheck },
    { key: 'PACKED', label: 'Packed & Ready', icon: Package },
    { key: 'SHIPPED', label: 'Dispatched / In Transit', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCheck },
  ];

  const stageOrder = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'];
  const currentIndex = stageOrder.indexOf(norm);

  if (isCancelled) {
    return (
      <div className="bg-rose-50/60 rounded-3xl border border-rose-200 p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-950">Order Cancelled</h4>
            <p className="text-xs text-rose-700">
              This order was cancelled on {new Date(updatedAt || createdAt).toLocaleString()}. Physical inventory has been returned.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Fulfillment Lifecycle Progress</h3>
          <p className="text-[11px] text-slate-400">Click any available next stage to advance status</p>
        </div>
        <span className="text-[11px] font-bold text-slate-500">
          Created: {new Date(createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="relative pt-2 pb-2">
        {/* Progress bar background line */}
        <div className="absolute top-5 left-6 right-6 h-1 bg-slate-100 -z-0 hidden md:block" />
        <div
          className="absolute top-5 left-6 h-1 bg-[#08275E] transition-all duration-500 -z-0 hidden md:block"
          style={{
            width: `${Math.max(0, Math.min(100, (currentIndex / (stages.length - 1)) * 100))}%`,
          }}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = currentIndex >= idx;
            const isCurrent = currentIndex === idx;
            const isAllowedNext = allowedTransitions.includes(stage.key);

            return (
              <button
                type="button"
                key={stage.key}
                disabled={!isAllowedNext}
                onClick={() => isAllowedNext && onSelectStage && onSelectStage(stage.key as OrderStatus)}
                className={`flex md:flex-col items-center md:items-center gap-3 md:gap-2 text-left md:text-center z-10 p-2 rounded-2xl transition-all ${
                  isAllowedNext
                    ? 'hover:bg-blue-50/80 cursor-pointer group ring-1 ring-blue-300 ring-dashed'
                    : 'cursor-default'
                }`}
                title={
                  isAllowedNext
                    ? `Click to advance order to ${stage.label}`
                    : isCurrent
                    ? 'Current status'
                    : isCompleted
                    ? 'Completed'
                    : 'Pending'
                }
              >
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                    isCurrent
                      ? 'bg-[#08275E] text-white ring-4 ring-[#08275E]/20 scale-110 shadow-sm'
                      : isCompleted
                      ? 'bg-[#08275E] text-white shadow-xs'
                      : isAllowedNext
                      ? 'bg-blue-100 text-[#0066CC] group-hover:bg-[#0066CC] group-hover:text-white group-hover:scale-105'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div
                    className={`text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'text-[#08275E]'
                        : isCompleted
                        ? 'text-slate-800'
                        : isAllowedNext
                        ? 'text-[#0066CC] group-hover:underline'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isCurrent
                      ? 'Current stage'
                      : isCompleted
                      ? 'Completed'
                      : isAllowedNext
                      ? 'Click to advance'
                      : 'Pending'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
