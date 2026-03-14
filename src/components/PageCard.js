'use client';

import { useState } from 'react';
import { ExternalLink, Copy, Trash2, Check, Globe, FileText, Clock } from 'lucide-react';
import { getPageUrl, formatDate, formatBytes } from '@/lib/constants';

export default function PageCard({ page, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const url = getPageUrl(page.subdomain);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }

    setDeleting(true);
    try {
      await onDelete(page.id);
    } catch (err) {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden hover:shadow-md hover:border-surface-200 transition-all duration-200 group">
      {/* Header bar */}
      <div className="h-1.5 bg-gradient-to-r from-brand-400 to-brand-600 opacity-60 group-hover:opacity-100 transition-opacity" />

      <div className="p-5">
        {/* Title row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-brand-50 flex-shrink-0">
              <Globe className="w-4 h-4 text-brand-500" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-surface-900 truncate">
                {page.subdomain}
              </h3>
              <p className="text-xs text-surface-400 truncate font-mono">
                {url}
              </p>
            </div>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 mb-4 text-xs text-surface-400">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            {page.file_count} {page.file_count === 1 ? 'file' : 'files'}
          </span>
          <span>{formatBytes(page.total_size)}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDate(page.created_at)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Visit
          </a>

          <button
            onClick={handleCopy}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-all ${
              copied
                ? 'text-emerald-600 bg-emerald-50'
                : 'text-surface-600 bg-surface-50 hover:bg-surface-100'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-all ${
              confirmDelete
                ? 'text-white bg-red-500 hover:bg-red-600'
                : 'text-surface-400 bg-surface-50 hover:text-red-500 hover:bg-red-50'
            } disabled:opacity-50`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? '...' : confirmDelete ? 'Confirm' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
