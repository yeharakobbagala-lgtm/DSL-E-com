'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Volume2,
  VolumeX,
  ShoppingBag,
  CheckCircle,
  ExternalLink,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';
import { useAdminNotificationStore, OrderNotificationItem } from '@/services/adminNotificationStore';
import { formatLKR } from '@/lib/currency';

function formatRelativeTime(dateString: string): string {
  try {
    const diffSeconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diffSeconds < 45) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return `${Math.floor(diffSeconds / 86400)}d ago`;
  } catch {
    return 'Recently';
  }
}

export const AdminOrderNotificationDropdown: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notifications = useAdminNotificationStore((state) => state.notifications);
  const unreadCount = useAdminNotificationStore((state) => state.unreadCount);
  const soundEnabled = useAdminNotificationStore((state) => state.soundEnabled);
  const init = useAdminNotificationStore((state) => state.init);
  const markAsRead = useAdminNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useAdminNotificationStore((state) => state.markAllAsRead);
  const clearAll = useAdminNotificationStore((state) => state.clearAll);
  const toggleSound = useAdminNotificationStore((state) => state.toggleSound);
  const testSound = useAdminNotificationStore((state) => state.testSound);

  useEffect(() => {
    const cleanup = init();
    return () => {
      cleanup();
    };
  }, [init]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (item: OrderNotificationItem) => {
    markAsRead(item.id);
    setIsOpen(false);
    router.push(`/admin/orders?search=${encodeURIComponent(item.orderNumber)}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 1. Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Order Notifications"
        title="New Order Alerts"
        className={`relative p-2 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-[#0066CC] text-white border-[#0066CC] shadow-md shadow-blue-500/20'
            : unreadCount > 0
            ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 shadow-xs'
            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <Bell className={`w-4.5 h-4.5 ${unreadCount > 0 ? 'animate-wiggle text-[#0066CC]' : ''}`} />

        {/* Pulsing Ripple when unread orders exist */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-rose-600 text-[10px] font-black text-white shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* 2. Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[340px] sm:w-[400px] max-w-[92vw] bg-white rounded-3xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-fade-in select-none">
          {/* Header Bar */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-[#0B2556] to-[#084594] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                <Bell className="w-4 h-4 text-[#FFD84D]" />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight leading-none">Order Alerts</h4>
                <span className="text-[11px] text-white/70">
                  {unreadCount > 0 ? `${unreadCount} new order${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                </span>
              </div>
            </div>

            {/* Quick Controls: Sound Toggle & Test */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={testSound}
                title="Test Chime Sound"
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white transition cursor-pointer flex items-center gap-1"
              >
                <span>Chime</span>
                <Sparkles className="w-3 h-3 text-[#FFD84D]" />
              </button>

              <button
                type="button"
                onClick={toggleSound}
                title={soundEnabled ? 'Mute sound alerts' : 'Enable sound alerts'}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  soundEnabled
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30'
                    : 'bg-rose-500/20 border-rose-400/40 text-rose-300 hover:bg-rose-500/30'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Sub-bar: Status and Mark All As Read */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-500">
              Sound alert: <strong className={soundEnabled ? 'text-emerald-600' : 'text-slate-400'}>{soundEnabled ? 'ON' : 'OFF'}</strong>
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[#0066CC] hover:text-[#004C99] font-bold transition cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-semibold">No order notifications yet.</p>
                <p className="text-[11px] text-slate-400 leading-normal">
                  When a customer places an order, it will appear here immediately with sound.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 relative ${
                    item.read ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50/80'
                  }`}
                >
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <ShoppingBag className="w-4.5 h-4.5" />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 leading-tight">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-black text-slate-900 truncate">
                        {item.orderNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium mb-1">
                      <span className="truncate">{item.customerName}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 shrink-0">{item.itemsCount} item{item.itemsCount > 1 ? 's' : ''}</span>
                    </div>

                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs font-black text-[#0066CC]">
                        {formatLKR(item.totalAmountLKR)}
                      </span>
                      <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                        {item.paymentMethod.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Unread indicator dot */}
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-[#0066CC] shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-slate-400 hover:text-rose-600 transition cursor-pointer flex items-center gap-1 text-[11px] font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear history</span>
              </button>
            )}
            <Link
              href="/admin/orders"
              onClick={() => setIsOpen(false)}
              className="text-[#0066CC] hover:text-[#004C99] font-bold text-xs flex items-center gap-1 ml-auto"
            >
              <span>Manage all orders</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// FLOATING REAL-TIME ORDER TOAST
// Appears at top-right of admin console when a customer places an order
// ============================================================================
export const AdminOrderToast: React.FC = () => {
  const router = useRouter();
  const latestToast = useAdminNotificationStore((state) => state.latestToast);
  const dismissToast = useAdminNotificationStore((state) => state.dismissToast);
  const markAsRead = useAdminNotificationStore((state) => state.markAsRead);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!latestToast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 8000);
    return () => clearTimeout(timer);
  }, [latestToast, dismissToast]);

  if (!latestToast) return null;

  const handleOpen = () => {
    markAsRead(latestToast.id);
    dismissToast();
    router.push(`/admin/orders?search=${encodeURIComponent(latestToast.orderNumber)}`);
  };

  return (
    <aside
      aria-label="New Order Notification"
      className="fixed top-20 right-4 sm:right-6 z-[9999] max-w-sm w-full bg-white/98 backdrop-blur-xl rounded-3xl border-2 border-emerald-400 shadow-[0_20px_60px_rgba(5,150,105,0.22)] p-4 text-slate-900 animate-slide-in select-none"
    >
      <div className="flex items-start gap-3">
        {/* Animated Green Order Icon */}
        <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30 animate-pulse">
          <ShoppingBag className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              🎉 New Order Placed!
            </span>
            <button
              type="button"
              onClick={dismissToast}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm font-black text-slate-900 mt-1 truncate">
            {latestToast.orderNumber}
          </div>

          <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
            {latestToast.customerName} • {latestToast.itemsCount} item{latestToast.itemsCount > 1 ? 's' : ''}
          </p>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <span className="text-sm font-black text-[#0066CC]">
              {formatLKR(latestToast.totalAmountLKR)}
            </span>
            <button
              type="button"
              onClick={handleOpen}
              className="px-3.5 py-1.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <span>View Order</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
