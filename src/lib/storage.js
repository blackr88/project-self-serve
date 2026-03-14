import fs from 'fs/promises';
import path from 'path';
import AdmZip from 'adm-zip';
import sanitizeFilename from 'sanitize-filename';
import { scanHtmlContent, isBlockedFilename, validateZipStructure } from './html-scanner.js';

const STORAGE_PATH = process.env.STORAGE_PATH || '/var/www/storage/sites';
const MAX_UPLOAD_SIZE = (parseInt(process.env.MAX_UPLOAD_SIZE_MB) || 10) * 1024 * 1024;

/**
 * Allowed file extensions for upload
 */
const ALLOWED_HTML_EXTENSIONS = ['.html', '.htm'];
const ALLOWED_ZIP_EXTENSIONS = ['.zip'];
const ALLOWED_ASSET_EXTENSIONS = [
  '.html', '.htm', '.css', '.js',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.avif',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.json', '.xml', '.txt', '.csv',
  '.mp4', '.webm', '.ogg', '.mp3', '.wav',
  '.pdf', '.map',
];

/**
 * Dangerous patterns to block in file paths
 */
const DANGEROUS_PATTERNS = [
  /\.\./,           // Path traversal
  /^\//, // Absolute paths
  /\\/,             // Backslashes
  /\0/,             // Null bytes
  /^~/, // Home directory
  /%2e%2e/i,        // URL encoded traversal
  /%252e%252e/i,    // Double encoded traversal
];

/**
 * Validate a file path for safety
 */
function isPathSafe(filePath) {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(filePath)) {
      return false;
    }
  }
  return true;
}

/**
 * Sanitize a file path component
 */
