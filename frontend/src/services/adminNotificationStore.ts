'use client';

import { create } from 'zustand';
import { soundService } from './soundService';
import { orderSocketService, OrderSocketEvent } from './orderSocketService';
import { orderService } from './orderService';

export interface OrderNotificationItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  totalAmountLKR: number;
  itemsCount: number;
  paymentMethod: string;
  createdAt: string;
  read: boolean;
}

interface AdminNotificationState {
  notifications: OrderNotificationItem[];
  unreadCount: number;
  latestToast: OrderNotificationItem | null;
  soundEnabled: boolean;
  isInitialized: boolean;

  // Actions
  init: () => () => void;
  addNotification: (item: Omit<OrderNotificationItem, 'id' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  dismissToast: () => void;
  toggleSound: () => void;
  testSound: () => void;
}

const STORAGE_KEY = 'dsl_admin_order_notifications_v1';
const SEEN_ORDERS_KEY = 'dsl_admin_seen_order_ids_v1';

const getInitialNotifications = (): OrderNotificationItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const getSeenOrderIds = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SEEN_ORDERS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveSeenOrderIds = (set: Set<string>) => {
  if (typeof window === 'undefined') return;
  try {
    const arr = Array.from(set).slice(-200); // keep last 200 IDs
    localStorage.setItem(SEEN_ORDERS_KEY, JSON.stringify(arr));
  } catch {}
};

export const useAdminNotificationStore = create<AdminNotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  latestToast: null,
  soundEnabled: true,
  isInitialized: false,

  init: () => {
    if (typeof window === 'undefined') return () => {};

    const initial = getInitialNotifications();
    const soundOn = soundService.isEnabled();
    const seenIds = getSeenOrderIds();

    // Seed seen IDs with existing orders on startup to avoid alert storms for old orders
    const existingLocal = orderService.getAll();
    existingLocal.forEach((o) => seenIds.add(o.id));
    saveSeenOrderIds(seenIds);

    set({
      notifications: initial,
      unreadCount: initial.filter((n) => !n.read).length,
      soundEnabled: soundOn,
      isInitialized: true,
    });

    // 1. Cross-tab BroadcastChannel
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('dsl_order_notifications_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'NEW_ORDER_NOTIFICATION') {
          const item = event.data.payload;
          get().addNotification(item);
        }
      };
    } catch {}

    // 2. Subscribe to WebSocket Orders Gateway
    const unsubscribeSocket = orderSocketService.subscribeAdmin((event: OrderSocketEvent) => {
      if (
        event.event === 'order.created' ||
        event.event === 'order.placed' ||
        event.event === 'order.payment.confirmed'
      ) {
        const orderData = event.data || {};
        const orderId = event.orderId || orderData.id || orderData.orderId;
        const orderNumber = event.orderNumber || orderData.orderNumber || `DSL-ORD-${Date.now().toString().slice(-4)}`;

        if (orderId && !seenIds.has(orderId)) {
          seenIds.add(orderId);
          saveSeenOrderIds(seenIds);

          get().addNotification({
            orderId,
            orderNumber,
            customerName: orderData.customerName || orderData.customer || 'Store Customer',
            customerEmail: orderData.customerEmail,
            totalAmountLKR:
              typeof orderData.totalLKR === 'number'
                ? orderData.totalLKR
                : typeof orderData.totalCents === 'number'
                ? orderData.totalCents / 100
                : 0,
            itemsCount: orderData.itemsCount || orderData.items?.length || 1,
            paymentMethod: orderData.paymentMethod || 'Online / COD',
            createdAt: event.timestamp || new Date().toISOString(),
          });
        }
      }
    });

    // 3. Polling check every 8 seconds (ensures reliability across offline/mock/network shifts)
    const pollOrders = async () => {
      try {
        // A. Check backend database orders
        const res = await orderService.fetchOrders({ limit: 5 });
        const orders = res?.orders || [];

        for (const order of orders) {
          if (order.id && !seenIds.has(order.id)) {
            // Only trigger if order is recent (created in last 30 minutes)
            const createdTime = new Date(order.createdAt).getTime();
            const now = Date.now();
            const isRecent = now - createdTime < 30 * 60 * 1000;

            seenIds.add(order.id);
            saveSeenOrderIds(seenIds);

            if (isRecent) {
              get().addNotification({
                orderId: order.id,
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                customerEmail: order.customerEmail,
                totalAmountLKR: order.totalCents / 100,
                itemsCount: order.items?.length || 1,
                paymentMethod: order.paymentMethod,
                createdAt: order.createdAt,
              });
            }
          }
        }

        // B. Also check local/client-side storage orders
        const localOrders = orderService.getAll().slice(0, 5);
        for (const lOrder of localOrders) {
          if (lOrder.id && !seenIds.has(lOrder.id)) {
            const createdTime = new Date(lOrder.createdAt).getTime();
            const now = Date.now();
            const isRecent = now - createdTime < 30 * 60 * 1000;

            seenIds.add(lOrder.id);
            saveSeenOrderIds(seenIds);

            if (isRecent) {
              get().addNotification({
                orderId: lOrder.id,
                orderNumber: lOrder.orderNumber,
                customerName: lOrder.customerName,
                customerEmail: lOrder.customerEmail,
                totalAmountLKR: lOrder.totalCents / 100,
                itemsCount: lOrder.items?.length || 1,
                paymentMethod: lOrder.paymentMethod,
                createdAt: lOrder.createdAt,
              });
            }
          }
        }
      } catch {
        // silent polling catch
      }
    };

    // Initial poll after 2 seconds
    const initialPollTimeout = setTimeout(pollOrders, 2000);
    const pollInterval = setInterval(pollOrders, 8000);

    return () => {
      clearTimeout(initialPollTimeout);
      clearInterval(pollInterval);
      unsubscribeSocket();
      channel?.close();
    };
  },

  addNotification: (item) => {
    const newItem: OrderNotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      read: false,
    };

    // 1. Play audio chime
    soundService.playOrderChime();

    // 2. Update state & persist
    set((state) => {
      const updated = [newItem, ...state.notifications].slice(0, 50);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}

      return {
        notifications: updated,
        unreadCount: state.unreadCount + 1,
        latestToast: newItem,
      };
    });

    // 3. Broadcast across tabs
    try {
      const channel = new BroadcastChannel('dsl_order_notifications_channel');
      channel.postMessage({ type: 'NEW_ORDER_NOTIFICATION', payload: item });
      channel.close();
    } catch {}
  },

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return {
        notifications: updated,
        unreadCount: 0,
      };
    });
  },

  clearAll: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    set({
      notifications: [],
      unreadCount: 0,
      latestToast: null,
    });
  },

  dismissToast: () => {
    set({ latestToast: null });
  },

  toggleSound: () => {
    const next = !get().soundEnabled;
    soundService.setEnabled(next);
    set({ soundEnabled: next });
  },

  testSound: () => {
    soundService.testSound();
  },
}));
