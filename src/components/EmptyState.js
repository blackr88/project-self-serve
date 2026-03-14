'use client';

import Link from 'next/link';
import { Upload } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Upload,
  title = 'No pages yet',
  description = 'Upload your first HTML page to get started.',
  actionLabel = 'Upload Page',
  actionHref = '/upload',
  showAction = true,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-surface-400" />
      </div>
      <h3 className="text-lg font-semibold text-surface-800 mb-1">{title}</h3>
      <p className="text-sm text-surface-500 text-center max-w-sm mb-6">{description}</p>
      {showAction && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" />
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
