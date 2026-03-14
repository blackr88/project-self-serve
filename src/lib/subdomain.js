/**
 * Reserved subdomains that cannot be used
 */
const RESERVED_SUBDOMAINS = [
  'admin',
  'api',
  'dashboard',
  'www',
  'mail',
  'ftp',
  'ssh',
  'ns1',
  'ns2',
  'smtp',
  'pop',
  'imap',
  'blog',
  'dev',
  'staging',
  'test',
  'demo',
  'app',
  'cdn',
  'static',
  'assets',
  'media',
  'img',
  'images',
  'docs',
  'help',
  'support',
  'status',
  'monitor',
  'health',
  'metrics',
  'login',
  'register',
  'signup',
  'signin',
  'auth',
  'oauth',
  'callback',
  'webhook',
  'webhooks',
  'billing',
  'payment',
  'checkout',
  'account',
  'profile',
  'settings',
  'config',
  'console',
  'panel',
  'cpanel',
  'root',
  'server',
  'node',
  'proxy',
  'gateway',
  'load-balancer',
  'database',
  'db',
  'redis',
  'cache',
  'queue',
  'worker',
  'cron',
  'job',
  'task',
  'internal',
  'private',
  'public',
  'system',
  'sysadmin',
  'webmaster',
  'postmaster',
  'hostmaster',
  'abuse',
  'security',
  'noc',
  'info',
  'contact',
  'feedback',
  'newsletter',
  'unsubscribe',
];

/**
 * Subdomain regex: lowercase alphanumeric and hyphens only
 */
const SUBDOMAIN_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

/**
 * Validate a subdomain string
 * Returns { valid: boolean, error: string | null }
 */
export function validateSubdomain(subdomain) {
  if (!subdomain) {
    return { valid: false, error: 'Subdomain is required' };
  }

  if (typeof subdomain !== 'string') {
    return { valid: false, error: 'Subdomain must be a string' };
  }

  const normalized = subdomain.toLowerCase().trim();

  if (normalized.length < 1) {
    return { valid: false, error: 'Subdomain cannot be empty' };
  }

  if (normalized.length > 63) {
    return { valid: false, error: 'Subdomain must be 63 characters or less' };
  }

  if (!SUBDOMAIN_REGEX.test(normalized)) {
    return {
      valid: false,
      error: 'Subdomain can only contain lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen.',
    };
  }

  if (normalized.includes('--')) {
    return { valid: false, error: 'Subdomain cannot contain consecutive hyphens' };
  }

  if (RESERVED_SUBDOMAINS.includes(normalized)) {
    return { valid: false, error: `"${normalized}" is a reserved subdomain and cannot be used` };
  }

  return { valid: true, error: null };
}

/**
 * Sanitize a string to be used as a subdomain
 */
export function sanitizeSubdomain(input) {
  if (!input || typeof input !== 'string') return '';

  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 63);
}

/**
 * Check if a subdomain is reserved
 */
export function isReservedSubdomain(subdomain) {
  return RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase());
}

export { RESERVED_SUBDOMAINS };
