#!/usr/bin/env node

/**
 * PageAmpHTML - Local Development Setup
 * 
 * Script ini akan:
 * 1. Cek apakah Node.js & PostgreSQL terinstall
 * 2. Buat folder storage lokal
 * 3. Copy .env.local → .env (jika belum ada)
 * 4. Install dependencies
 * 5. Setup database (create DB + push schema)
 * 6. Beri instruksi final
 * 
 * Run: node scripts/setup-local.js
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

// ─── Helpers ──────────────────────────────────────────────
function log(emoji, msg) {
  console.log(`  ${emoji}  ${msg}`);
}

function header(msg) {
  console.log('');
  console.log(`━━━ ${msg} ━━━`);
}

function commandExists(cmd) {
  try {
    const flag = process.platform === 'win32' ? 'where' : 'which';
    execSync(`${flag} ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { 
      cwd: ROOT, 
      stdio: opts.silent ? 'pipe' : 'inherit',
      encoding: 'utf-8',
      ...opts 
    });
  } catch (e) {
    if (opts.allowFail) return null;
    throw e;
  }
}

const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';

// ─── Start ────────────────────────────────────────────────
console.log('');
console.log('╔═══════════════════════════════════════════════╗');
console.log('║   PageAmpHTML - Local Development Setup       ║');
console.log('╚═══════════════════════════════════════════════╝');

// ─── Step 1: Check prerequisites ──────────────────────────
header('1/6  Checking prerequisites');

// Node.js
if (!commandExists('node')) {
  log('❌', 'Node.js not found!');
  log('📥', 'Install dari: https://nodejs.org (versi 18+)');
  process.exit(1);
}
const nodeVer = execSync('node --version', { encoding: 'utf-8' }).trim();
const nodeMajor = parseInt(nodeVer.replace('v', ''));
if (nodeMajor < 18) {
  log('⚠️', `Node.js ${nodeVer} terlalu lama. Butuh v18+`);
  process.exit(1);
}
log('✅', `Node.js ${nodeVer}`);

// npm
const npmVer = execSync('npm --version', { encoding: 'utf-8' }).trim();
log('✅', `npm ${npmVer}`);

// PostgreSQL
let pgAvailable = false;
if (commandExists('psql')) {
  const pgVer = run('psql --version', { silent: true, allowFail: true });
  log('✅', `PostgreSQL: ${pgVer?.trim() || 'found'}`);
  pgAvailable = true;
} else {
  log('⚠️', 'PostgreSQL CLI (psql) tidak ditemukan di PATH');
  log('📋', 'Pastikan PostgreSQL sudah terinstall dan berjalan');
  if (isMac) {
    log('💡', 'Mac: brew install postgresql@16 && brew services start postgresql@16');
  } else if (isWin) {
    log('💡', 'Windows: Download dari https://www.postgresql.org/download/windows/');
  } else {
    log('💡', 'Linux: sudo apt install postgresql postgresql-contrib');
  }
  log('', '');
  log('⏭️', 'Melanjutkan setup... Anda perlu setup database manual nanti.');
}

// ─── Step 2: Create local storage folders ─────────────────
header('2/6  Creating storage folders');

const storagePath = path.join(ROOT, 'storage', 'sites');
const errorPagesPath = path.join(ROOT, 'storage', 'error-pages');

[storagePath, errorPagesPath].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log('✅', `Created: ${path.relative(ROOT, dir)}`);
  } else {
    log('ℹ️', `Exists: ${path.relative(ROOT, dir)}`);
  }
});

// Copy error pages
const nginxErrors = path.join(ROOT, 'nginx', 'error-pages');
if (fs.existsSync(nginxErrors)) {
  fs.readdirSync(nginxErrors).forEach((file) => {
    const src = path.join(nginxErrors, file);
    const dst = path.join(errorPagesPath, file);
    fs.copyFileSync(src, dst);
  });
  log('✅', 'Error pages copied to storage/error-pages/');
}

// ─── Step 3: Setup .env ───────────────────────────────────
header('3/6  Setting up environment');

const envPath = path.join(ROOT, '.env');
const envLocalPath = path.join(ROOT, '.env.local');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envLocalPath)) {
    fs.copyFileSync(envLocalPath, envPath);
    log('✅', 'Created .env from .env.local (local dev settings)');
  } else {
    const envExample = path.join(ROOT, '.env.example');
    if (fs.existsSync(envExample)) {
      fs.copyFileSync(envExample, envPath);
      log('✅', 'Created .env from .env.example');
      log('⚠️', 'Edit .env dan sesuaikan DATABASE_URL!');
    }
  }
} else {
  log('ℹ️', '.env sudah ada, skip');
}

// ─── Step 4: Install dependencies ─────────────────────────
header('4/6  Installing dependencies');

log('📦', 'Running npm install...');
run('npm install');
log('✅', 'Dependencies installed');

// ─── Step 5: Database setup ───────────────────────────────
header('5/6  Database setup');

if (pgAvailable) {
  // Read DB credentials from .env
  let dbUrl = '';
  try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/DATABASE_URL="([^"]+)"/);
    if (match) dbUrl = match[1];
  } catch {}

  // Try to create database
  log('🗄️', 'Attempting to create database...');
  
  // Parse DB URL
  const dbName = 'pageamphtml_dev';
  const dbUser = 'pageamphtml';
  const dbPass = 'pageamphtml123';

  // Try creating user and database
  if (!isWin) {
    // Linux/Mac - try via sudo -u postgres
    run(`sudo -u postgres psql -c "CREATE USER ${dbUser} WITH PASSWORD '${dbPass}';" 2>/dev/null || true`, { allowFail: true, silent: true });
    run(`sudo -u postgres psql -c "CREATE DATABASE ${dbName} OWNER ${dbUser};" 2>/dev/null || true`, { allowFail: true, silent: true });
    run(`sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser};" 2>/dev/null || true`, { allowFail: true, silent: true });
    log('✅', `Database "${dbName}" setup attempted`);
  } else {
    log('📋', 'Windows: Buat database manual via pgAdmin atau psql:');
    log('', `   CREATE USER ${dbUser} WITH PASSWORD '${dbPass}';`);
    log('', `   CREATE DATABASE ${dbName} OWNER ${dbUser};`);
  }

  // Generate Prisma client
  log('⚙️', 'Generating Prisma client...');
  run('npx prisma generate', { allowFail: true });

  // Push schema
  log('📊', 'Pushing schema to database...');
  const pushResult = run('npx prisma db push 2>&1', { allowFail: true, silent: true });
  if (pushResult && !pushResult.includes('error')) {
    log('✅', 'Database schema synced');
  } else {
    log('⚠️', 'Database push gagal. Kemungkinan:');
    log('', '   - PostgreSQL belum berjalan');
    log('', '   - Database belum dibuat');
    log('', '   - Password salah');
    log('', '');
    log('📋', 'Fix manual:');
    log('', '   1. Pastikan PostgreSQL berjalan');
    log('', '   2. Buat database: CREATE DATABASE pageamphtml_dev;');
    log('', '   3. Jalankan: npx prisma db push');
  }
} else {
  log('⏭️', 'Skipping database setup (PostgreSQL not detected)');
  log('📋', 'Setelah install PostgreSQL, jalankan:');
  log('', '   npx prisma generate');
  log('', '   npx prisma db push');
}

// ─── Step 6: Done ─────────────────────────────────────────
header('6/6  Setup complete!');

console.log('');
console.log('  ┌─────────────────────────────────────────────────┐');
console.log('  │                                                 │');
console.log('  │   Jalankan development server:                  │');
console.log('  │                                                 │');
console.log('  │   $ npm run dev                                 │');
console.log('  │                                                 │');
console.log('  │   Buka: http://localhost:3000                   │');
console.log('  │                                                 │');
console.log('  │   Register akun baru, lalu upload HTML!         │');
console.log('  │                                                 │');
console.log('  └─────────────────────────────────────────────────┘');
console.log('');

if (!pgAvailable) {
  console.log('  ⚠️  PENTING: Setup PostgreSQL terlebih dahulu!');
  console.log('     Lihat panduan lengkap: docs/LOCAL-SETUP.md');
  console.log('');
}
