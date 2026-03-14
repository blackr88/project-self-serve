'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { ToastProvider } from '@/components/Toast';

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/user')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.data.user); // now includes role
        }
      })
      .catch(console.error);
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface-50">
        <Sidebar user={user} />
        <main className="lg:pl-64">
          <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
