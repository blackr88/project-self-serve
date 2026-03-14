#!/usr/bin/env node

/**
 * PageAmpHTML - Initial Setup Script
 * Run: node scripts/setup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STORAGE_PATH = process.env.STORAGE_PATH || '/var/www/storage/sites';
const ERROR_PAGES_PATH = '/var/www/storage/error-pages';

console.log('');
console.log('╔══════════════════════════════════════════╗');
console.log('║       PageAmpHTML - Setup Script         ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');

function createDir(dirPath, label) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`  ✅ Created: ${label} (${dirPath})`);
    } else {
      console.log(`  ℹ️  Exists: ${label} (${dirPath})`);
    }
  } catch (error) {
    console.error(`  ❌ Failed: ${label} - ${error.message}`);
    console.log(`     Try: sudo mkdir -p ${dirPath} && sudo chown $USER:$USER ${dirPath}`);
  }
}

// Step 1: Create directories
console.log('📁 Creating directories...');
createDir(STORAGE_PATH, 'Storage directory');
createDir(ERROR_PAGES_PATH, 'Error pages directory');
console.log('');

// Step 2: Copy error pages
console.log('📄 Setting up error pages...');
const errorPagesSource = path.join(__dirname, '..', 'nginx', 'error-pages');
if (fs.existsSync(errorPagesSource)) {
  const files = fs.readdirSync(errorPagesSource);
  files.forEach((file) => {
    try {
      const src = path.join(errorPagesSource, file);
      const dest = path.join(ERROR_PAGES_PATH, file);
      fs.copyFileSync(src, dest);
      console.log(`  ✅ Copied: ${file}`);
    } catch (error) {
      console.error(`  ❌ Failed to copy ${file}: ${error.message}`);
    }
  });
} else {
  console.log('  ⚠️  Error pages source not found, skipping');
}
console.log('');

// Step 3: Check .env
console.log('🔐 Checking environment...');
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');
if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('  ✅ Created .env from .env.example');
    console.log('  ⚠️  IMPORTANT: Edit .env with your actual values!');
  } else {
    console.log('  ❌ .env.example not found');
  }
} else {
  console.log('  ℹ️  .env already exists');
}
console.log('');

// Step 4: Generate Prisma client
console.log('🗄️  Setting up database...');
try {
  execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('  ✅ Prisma client generated');
} catch (error) {
  console.error('  ❌ Prisma generate failed. Run manually: npx prisma generate');
}
console.log('');

// Step 5: Run migrations
console.log('📊 Running database migrations...');
try {
  execSync('npx prisma db push', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('  ✅ Database schema synced');
} catch (error) {
  console.error('  ❌ Database migration failed.');
  console.log('     Make sure PostgreSQL is running and DATABASE_URL is correct in .env');
}
console.log('');

console.log('✨ Setup complete!');
console.log('');
console.log('Next steps:');
console.log('  1. Edit .env with your production values');
console.log('  2. npm run build');
console.log('  3. npm run start');
console.log('  4. Configure NGINX (see nginx/pageamphtml.conf)');
console.log('  5. Set up Cloudflare DNS wildcard record');
console.log('');
