'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Clock, Truck, CheckCircle2, Zap } from 'lucide-react';

export interface DailyVelocityPoint {
  date: string;
  count: number;
}

interface OrderVelocityChartProps {
  velocityData: DailyVelocityPoint[];
  pendingCount: number;
  shippedCount: number;
  deliveredCount: number;
  fulfillmentRate: number; // 0 to 100
  grossRevenueLkr: number;
}

export const OrderVelocityChart: React.FC<OrderVelocityChartProps> = ({
  velocityData,
  pendingCount,
  shippedCount,
  deliveredCount,
  fulfillmentRate,
  grossRevenueLkr,
}) => {
  // Default fallback 14-day data if velocity is empty
  const chartData =
    velocityData && velocityData.length > 0
      ? velocityData
      : [
          { date: 'Oct 21', count: 1 },
          { date: 'Oct 25', count: 0 },
          { date: 'Oct 29', count: 2 },
          { date: 'Nov 02', count: 1 },
          { date: 'Nov 06', count: 3 },
          { date: 'Nov 10', count: 2 },
          { date: 'Nov 14', count: 4 },
          { date: 'Nov 17', count: 5 },
        ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 8 cols: Order Velocity & Dispatch Status */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between shadow-xs">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black tracking-wider text-[#08275E] uppercase">
                  ORDER VELOCITY
                </span>
                <span className="bg-blue-100 text-[#08275E] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ACTIVE TREND
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dispatch frequency across statistics range
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Area Chart */}
            <div className="md:col-span-8 h-48 sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0066CC" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#08275E" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${val} orders`, 'Dispatched']}
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
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#08275E"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#velocityGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Right Status Counters */}
            <div className="md:col-span-4 space-y-3 pl-0 md:pl-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-orange-50/70 border border-orange-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-orange-950">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span>PENDING</span>
                </div>
                <span className="text-sm font-black text-orange-950">{pendingCount}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/70 border border-blue-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-950">
                  <Truck className="w-4 h-4 text-[#0066CC]" />
                  <span>SHIPPED</span>
                </div>
                <span className="text-sm font-black text-blue-950">{shippedCount}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-[#08275E]" />
                  <span>DELIVERED</span>
                </div>
                <span className="text-sm font-black text-slate-900">{deliveredCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fulfillment Rate Bar */}
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-bold">
          <span className="text-slate-400 uppercase tracking-wider">FULFILLMENT RATE</span>
          <span className="text-[#08275E]">{Math.round(fulfillmentRate)}% Delivered</span>
        </div>
      </div>

      {/* Right 4 cols: Volume Share & Gross Revenue */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-black tracking-wider text-slate-700 uppercase mb-4">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span>VOLUME SHARE</span>
          </div>

          <div className="my-auto py-8 text-center">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              <span className="text-sm sm:text-base font-semibold text-slate-400 mr-1.5 select-none">Rs.</span>
              <span>{grossRevenueLkr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">
              GROSS REVENUE
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500 font-medium">
          Authoritative audited revenue across all channels
        </div>
      </div>
    </div>
  );
};
