/**
 * Application constants
 */

export const APP_NAME = 'PageAmpHTML';
export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'pageamphtml.com';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pageamphtml.com';

export const MAX_PAGES_PER_USER = parseInt(process.env.MAX_PAGES_PER_USER) || 50;
export const MAX_UPLOAD_SIZE_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB) || 10;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  MY_PAGES: '/my-pages',
  UPLOAD: '/upload',
  SETTINGS: '/settings',
};

export const API_ROUTES = {
  REGISTER: '/api/register',
  LOGIN: '/api/login',
  LOGOUT: '/api/logout',
  PAGES: '/api/pages',
  UPLOAD: '/api/pages/upload',
  DELETE_PAGE: (id) => `/api/pages/${id}`,
};

/**
 * Build the full URL for a hosted page
 */
export function getPageUrl(subdomain) {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${subdomain}.${APP_DOMAIN}`;
}

/**
 * Format a date to a readable string
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
