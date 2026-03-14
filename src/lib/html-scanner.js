/**
 * HTML Content Security Scanner
 * 
 * Scans uploaded HTML files for potentially dangerous content.
 * This doesn't modify files but warns/blocks risky uploads.
 * 
 * Note: Since this is a static hosting platform, we can't fully
 * prevent all XSS (users upload arbitrary HTML intentionally).
 * But we CAN prevent attacks that target OTHER subdomains or the
 * main dashboard via cookie stealing, redirects, etc.
 */

/**
 * Patterns that indicate attempts to attack the hosting platform itself
 * (not just the user's own page)
 */
const DANGEROUS_PATTERNS = [
  // Attempts to steal cookies from parent domain
  /document\.cookie\s*[^=]*=.*domain\s*[:=]\s*['"]?pageamphtml/gi,
  // Attempts to redirect to external phishing sites masquerading as our login
  /window\.location\s*=.*pageamphtml\.com\/(login|register|api)/gi,
  // Attempts to embed the dashboard in an iframe for clickjacking
  /<iframe[^>]*src\s*=\s*['"]https?:\/\/(www\.)?pageamphtml\.com/gi,
  // Service worker registration (could intercept other subdomain requests)
  /navigator\.serviceWorker\.register/gi,
];

/**
 * File names that should never appear in uploads (server config files)
 */
const BLOCKED_FILENAMES = [
  '.htaccess',
  '.htpasswd',
  'web.config',
  '.env',
  '.git',
  '.gitignore',
  'docker-compose.yml',
  'Dockerfile',
  'package.json',
  'composer.json',
  'Makefile',
  '.ssh',
  'id_rsa',
  'id_ed25519',
];

/**
 * Scan HTML content for platform-targeting attacks
 * Returns { safe: boolean, warnings: string[] }
 */
export function scanHtmlContent(htmlBuffer) {
  const warnings = [];
  const content = htmlBuffer.toString('utf-8');

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push(`Suspicious pattern detected: ${pattern.source.slice(0, 50)}...`);
    }
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
  }

  return {
    safe: warnings.length === 0,
    warnings,
  };
}

/**
 * Check if a filename is blocked
 */
export function isBlockedFilename(filename) {
  const basename = filename.split('/').pop().toLowerCase();
  return BLOCKED_FILENAMES.some((blocked) => basename === blocked || basename.startsWith(blocked));
}

/**
 * Validate total number of files in a ZIP
 * Prevent zip bombs with excessive file counts
 */
export const MAX_FILES_IN_ZIP = 500;
export const MAX_NESTING_DEPTH = 10;

export function validateZipStructure(entries) {
  const errors = [];

  if (entries.length > MAX_FILES_IN_ZIP) {
    errors.push(`ZIP contains too many files (${entries.length}). Maximum is ${MAX_FILES_IN_ZIP}.`);
  }

  for (const entry of entries) {
    const depth = entry.entryName.split('/').length;
    if (depth > MAX_NESTING_DEPTH) {
      errors.push(`File "${entry.entryName}" is nested too deeply. Maximum depth is ${MAX_NESTING_DEPTH}.`);
      break;
    }

    if (isBlockedFilename(entry.entryName)) {
      errors.push(`Blocked file detected: "${entry.entryName}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