function sanitizePath(input) {
  return sanitizeFilename(input, { replacement: '-' })
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/**
 * Ensure the storage directory exists
 */
export async function ensureStorageDir() {
  try {
    await fs.access(STORAGE_PATH);
  } catch {
    await fs.mkdir(STORAGE_PATH, { recursive: true });
  }
}

/**
 * Get the full path for a subdomain's storage directory
 */
export function getSubdomainPath(subdomain) {
  const sanitized = sanitizePath(subdomain);
  return path.join(STORAGE_PATH, sanitized);
}

/**
 * Check if a subdomain directory already exists
 */
export async function subdomainDirExists(subdomain) {
  try {
    await fs.access(getSubdomainPath(subdomain));
    return true;
  } catch {
    return false;
  }
}

/**
 * Save an uploaded HTML file
 */
export async function saveHtmlFile(subdomain, fileBuffer, originalName) {
  await ensureStorageDir();

  // Scan HTML for platform-targeting attacks
  const scanResult = scanHtmlContent(fileBuffer);
  if (!scanResult.safe) {
    throw new Error(`Security scan failed: ${scanResult.warnings[0]}`);
  }

  const subdomainDir = getSubdomainPath(subdomain);

  // Clean up existing directory if it exists
  try {
    await fs.rm(subdomainDir, { recursive: true, force: true });
  } catch {
    // Directory doesn't exist, that's fine
  }

  await fs.mkdir(subdomainDir, { recursive: true });

  // Always save as index.html
  const filePath = path.join(subdomainDir, 'index.html');
  await fs.writeFile(filePath, fileBuffer);

  return {
    folderPath: subdomainDir,
    fileCount: 1,
    totalSize: fileBuffer.length,
  };
}

/**
 * Extract and save a ZIP file
 */
export async function saveZipFile(subdomain, fileBuffer) {
  await ensureStorageDir();

  const subdomainDir = getSubdomainPath(subdomain);

  // Clean up existing directory if it exists
  try {
    await fs.rm(subdomainDir, { recursive: true, force: true });
  } catch {
    // Directory doesn't exist, that's fine
  }

  await fs.mkdir(subdomainDir, { recursive: true });

  const zip = new AdmZip(fileBuffer);
  const entries = zip.getEntries();

  // Validate ZIP structure (file count, nesting depth, blocked filenames)
  const structureCheck = validateZipStructure(entries);
  if (!structureCheck.valid) {
    throw new Error(structureCheck.errors[0]);
  }

  let hasIndexHtml = false;
  let fileCount = 0;
  let totalSize = 0;

  // First pass: validate all entries
  for (const entry of entries) {
    if (entry.isDirectory) continue;

    const entryName = entry.entryName;

    // Security: check for path traversal
    if (!isPathSafe(entryName)) {
      throw new Error(`Unsafe file path detected: ${entryName}`);
    }

    // Check file extension
    const ext = path.extname(entryName).toLowerCase();
    if (!ALLOWED_ASSET_EXTENSIONS.includes(ext)) {
      throw new Error(`File type not allowed: ${ext} (${entryName})`);
    }

    // Check for index.html
    const normalizedPath = entryName.replace(/\\/g, '/');
    const parts = normalizedPath.split('/');

    // index.html can be at root or one level deep (if ZIP has a wrapper folder)
    if (parts[parts.length - 1] === 'index.html') {
      if (parts.length <= 2) {
        hasIndexHtml = true;
      }
    }

    totalSize += entry.header.size;
  }

  if (!hasIndexHtml) {
    throw new Error('ZIP must contain an index.html file at the root level');
  }

  if (totalSize > MAX_UPLOAD_SIZE) {
    throw new Error(`Extracted files exceed maximum size of ${MAX_UPLOAD_SIZE / 1024 / 1024}MB`);
  }

  // Second pass: detect if files are in a wrapper folder
  let stripPrefix = '';
  const topLevelItems = new Set();

  for (const entry of entries) {
    const normalizedPath = entry.entryName.replace(/\\/g, '/');
    const topLevel = normalizedPath.split('/')[0];
    topLevelItems.add(topLevel);
  }

  // If there's exactly one top-level folder and no top-level files, strip it
  if (topLevelItems.size === 1) {
    const singleItem = [...topLevelItems][0];
    const isFolder = entries.some(e => e.isDirectory && e.entryName.replace(/\\/g, '/').replace(/\/$/, '') === singleItem);
    if (isFolder) {
      stripPrefix = singleItem + '/';
    }
  }

  // Third pass: extract files
  for (const entry of entries) {
    if (entry.isDirectory) continue;

    let entryPath = entry.entryName.replace(/\\/g, '/');

    // Strip wrapper folder prefix if detected
    if (stripPrefix && entryPath.startsWith(stripPrefix)) {
      entryPath = entryPath.slice(stripPrefix.length);
    }

    if (!entryPath) continue;

    // Sanitize each path component
    const pathParts = entryPath.split('/').map(part => sanitizePath(part));
    const safePath = pathParts.join('/');

    if (!safePath) continue;

    const fullPath = path.join(subdomainDir, safePath);

    // Ensure the file is within the subdomain directory
    const resolvedPath = path.resolve(fullPath);
    const resolvedBase = path.resolve(subdomainDir);
    if (!resolvedPath.startsWith(resolvedBase)) {
      throw new Error(`Path traversal detected: ${safePath}`);
    }

    // Create parent directories
    const parentDir = path.dirname(fullPath);
    await fs.mkdir(parentDir, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, entry.getData());
    fileCount++;
  }

  return {
    folderPath: subdomainDir,
    fileCount,
    totalSize,
  };
}

/**
 * Delete a subdomain's storage directory
 */
export async function deleteSubdomainDir(subdomain) {
  const subdomainDir = getSubdomainPath(subdomain);

  try {
    await fs.rm(subdomainDir, { recursive: true, force: true });
    return true;
  } catch (error) {
    console.error(`Failed to delete directory for ${subdomain}:`, error);
    return false;
  }
}

/**
 * Get directory size in bytes
 */
export async function getDirSize(dirPath) {
  let totalSize = 0;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        totalSize += await getDirSize(fullPath);
      } else {
        const stat = await fs.stat(fullPath);
        totalSize += stat.size;
      }
    }
  } catch {
    // Directory might not exist
  }

  return totalSize;
}

/**
 * Validate upload file type
 */
export function validateFileType(filename) {
  const ext = path.extname(filename).toLowerCase();

  if (ALLOWED_HTML_EXTENSIONS.includes(ext)) {
    return { valid: true, type: 'html' };
  }

  if (ALLOWED_ZIP_EXTENSIONS.includes(ext)) {
    return { valid: true, type: 'zip' };
  }

  return { valid: false, type: null };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export { MAX_UPLOAD_SIZE, ALLOWED_HTML_EXTENSIONS, ALLOWED_ZIP_EXTENSIONS, ALLOWED_ASSET_EXTENSIONS };
