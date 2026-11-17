'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Heart, Bookmark, ArrowRight, Loader2 } from 'lucide-react';
import { useUserStore } from '@/services/userStore';
import { orderService } from '@/services/orderService';
import { useWishlistStore } from '@/services/wishlistStore';
import { useSavedListStore } from '@/services/savedListStore';
import { Order } from '@/types/order';
import { AccountNav } from '@/components/common/AccountNav';
import { formatLKR } from '@/lib/currency';
import { ChangePasswordForm } from '@/components/common/ChangePasswordForm';

export default function AccountOverviewPage() {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.currentUser);
  const fetchCurrentUser = useUserStore((state) => state.fetchCurrentUser);
  const wishlistCount = useWishlistStore((state) => state.itemCount);
  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);
  const savedLists = useSavedListStore((state) => state.lists);
  const fetchLists = useSavedListStore((state) => state.fetchLists);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        await fetchCurrentUser();
        await Promise.all([fetchWishlist(), fetchLists()]);
      } catch {
        // Unauthenticated
      } finally {
        if (mounted) setIsChecking(false);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [fetchCurrentUser, fetchWishlist, fetchLists]);

  useEffect(() => {
    if (!isChecking && !currentUser) {
      router.push('/login');
    }
  }, [isChecking, currentUser, router]);

  useEffect(() => {
    let mounted = true;
    const loadRecentOrders = async () => {
      try {
        const res = await orderService.fetchOrders({ page: 1, limit: 3 });
        const liveList = res?.orders || [];
        if (mounted && liveList.length > 0) {
          setOrders(liveList);
          return;
        }
      } catch {
        // silent fallback
      }
      if (mounted) setOrders(orderService.getAll().slice(0, 3));
    };
    loadRecentOrders();
    return () => { mounted = false; };
  }, []);

  if (isChecking) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0866E8]" />
        <p className="mt-3 text-xs text-slate-500 font-medium">Loading your account details...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        <p className="text-xs text-slate-500 font-medium">Redirecting to login...</p>
        <Link
          href="/login"
          className="mt-4 bg-[#0866E8] hover:bg-[#09285C] text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-xs transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-[#09285C] tracking-tight">Account Overview</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Welcome back, {currentUser.name}! Manage your orders, wishlist, and addresses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <AccountNav />
        </div>

        <div className="lg:col-span-3 space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 flex items-center gap-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0866E8] flex items-center justify-center font-bold">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-black text-[#09285C]">{orders.length}</span>
                <span className="text-xs text-slate-500 block">Recent Orders</span>
              </div>
            </div>

            <Link href="/account/wishlist" className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 flex items-center gap-4 shadow-xs hover:border-[#0866E8]/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center font-bold">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-black text-[#09285C]">
                  {wishlistCount}
                </span>
                <span className="text-xs text-slate-500 block">Wishlist Items</span>
              </div>
            </Link>

            <Link href="/account/saved-lists" className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 flex items-center gap-4 shadow-xs hover:border-[#0866E8]/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Bookmark className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-black text-[#09285C]">
                  {savedLists.length}
                </span>
                <span className="text-xs text-slate-500 block">Saved Stationery Lists</span>
              </div>
            </Link>
          </div>

          {/* Recent Orders Section */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-[#09285C]">Recent Orders</h2>
              <Link href="/account/orders" className="text-xs font-bold text-[#0866E8] hover:underline flex items-center gap-1">
                View all orders <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {orders.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent orders found.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <div key={o.id} className="py-3.5 flex items-center justify-between text-xs gap-3">
                    <div>
                      <span className="font-bold text-[#0866E8] block font-mono">{o.orderNumber}</span>
                      <span className="text-slate-500">{o.items.length} items • {formatLKR(o.totalCents)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F7FAFF] text-[#09285C] border border-blue-100">
                        {o.orderStatus}
                      </span>
                      <Link href={`/orders/${o.id}`} className="text-slate-400 hover:text-[#0866E8] transition-colors p-1">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Change Password Section */}
          <ChangePasswordForm variant="customer" onSuccessRedirect="/login" />
        </div>
      </div>
    </div>
  );
}
