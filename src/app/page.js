'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Root page (/)
 * 
 * Alur:
 * 1. Cek /api/setup/status
 * 2. Jika setup belum selesai → /setup (buat admin pertama)
 * 3. Jika setup sudah selesai → /dashboard (middleware akan redirect ke /login jika belum auth)
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/setup/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && !data.data.setupComplete) {
          router.replace('/setup');
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(() => {
        router.replace('/login');
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto mb-3" />
        <p className="text-sm text-surface-400">Loading...</p>
      </div>
    </div>
  );
}
