'use client';

import { useState, useEffect } from 'react';
import {
  Users, Plus, Trash2, Shield, ShieldCheck, Mail, Lock,
  Loader2, X, AlertCircle, Check, Crown, User, KeyRound,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/constants';

export default function AdminPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [resetPassword, setResetPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user',
  });
  const [formError, setFormError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
      } else if (data.error === 'Admin access required') {
        toast.error('You do not have admin access');
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!data.success) {
        setFormError(data.error);
        setCreating(false);
        return;
      }

      toast.success(`User ${data.data.user.email} created`);
      setFormData({ email: '', password: '', role: 'user' });
      setShowCreateForm(false);
      fetchUsers();
    } catch {
      setFormError('Network error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (userId) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error);
        return;
      }
      toast.success(data.data.message);
      setConfirmDelete(null);
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleResetPassword = async (userId) => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error);
        return;
      }
      toast.success('Password reset successfully');
      setResetPassword(null);
      setNewPassword('');
    } catch {
      toast.error('Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error);
        return;
      }
      toast.success(`Role changed to ${newRole}`);
      fetchUsers();
    } catch {
      toast.error('Failed to update role');
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-surface-900 tracking-tight">User Management</h1>
              <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase rounded-md">Admin</span>
            </div>
            <p className="text-surface-500 text-sm">{users.length} registered users</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreateForm ? 'Cancel' : 'Add User'}
          </button>
        </div>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl border border-surface-100 p-6 mb-6 animate-slide-down">
          <h3 className="font-semibold text-surface-800 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-500" />
            Create New User
          </h3>

          {formError && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="email" required value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="password" required minLength={8} value={formData.password}
                    onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Min 8 characters"
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Role</label>
              <div className="flex gap-3">
                {['user', 'admin'].map((r) => (
                  <button
                    key={r} type="button"
                    onClick={() => setFormData((p) => ({ ...p, role: r }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      formData.role === r
                        ? r === 'admin'
                          ? 'bg-amber-50 border-amber-300 text-amber-700'
                          : 'bg-brand-50 border-brand-300 text-brand-700'
                        : 'bg-white border-surface-200 text-surface-500 hover:border-surface-300'
                    }`}
                  >
                    {r === 'admin' ? <Crown className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit" disabled={creating}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white text-sm font-medium rounded-xl transition-all"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-100">
          <h3 className="font-semibold text-surface-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-surface-500" />
            All Users
          </h3>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-shimmer h-16 rounded-xl" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-surface-500 text-sm">No users found</div>
        ) : (
          <div className="divide-y divide-surface-50">
            {users.map((u) => (
              <div key={u.id} className="px-5 py-4 flex items-center justify-between hover:bg-surface-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold uppercase ${
                    u.role === 'admin'
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                      : 'bg-gradient-to-br from-brand-400 to-brand-600 text-white'
                  }`}>
                    {u.email.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-surface-800 truncate">{u.email}</p>
                      <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${
                        u.role === 'admin'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-surface-100 text-surface-500'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                    <p className="text-xs text-surface-400">
                      {u.totalPages} pages · Joined {formatDate(u.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Toggle role */}
                  <button
                    onClick={() => handleToggleRole(u.id, u.role)}
                    title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                    className="p-2 rounded-lg text-surface-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                  >
                    {u.role === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  </button>

                  {/* Reset password */}
                  <button
                    onClick={() => { setResetPassword(resetPassword === u.id ? null : u.id); setNewPassword(''); }}
                    title="Reset password"
                    className="p-2 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  {confirmDelete === u.id ? (
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                    >
                      Confirm
                    </button>
                  ) : (
                    <button
                      onClick={() => { setConfirmDelete(u.id); setTimeout(() => setConfirmDelete(null), 3000); }}
                      title="Delete user"
                      className="p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Reset password inline form */}
                {resetPassword === u.id && (
                  <div className="absolute right-5 mt-20 bg-white border border-surface-200 rounded-xl shadow-lg p-3 z-10 flex items-center gap-2">
                    <input
                      type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password (min 8)"
                      className="px-3 py-1.5 text-sm border border-surface-200 rounded-lg w-48 outline-none focus:border-brand-500"
                    />
                    <button
                      onClick={() => handleResetPassword(u.id)} disabled={resetting}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50"
                    >
                      {resetting ? '...' : 'Reset'}
                    </button>
                    <button
                      onClick={() => { setResetPassword(null); setNewPassword(''); }}
                      className="p-1 text-surface-400 hover:text-surface-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
