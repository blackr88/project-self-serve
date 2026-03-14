'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Upload, Search, FileText, SlidersHorizontal } from 'lucide-react';
import PageCard from '@/components/PageCard';
import { PageCardSkeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';

export default function MyPagesPage() {
  const toast = useToast();
  const [pages, setPages] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/pages');
      const data = await res.json();
      if (data.success) {
        setPages(data.data.pages);
        setStats(data.data.stats);
      }
    } catch (error) {
      toast.error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleDelete = async (pageId) => {
    try {
      const res = await fetch(`/api/pages/${pageId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Failed to delete page');
        return;
      }

      toast.success(`Page "${data.data.subdomain}" deleted`);
      setPages((prev) => prev.filter((p) => p.id !== pageId));
      setStats((prev) => ({
        ...prev,
        total: prev.total - 1,
        remaining: prev.remaining + 1,
      }));
    } catch (error) {
      toast.error('Network error');
      throw error;
    }
  };

  // Filter and sort
  const filteredPages = pages
    .filter((page) =>
      page.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'name':
          return a.subdomain.localeCompare(b.subdomain);
        case 'size':
          return b.total_size - a.total_size;
        default:
          return 0;
      }
    });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 tracking-tight">My Pages</h1>
            <p className="text-surface-500 text-sm mt-1">
              {stats
                ? `${stats.total} pages · ${stats.remaining} remaining`
                : 'Loading...'}
            </p>
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Upload Page
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      {!loading && pages.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-9 pr-8 py-2.5 text-sm bg-white border border-surface-200 rounded-xl appearance-none cursor-pointer focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A-Z</option>
              <option value="size">Largest first</option>
            </select>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <PageCardSkeleton key={i} />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-100">
          <EmptyState />
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-100">
          <EmptyState
            icon={Search}
            title="No results"
            description={`No pages matching "${searchQuery}"`}
            showAction={false}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPages.map((page) => (
            <PageCard key={page.id} page={page} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
