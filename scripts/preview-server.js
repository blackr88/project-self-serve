#!/usr/bin/env node

/**
 * PageAmpHTML - Local Preview Server
 * 
 * Server ringan untuk preview halaman yang sudah di-upload
 * saat development lokal (tanpa NGINX).
 * 
 * Berjalan di port 4000. Akses halaman via:
 *   http://localhost:4000/preview/{subdomain}
 * 
 * Run: node scripts/preview-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PREVIEW_PORT || 4000;
const STORAGE = path.resolve(process.env.STORAGE_PATH || './storage/sites');

const MIME_TYPES = {
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.map': 'application/json',
};

function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function serveFile(res, filePath) {
  // Security: resolve and check it's inside STORAGE
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(STORAGE))) {
    res.writeHead(403, { 'Content-Type': 'text/html' });
    res.end('<h1>403 Forbidden</h1>');
    return;
  }

  if (!fs.existsSync(resolved)) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
      <head><title>404 Not Found</title>
      <style>
        body { font-family: Inter, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #0f172a; }
        .c { text-align: center; }
        h1 { font-size: 4rem; background: linear-gradient(135deg, #36adf6, #0c93e7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        p { color: #64748b; }
        a { color: #0c93e7; text-decoration: none; }
      </style>
      </head>
      <body><div class="c">
        <h1>404</h1>
        <p>File not found</p>
        <p><a href="/preview/">← Back to preview list</a></p>
      </div></body>
      </html>
    `);
    return;
  }

  const stat = fs.statSync(resolved);
  if (stat.isDirectory()) {
    // Try index.html
    const indexPath = path.join(resolved, 'index.html');
    if (fs.existsSync(indexPath)) {
      serveFile(res, indexPath);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>No index.html found in this directory</h1>');
    return;
  }

  const mime = getMime(resolved);
  const stream = fs.createReadStream(resolved);
  res.writeHead(200, {
    'Content-Type': mime,
    'Content-Length': stat.size,
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  stream.pipe(res);
}

function listSubdomains(res) {
  let sites = [];
  try {
    if (fs.existsSync(STORAGE)) {
      sites = fs.readdirSync(STORAGE, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort();
    }
  } catch {}

  const siteList = sites.length === 0
    ? '<p style="color:#94a3b8;">Belum ada halaman yang di-upload. Upload lewat dashboard di <a href="http://localhost:3000/upload">localhost:3000/upload</a></p>'
    : sites.map((s) => {
        const indexExists = fs.existsSync(path.join(STORAGE, s, 'index.html'));
        const fileCount = fs.readdirSync(path.join(STORAGE, s), { recursive: true }).length;
        return `
          <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:8px;transition:all 0.15s;">
            <div style="width:8px;height:8px;border-radius:50%;background:${indexExists ? '#10b981' : '#ef4444'};flex-shrink:0;"></div>
            <div style="flex:1;">
              <a href="/preview/${s}/" style="color:#0c93e7;text-decoration:none;font-weight:600;font-size:15px;">${s}</a>
              <span style="color:#94a3b8;font-size:12px;margin-left:8px;">${fileCount} files</span>
            </div>
            <a href="/preview/${s}/" target="_blank" style="color:#64748b;font-size:12px;text-decoration:none;">Open ↗</a>
          </div>`;
      }).join('');

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>PageAmpHTML - Local Preview</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Inter, sans-serif; background: #f8fafc; color: #0f172a; min-height: 100vh; padding: 40px 20px; }
        .container { max-width: 640px; margin: 0 auto; }
        .header { margin-bottom: 32px; }
        .logo { font-size: 24px; font-weight: 700; }
        .logo span { color: #0c93e7; }
        .badge { display: inline-block; padding: 4px 10px; background: #dbeafe; color: #1d4ed8; border-radius: 6px; font-size: 11px; font-weight: 600; margin-left: 8px; vertical-align: middle; }
        .subtitle { color: #64748b; font-size: 14px; margin-top: 4px; }
        .card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; }
        h2 { font-size: 16px; font-weight: 600; color: #334155; margin-bottom: 16px; }
        .info { background: #f0f7ff; border: 1px solid #bae0fd; border-radius: 10px; padding: 14px 16px; margin-top: 24px; font-size: 13px; color: #015da0; line-height: 1.6; }
        .info code { background: #dbeafe; padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 12px; }
        a { color: #0c93e7; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Page<span>Amp</span>HTML <span class="badge">LOCAL DEV</span></div>
          <p class="subtitle">Preview server untuk halaman yang sudah di-upload</p>
        </div>
        
        <div class="card">
          <h2>Hosted Pages (${sites.length})</h2>
          ${siteList}
        </div>

        <div class="info">
          <strong>How it works:</strong><br>
          1. Buka dashboard: <a href="http://localhost:3000" target="_blank">http://localhost:3000</a><br>
          2. Register & upload halaman HTML<br>
          3. Preview hasil di sini: <code>http://localhost:${PORT}/preview/{subdomain}/</code><br><br>
          <strong>Note:</strong> Di production, halaman akan diakses via <code>subdomain.pageamphtml.com</code> oleh NGINX. Server ini hanya untuk testing lokal.
        </div>
      </div>
    </body>
    </html>
  `);
}

// ─── HTTP Server ──────────────────────────────────────────

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);

  // Root → list subdomains
  if (pathname === '/' || pathname === '/preview' || pathname === '/preview/') {
    listSubdomains(res);
    return;
  }

  // /preview/{subdomain}/... → serve files
  const previewMatch = pathname.match(/^\/preview\/([a-z0-9][a-z0-9-]*[a-z0-9]|[a-z0-9])(\/.*)$/);
  if (previewMatch) {
    const subdomain = previewMatch[1];
    let filePath = previewMatch[2] || '/';
    
    // Security: no path traversal
    if (filePath.includes('..')) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    const fullPath = path.join(STORAGE, subdomain, filePath);
    serveFile(res, fullPath);
    return;
  }

  // Fallback
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end('<h1>404</h1><p><a href="/preview/">Go to preview list</a></p>');
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ┌──────────────────────────────────────────────────┐');
  console.log('  │                                                  │');
  console.log('  │   🚀 PageAmpHTML Preview Server                  │');
  console.log(`  │   🌐 http://localhost:${PORT}/preview/              │`);
  console.log(`  │   📁 Storage: ${path.relative(process.cwd(), STORAGE).padEnd(33)}│`);
  console.log('  │                                                  │');
  console.log('  │   Preview uploaded pages tanpa NGINX!            │');
  console.log('  │                                                  │');
  console.log('  └──────────────────────────────────────────────────┘');
  console.log('');
});
