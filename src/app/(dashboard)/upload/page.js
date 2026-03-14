'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  FileArchive,
  X,
  Check,
  AlertCircle,
  Loader2,
  Globe,
  ExternalLink,
  Copy,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { APP_DOMAIN, getPageUrl, formatBytes } from '@/lib/constants';

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function UploadPage() {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [subdomain, setSubdomain] = useState('');
  const [subdomainStatus, setSubdomainStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid' | 'owned'
  const [subdomainMessage, setSubdomainMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [stats, setStats] = useState(null);

  // Fetch user stats
  useEffect(() => {
    fetch('/api/user')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data.stats);
      })
      .catch(console.error);
  }, []);

  // Check subdomain availability with debounce
  useEffect(() => {
    if (!subdomain) {
      setSubdomainStatus(null);
      setSubdomainMessage('');
      return;
    }

    const normalized = subdomain.toLowerCase().trim();
    const regex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

    if (!regex.test(normalized)) {
      setSubdomainStatus('invalid');
      setSubdomainMessage('Only lowercase letters, numbers, and hyphens allowed');
      return;
    }

    setSubdomainStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pages/check?subdomain=${encodeURIComponent(normalized)}`);
        const data = await res.json();
        if (data.success) {
          if (data.data.available) {
            setSubdomainStatus('available');
            setSubdomainMessage('This subdomain is available');
          } else if (data.data.isOwner) {
            setSubdomainStatus('owned');
            setSubdomainMessage(data.data.reason);
          } else {
            setSubdomainStatus('taken');
            setSubdomainMessage(data.data.reason);
          }
        }
      } catch {
        setSubdomainStatus(null);
        setSubdomainMessage('Failed to check availability');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [subdomain]);

  // Drag handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  }, []);

  const processFile = (selectedFile) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const validExts = ['html', 'htm', 'zip'];

    if (!validExts.includes(ext)) {
      toast.error('Only HTML and ZIP files are accepted');
      return;
    }

    if (selectedFile.size > MAX_SIZE_BYTES) {
      toast.error(`File exceeds maximum size of ${MAX_SIZE_MB}MB`);
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);

    // Auto-suggest subdomain from filename if not set
    if (!subdomain) {
      const name = selectedFile.name
        .replace(/\.(html|htm|zip)$/i, '')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 63);
      if (name) setSubdomain(name);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !subdomain) return;
    if (subdomainStatus === 'taken' || subdomainStatus === 'invalid') return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subdomain', subdomain.toLowerCase().trim());

      const res = await fetch('/api/pages/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Upload failed');
        setUploading(false);
        return;
      }

      setUploadResult(data.data);
      toast.success('Page uploaded successfully!');
    } catch (error) {
      toast.error('Network error during upload');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setSubdomain('');
    setSubdomainStatus(null);
    setSubdomainMessage('');
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const canUpload =
    file &&
    subdomain &&
    (subdomainStatus === 'available' || subdomainStatus === 'owned') &&
    !uploading;

  const isAtLimit = stats && stats.remainingPages <= 0;

  // Success state
  if (uploadResult) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-500" />
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">
              Page Deployed Successfully!
            </h2>
            <p className="text-surface-500 text-sm mb-6">
              Your page is now live and accessible at:
            </p>

            <div className="bg-surface-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-brand-600 font-mono text-sm">
                <Globe className="w-4 h-4" />
                <a
                  href={uploadResult.page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {uploadResult.page.url}
                </a>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mb-6">
              <a
                href={uploadResult.page.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Visit Page
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(uploadResult.page.url);
                  toast.success('URL copied to clipboard');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-100 hover:bg-surface-200 text-surface-700 text-sm font-medium rounded-xl transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy URL
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-4 border-t border-surface-100">
              <button
                onClick={resetForm}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
              >
                Upload another
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => router.push('/my-pages')}
                className="text-sm text-surface-500 hover:text-surface-700 font-medium"
              >
                Go to My Pages
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Upload Page</h1>
        <p className="text-surface-500 text-sm mt-1">
          Upload an HTML file or ZIP archive to deploy instantly
        </p>
      </div>

      {/* Limit warning */}
      {isAtLimit && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Page limit reached</p>
            <p className="text-amber-700 mt-0.5">
              You&apos;ve used all {stats.limit} page slots. Delete existing pages to upload new ones.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Subdomain input */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Subdomain
            </label>
            <div className="flex items-stretch">
              <div className="flex items-center px-3.5 bg-surface-50 border border-r-0 border-surface-200 rounded-l-xl text-sm text-surface-500 font-mono">
                https://
              </div>
              <input
                type="text"
                placeholder="my-page"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                maxLength={63}
                disabled={isAtLimit}
                className="flex-1 px-3 py-2.5 text-sm border border-surface-200 font-mono focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all disabled:bg-surface-50 disabled:text-surface-400"
              />
              <div className="flex items-center px-3.5 bg-surface-50 border border-l-0 border-surface-200 rounded-r-xl text-sm text-surface-500 font-mono">
                .{APP_DOMAIN}
              </div>
            </div>

            {/* Status indicator */}
            {subdomain && (
              <div className={`mt-2 flex items-center gap-1.5 text-xs ${
                subdomainStatus === 'available' ? 'text-emerald-600' :
                subdomainStatus === 'owned' ? 'text-amber-600' :
                subdomainStatus === 'taken' || subdomainStatus === 'invalid' ? 'text-red-500' :
                'text-surface-400'
              }`}>
                {subdomainStatus === 'checking' && <Loader2 className="w-3 h-3 animate-spin" />}
                {subdomainStatus === 'available' && <Check className="w-3 h-3" />}
                {subdomainStatus === 'owned' && <Info className="w-3 h-3" />}
                {(subdomainStatus === 'taken' || subdomainStatus === 'invalid') && <AlertCircle className="w-3 h-3" />}
                {subdomainMessage}
              </div>
            )}
          </div>

          {/* File upload area */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              File
            </label>

            {!file ? (
              <div
                className={`dropzone rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragActive ? 'active' : ''
                } ${isAtLimit ? 'opacity-50 pointer-events-none' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.htm,.zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-brand-500" />
                </div>
                <p className="text-sm font-medium text-surface-700 mb-1">
                  Drop your file here or click to browse
                </p>
                <p className="text-xs text-surface-400">
                  HTML files or ZIP archives up to {MAX_SIZE_MB}MB
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-surface-50 rounded-xl border border-surface-200">
                <div className="p-2 rounded-lg bg-white border border-surface-200">
                  {file.name.endsWith('.zip') ? (
                    <FileArchive className="w-5 h-5 text-amber-500" />
                  ) : (
                    <FileText className="w-5 h-5 text-brand-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{file.name}</p>
                  <p className="text-xs text-surface-400">{formatBytes(file.size)}</p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1.5 rounded-lg hover:bg-surface-200 text-surface-400 hover:text-surface-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
            <div className="flex gap-3">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700 space-y-1">
                <p className="font-medium text-blue-800">Upload guidelines</p>
                <p>For single pages, upload an HTML file directly.</p>
                <p>For multi-file sites, upload a ZIP containing <code className="px-1 py-0.5 bg-blue-100 rounded text-[11px] font-mono">index.html</code> at the root level along with your CSS, JS, and images.</p>
              </div>
            </div>
          </div>

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={!canUpload || isAtLimit}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-surface-200 disabled:text-surface-400 text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md disabled:shadow-none"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Deploy Page
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
