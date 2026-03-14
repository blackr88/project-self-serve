'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FileText, Upload, Settings, LogOut,
  Menu, X, Zap, ChevronRight, Users, Crown,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/my-pages', label: 'My Pages', icon: FileText },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const ADMIN_ITEMS = [
  { href: '/admin', label: 'User Management', icon: Users },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      setLoggingOut(false);
    }
  };

  const NavLink = ({ item }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`
          group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
          transition-all duration-150 relative
          ${isActive
            ? 'bg-brand-50 text-brand-700 shadow-sm'
            : 'text-surface-500 hover:text-surface-800 hover:bg-surface-100'
          }
        `}
      >
        <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-brand-500' : 'text-surface-400 group-hover:text-surface-600'}`} />
        <span>{item.label}</span>
        {isActive && <ChevronRight className="w-4 h-4 ml-auto text-brand-400" />}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-surface-900 tracking-tight">
              Page<span className="text-brand-500">Amp</span>
            </span>
            <span className="text-[10px] font-medium text-surface-400 block -mt-1 tracking-wider uppercase">
              HTML Hosting
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-2">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        {/* Admin section */}
        {isAdmin && (
          <div className="mt-6">
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-surface-400 flex items-center gap-1.5">
              <Crown className="w-3 h-3" />
              Admin
            </p>
            <div className="space-y-1">
              {ADMIN_ITEMS.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 mt-auto">
        <div className="px-3 py-3 rounded-xl bg-surface-50 border border-surface-100">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold uppercase ${
              isAdmin
                ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                : 'bg-gradient-to-br from-brand-400 to-brand-600'
            }`}>
              {user?.email?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-800 truncate">
                {user?.email || 'Loading...'}
              </p>
              {user?.role && (
                <span className={`text-[10px] font-bold uppercase ${
                  isAdmin ? 'text-amber-500' : 'text-surface-400'
                }`}>
                  {user.role}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-surface-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150 disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? 'Logging out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2.5 bg-white rounded-xl shadow-md border border-surface-100 hover:bg-surface-50 transition-colors"
      >
        <Menu className="w-5 h-5 text-surface-700" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-surface-100 transform transition-transform duration-300 ease-out shadow-2xl ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-100 transition-colors">
          <X className="w-5 h-5 text-surface-500" />
        </button>
        <SidebarContent />
      </div>

      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-surface-100">
        <SidebarContent />
      </div>
    </>
  );
}
