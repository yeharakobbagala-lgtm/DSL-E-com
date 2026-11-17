'use client';

import React from 'react';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useUserStore } from '@/services/userStore';
import { ChangePasswordForm } from '@/components/common/ChangePasswordForm';

export default function AdminProfilePage() {
  const currentUser = useUserStore((state) => state.currentUser);
  const roleSlug = useUserStore((state) => state.roleSlug);
  const permissions = useUserStore((state) => state.permissions);

  const displayName = currentUser?.name || 'Administrator';
  const displayEmail = currentUser?.email || 'admin@dslstationery.lk';
  const displayPhone = currentUser?.phone || 'Not configured';
  const displayRole =
    currentUser?.roleName ||
    (roleSlug === 'super_admin' ? 'Super Administrator' : currentUser?.role || 'Administrator');

  const isSuperAdmin = roleSlug === 'super_admin' || currentUser?.roleSlug === 'super_admin';
  const activePermissions = isSuperAdmin ? ['* (Full Administrative Sovereign Access)'] : permissions;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span>Admin Console</span>
          <span>/</span>
          <span className="text-slate-800 font-semibold">My Account</span>
          <span>/</span>
          <span className="text-[#08275E] font-bold">Profile &amp; Security</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-[#08275E]" />
          <span>Administrator Profile &amp; Security</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your administrative identity, dynamic RBAC privileges, and update your personal password.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Admin Identity & RBAC Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Identity Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-[#08275E] text-white flex items-center justify-center font-black text-sm shadow-xs">
                {displayName
                  .split(' ')
                  .filter(Boolean)
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'AD'}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-slate-900 text-sm truncate">{displayName}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-bold text-emerald-700">Account Active</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Assigned Role</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 font-extrabold text-[10px] uppercase">
                    {displayRole}
                  </span>
                  {isSuperAdmin && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded">
                      Sovereign
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Email Address</span>
                <span className="font-bold text-slate-800 break-all">{displayEmail}</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Phone Number</span>
                <span className="font-semibold text-slate-700">{displayPhone}</span>
              </div>
            </div>
          </div>

          {/* Security Notice Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
              <Lock className="w-4 h-4" />
              <span>Session Policy</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              For security compliance, changing your password revokes all active refresh-token sessions across all logged-in browsers and devices immediately.
            </p>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              Audit action: <code className="text-sky-300 bg-slate-800 px-1.5 py-0.5 rounded">PASSWORD_CHANGED</code>
            </div>
          </div>
        </div>

        {/* Right Column: Change Password Component */}
        <div className="lg:col-span-2">
          <ChangePasswordForm variant="admin" onSuccessRedirect="/admin/login" />
        </div>
      </div>
    </div>
  );
}
