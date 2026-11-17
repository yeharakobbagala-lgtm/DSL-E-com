'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useUserStore } from '@/services/userStore';

interface ChangePasswordFormProps {
  variant?: 'customer' | 'admin';
  onSuccessRedirect?: string;
  onSuccess?: () => void;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  variant = 'customer',
  onSuccessRedirect,
  onSuccess,
}) => {
  const router = useRouter();
  const changePassword = useUserStore((state) => state.changePassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password complexity checks (matching backend Zod schema)
  const hasMinLength = newPassword.length >= 8;
  const hasMaxLength = newPassword.length <= 128;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isDifferentFromCurrent = currentPassword.length > 0 && newPassword !== currentPassword;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmNewPassword;

  const isPasswordValid =
    hasMinLength &&
    hasMaxLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber;

  const canSubmit =
    currentPassword.trim().length > 0 &&
    isPasswordValid &&
    passwordsMatch &&
    isDifferentFromCurrent &&
    !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword) {
      setErrorMessage('Current password is required.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('New password does not satisfy all complexity requirements.');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage('New password cannot be identical to your current password.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      // Clear form inputs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      setSuccessMessage(
        res?.message || 'Password changed successfully! All active sessions have been revoked.'
      );

      if (onSuccess) {
        onSuccess();
      }

      // Handle reauthentication / redirect
      const targetUrl =
        onSuccessRedirect || (variant === 'admin' ? '/admin/login' : '/login');

      setTimeout(() => {
        router.push(targetUrl);
      }, 1800);
    } catch (err: any) {
      if (err?.status === 401 || err?.statusCode === 401) {
        setErrorMessage('Your session has expired. Please sign in again.');
        setTimeout(() => {
          router.push(variant === 'admin' ? '/admin/login' : '/login');
        }, 1500);
      } else {
        setErrorMessage(
          err?.message ||
            err?.data?.message ||
            'Failed to change password. Please verify your current password.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCustomer = variant === 'customer';
  const primaryBg = isCustomer ? 'bg-[#0866E8] hover:bg-[#09285C]' : 'bg-[#08275E] hover:bg-[#0B1528]';
  const focusRing = isCustomer ? 'focus:ring-blue-100 focus:border-[#0866E8]' : 'focus:ring-sky-100 focus:border-[#08275E]';

  return (
    <div className={`bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs ${isCustomer ? '' : 'border-slate-200'}`}>
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
          isCustomer ? 'bg-blue-50 text-[#0866E8]' : 'bg-slate-100 text-[#08275E]'
        }`}>
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            {isCustomer ? 'Change Account Password' : 'Change Administrator Password'}
          </h2>
          <p className="text-xs text-slate-500">
            Update your password to keep your account protected. Changing your password will sign out all other devices.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-700 flex items-start gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">Password Change Failed</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-800 flex items-start gap-3 shadow-2xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm block">Password Changed Successfully!</span>
            <p>{successMessage}</p>
            <p className="text-[11px] text-emerald-700 font-medium pt-1 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Redirecting to sign-in page...</span>
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Current Password Field */}
        <div>
          <label className="font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
            <span>Current Password</span>
            <span className="text-[11px] font-normal text-slate-400">Required</span>
          </label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              required
              disabled={isSubmitting || Boolean(successMessage)}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              className={`w-full pl-4 pr-11 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 ${focusRing} transition-all text-slate-800 bg-slate-50/50 disabled:opacity-60`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
              aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password Field */}
        <div>
          <label className="font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
            <span>New Password</span>
            <span className="text-[11px] font-normal text-slate-400">Min 8 characters</span>
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              required
              disabled={isSubmitting || Boolean(successMessage)}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new strong password"
              className={`w-full pl-4 pr-11 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 ${focusRing} transition-all text-slate-800 bg-slate-50/50 disabled:opacity-60`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
              aria-label={showNew ? 'Hide new password' : 'Show new password'}
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Password Strength Checklist */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 text-[11px]">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Password Policy Requirements</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-600">
            <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span>At least 8 characters</span>
            </div>
            <div className={`flex items-center gap-2 ${hasUppercase ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasUppercase ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span>One uppercase letter (A-Z)</span>
            </div>
            <div className={`flex items-center gap-2 ${hasLowercase ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasLowercase ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span>One lowercase letter (a-z)</span>
            </div>
            <div className={`flex items-center gap-2 ${hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span>One numeric digit (0-9)</span>
            </div>
          </div>
        </div>

        {/* Confirm New Password Field */}
        <div>
          <label className="font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
            <span>Confirm New Password</span>
            {confirmNewPassword.length > 0 && (
              <span className={`text-[11px] font-bold ${passwordsMatch ? 'text-emerald-600' : 'text-rose-500'}`}>
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              required
              disabled={isSubmitting || Boolean(successMessage)}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Re-enter your new password"
              className={`w-full pl-4 pr-11 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 ${focusRing} transition-all text-slate-800 bg-slate-50/50 disabled:opacity-60`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit || Boolean(successMessage)}
            className={`w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 ${primaryBg} disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-6 rounded-2xl font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Save New Password</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
