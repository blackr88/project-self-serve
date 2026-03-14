'use client';

import { useState, useEffect } from 'react';
import { Lock, Loader2, User, Shield, AlertCircle, Check, Mail, Calendar } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDate, APP_DOMAIN } from '@/lib/constants';

export default function SettingsPage() {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/user')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUser(data.data.user);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePasswordChange = (e) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPasswordError('');
    setPasswordSuccess(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      });

      const data = await res.json();

      if (!data.success) {
        setPasswordError(data.error || 'Failed to change password');
        setChangingPassword(false);
        return;
      }

      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    } catch {
      setPasswordError('Network error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Settings</h1>
        <p className="text-surface-500 text-sm mt-1">
          Manage your account settings
        </p>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-surface-100 flex items-center gap-2">
          <User className="w-4 h-4 text-surface-500" />
          <h3 className="font-semibold text-surface-800">Account Information</h3>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              <div className="animate-shimmer h-5 w-48 rounded" />
              <div className="animate-shimmer h-5 w-36 rounded" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-surface-400" />
                <div>
                  <p className="text-xs text-surface-400 font-medium uppercase tracking-wider">Email</p>
                  <p className="text-sm text-surface-800">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-surface-400" />
                <div>
                  <p className="text-xs text-surface-400 font-medium uppercase tracking-wider">Member since</p>
                  <p className="text-sm text-surface-800">{user?.created_at ? formatDate(user.created_at) : '—'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-surface-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-surface-500" />
          <h3 className="font-semibold text-surface-800">Change Password</h3>
        </div>
        <div className="p-6">
          {passwordError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              Password changed successfully
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white text-sm font-medium rounded-xl transition-all shadow-sm"
            >
              {changingPassword ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Platform info */}
      <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-100">
          <h3 className="font-semibold text-surface-800">Platform Information</h3>
        </div>
        <div className="p-6 text-sm text-surface-600 space-y-2">
          <p><span className="text-surface-400">Domain:</span> {APP_DOMAIN}</p>
          <p><span className="text-surface-400">Max pages per user:</span> 50</p>
          <p><span className="text-surface-400">Max upload size:</span> 10 MB</p>
          <p><span className="text-surface-400">Supported files:</span> HTML, ZIP</p>
        </div>
      </div>
    </div>
  );
}
