'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, HardDrive, Upload, TrendingUp, ExternalLink, Globe, ArrowRight, Clock } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { StatCardSkeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import { getPageUrl, formatDate, formatBytes, APP_DOMAIN } from '@/lib/constants';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData(result.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Dashboard</h1>
            <p className="text-surface-500 text-sm mt-1">
              Overview of your hosted pages on {APP_DOMAIN}
            </p>
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm hover:shadow-md"
          >
            <Upload className="w-4 h-4" />
            Upload Page
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={FileText}
              label="Total Pages"
              value={data?.stats?.totalPages || 0}
              subtext={`of ${data?.stats?.limit || 50} max`}
              color="brand"
            />
            <StatCard
              icon={TrendingUp}
              label="Remaining"
              value={data?.stats?.remainingPages || 0}
              subtext="pages available"
              color="emerald"
            />
            <StatCard
              icon={HardDrive}
              label="Storage Used"
              value={formatBytes(data?.stats?.totalStorage || 0)}
              subtext="total file size"
              color="violet"
            />
            <StatCard
              icon={Globe}
              label="Domain"
              value={APP_DOMAIN}
              subtext="hosting domain"
              color="amber"
            />
          </>
        )}
      </div>

      {/* Usage progress */}
      {!loading && data && (
        <div className="bg-white rounded-2xl border border-surface-100 p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-surface-700">Page Usage</h3>
            <span className="text-sm text-surface-500">
              {data.stats.totalPages} / {data.stats.limit}
            </span>
          </div>
          <div className="w-full h-2.5 bg-surface-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-500"
              style={{ width: `${(data.stats.totalPages / data.stats.limit) * 100}%` }}
            />
          </div>
          <p className="text-xs text-surface-400 mt-2">
            {data.stats.remainingPages} slots remaining
          </p>
        </div>
      )}

      {/* Recent Pages */}
      <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
          <h3 className="font-semibold text-surface-800">Recent Uploads</h3>
          {data?.recentPages?.length > 0 && (
            <Link
              href="/my-pages"
              className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-shimmer h-14 rounded-xl" />
            ))}
          </div>
        ) : data?.recentPages?.length === 0 ? (
          <EmptyState
            title="No pages yet"
            description="Upload your first HTML page to see it here."
          />
        ) : (
          <div className="divide-y divide-surface-50">
            {data?.recentPages?.map((page) => (
              <div
                key={page.id}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-surface-50/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-1.5 rounded-lg bg-brand-50 flex-shrink-0">
                    <Globe className="w-4 h-4 text-brand-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">
                      {page.subdomain}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-surface-400">
                      <Clock className="w-3 h-3" />
                      {formatDate(page.created_at)}
                      <span>·</span>
                      <span>{page.file_count} files</span>
                    </div>
                  </div>
                </div>
                <a
                  href={getPageUrl(page.subdomain)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-brand-50 text-surface-400 hover:text-brand-600 transition-colors flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
