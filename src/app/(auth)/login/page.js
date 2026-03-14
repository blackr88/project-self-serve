'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, Zap } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sanitize redirect: only allow internal paths starting with /
  // Block absolute URLs, protocol-relative URLs, and encoded tricks
  const rawRedirect = searchParams.get('redirect') || '/dashboard';
  const redirect = (() => {
    const r = rawRedirect.trim();
    if (!r.startsWith('/')) return '/dashboard';
    if (r.startsWith('//')) return '/dashboard';
    if (r.includes('://')) return '/dashboard';
    if (r.includes('\\')) return '/dashboard';
    // Only allow known internal paths
    const allowedPrefixes = ['/dashboard', '/my-pages', '/upload', '/settings', '/admin', '/'];
    const isAllowed = allowedPrefixes.some((p) => r === p || r.startsWith(p + '/') || r.startsWith(p + '?'));
    return isAllowed ? r : '/dashboard';
  })();

  const [checking, setChecking] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/setup/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && !data.data.setupComplete) {
          router.replace('/setup');
        }
      })
      .catch(console.error)
      .finally(() => setChecking(false));
  }, [router]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <>
      <div className="lg:hidden flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-surface-900 tracking-tight">PageAmpHTML</span>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-surface-900 mb-1">Welcome back</h2>
        <p className="text-surface-500 text-sm mb-8">Sign in to manage your hosted pages</p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm animate-slide-down">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-1.5">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="you@example.com" className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" autoComplete="email" />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" autoComplete="current-password" />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md disabled:shadow-none">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-surface-400">
        Need an account? Contact your administrator.
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
