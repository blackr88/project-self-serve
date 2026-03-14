# PageAmpHTML - Panduan Setup Lokal

Panduan lengkap menjalankan PageAmpHTML di komputer lokal untuk testing sebelum deploy ke VPS.

---

## Prasyarat

Pastikan sudah terinstall:

| Software    | Minimum | Download                                      |
|-------------|---------|-----------------------------------------------|
| Node.js     | v18+    | https://nodejs.org                            |
| PostgreSQL  | v14+    | https://www.postgresql.org/download/          |
| npm         | v9+     | (otomatis ikut Node.js)                       |
| Git         | any     | https://git-scm.com (optional)                |

---

## Cara Cepat (4 Langkah)

```bash
# 1. Masuk ke folder project
cd pageamphtml

# 2. Jalankan setup otomatis
node scripts/setup-local.js

# 3. Jalankan dashboard (terminal 1)
npm run dev

# 4. Jalankan preview server (terminal 2)
npm run preview
```

Buka:
- **Dashboard**: http://localhost:3000
- **Preview halaman**: http://localhost:4000/preview/

---

## Cara Manual (Step by Step)

### Step 1: Install PostgreSQL

#### Ubuntu / Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS (Homebrew)
```bash
brew install postgresql@16
brew services start postgresql@16
```

#### Windows
1. Download installer dari https://www.postgresql.org/download/windows/
2. Jalankan installer, ikuti wizard
3. Ingat password yang di-set untuk user `postgres`
4. Pastikan PostgreSQL service berjalan (bisa cek di Services)

### Step 2: Buat Database

#### Linux / macOS
```bash
# Masuk ke PostgreSQL
sudo -u postgres psql

# Di dalam psql, jalankan:
CREATE USER pageamphtml WITH PASSWORD 'pageamphtml123';
CREATE DATABASE pageamphtml_dev OWNER pageamphtml;
GRANT ALL PRIVILEGES ON DATABASE pageamphtml_dev TO pageamphtml;
\q
```

#### Windows (pgAdmin atau psql)
```sql
-- Buka pgAdmin atau psql, lalu jalankan:
CREATE USER pageamphtml WITH PASSWORD 'pageamphtml123';
CREATE DATABASE pageamphtml_dev OWNER pageamphtml;
GRANT ALL PRIVILEGES ON DATABASE pageamphtml_dev TO pageamphtml;
```

#### Verifikasi koneksi
```bash
psql -h localhost -U pageamphtml -d pageamphtml_dev -c "SELECT 1;"
# Jika diminta password, ketik: pageamphtml123
# Harus muncul output "1"
```

### Step 3: Setup Project

```bash
# Masuk ke folder project
cd pageamphtml

# Install dependencies
npm install

# Copy environment file
cp .env.local .env
```

### Step 4: Edit .env (jika perlu)

File `.env.local` sudah dikonfigurasi untuk lokal. Hanya perlu edit jika:
- PostgreSQL berjalan di port berbeda
- Menggunakan password berbeda
- Menggunakan database name berbeda

```env
# Default config lokal:
DATABASE_URL="postgresql://pageamphtml:pageamphtml123@localhost:5432/pageamphtml_dev?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_DOMAIN="localhost:3000"
STORAGE_PATH="./storage/sites"
NODE_ENV="development"
```

### Step 5: Setup Prisma (Database Schema)

```bash
# Generate Prisma client
npx prisma generate

# Push schema ke database
npx prisma db push
```

Jika berhasil akan muncul:
```
🚀 Your database is now in sync with your Prisma schema.
```

### Step 6: Jalankan Development Server

**Buka 2 terminal:**

Terminal 1 — Next.js Dashboard:
```bash
npm run dev
```
Output:
```
▲ Next.js 14.x
- Local: http://localhost:3000
```

Terminal 2 — Preview Server (opsional, untuk preview halaman uploaded):
```bash
npm run preview
```
Output:
```
🚀 PageAmpHTML Preview Server
🌐 http://localhost:4000/preview/
```

### Step 7: Test

1. Buka http://localhost:3000
2. Klik **"Create one"** untuk register
3. Isi email & password (min 8 karakter)
4. Setelah login, klik **"Upload"**
5. Masukkan subdomain (misal: `test-page`)
6. Upload file HTML atau ZIP
7. Setelah berhasil, buka http://localhost:4000/preview/test-page/

---

## Alur Testing Lengkap

### Test 1: Register & Login
```
1. Buka http://localhost:3000/register
2. Email: test@test.com
3. Password: password123
4. Klik "Create Account"
5. → Harus redirect ke /dashboard
```

### Test 2: Upload HTML Tunggal
```
1. Buat file test.html di komputer:
   <html><body><h1>Hello World!</h1></body></html>

2. Buka http://localhost:3000/upload
3. Subdomain: hello-world
4. Upload file test.html
5. → Harus muncul "Page Deployed Successfully"
6. Preview: http://localhost:4000/preview/hello-world/
```

### Test 3: Upload ZIP
```
1. Buat folder "mysite" berisi:
   - index.html
   - style.css
   - script.js
   
2. Zip folder tersebut → mysite.zip

3. Upload di dashboard:
   - Subdomain: mysite
   - File: mysite.zip
   
4. Preview: http://localhost:4000/preview/mysite/
```

### Test 4: Page Management
```
1. Buka http://localhost:3000/my-pages
2. Test tombol "Copy" → copy URL ke clipboard
3. Test tombol "Visit" → buka preview
4. Test tombol "Delete" → klik 2x untuk konfirmasi
5. → Halaman harus terhapus dari list dan storage
```

### Test 5: Validasi
```
1. Upload subdomain duplikat → harus error
2. Upload file .exe → harus ditolak
3. Upload file > 10MB → harus ditolak
4. Subdomain "admin" → harus ditolak (reserved)
5. Subdomain "a b c" → harus ditolak (invalid chars)
```

### Test 6: Limit
```
- Setiap user max 50 pages
- Buat 50 pages → upload ke-51 harus ditolak
```

---

## Perbedaan Lokal vs Production

| Aspek                | Local Dev                                | Production                              |
|---------------------|------------------------------------------|-----------------------------------------|
| Dashboard URL       | http://localhost:3000                    | https://pageamphtml.com                 |
| Preview halaman     | http://localhost:4000/preview/subdomain/ | https://subdomain.pageamphtml.com       |
| Static file server  | Node.js preview server (port 4000)      | NGINX (direct serving)                  |
| SSL                 | Tidak ada (HTTP)                         | HTTPS via Cloudflare                    |
| Database            | pageamphtml_dev (local)                  | pageamphtml (production)                |
| Cookie secure       | false                                    | true                                    |
| Storage path        | ./storage/sites/ (relatif)               | /var/www/storage/sites/ (absolut)       |

---

## Troubleshooting

### "Database does not exist"
```bash
# Buat database manual:
sudo -u postgres createdb pageamphtml_dev -O pageamphtml

# Atau via psql:
sudo -u postgres psql -c "CREATE DATABASE pageamphtml_dev OWNER pageamphtml;"
```

### "role pageamphtml does not exist"
```bash
sudo -u postgres psql -c "CREATE USER pageamphtml WITH PASSWORD 'pageamphtml123';"
```

### "ECONNREFUSED 127.0.0.1:5432"
PostgreSQL tidak berjalan:
```bash
# Linux
sudo systemctl start postgresql

# macOS
brew services start postgresql@16

# Windows → buka Services → cari "PostgreSQL" → Start
```

### "Module not found" errors
```bash
rm -rf node_modules .next
npm install
npx prisma generate
```

### Port 3000 sudah dipakai
```bash
# Cek proses di port 3000
lsof -i :3000    # Linux/Mac
netstat -ano | findstr :3000  # Windows

# Atau jalankan di port lain:
PORT=3001 npm run dev
```

### Upload gagal / file tidak tersimpan
```bash
# Cek folder storage ada:
ls -la storage/sites/

# Jika belum ada:
mkdir -p storage/sites
```

### Prisma schema error setelah edit
```bash
npx prisma db push --force-reset
# ⚠️ Ini akan hapus semua data!
```

---

## Tools Berguna

### Prisma Studio (Database GUI)
```bash
npm run db:studio
# Buka http://localhost:5555
# Browse tabel users dan pages secara visual
```

### Reset semua data
```bash
# Reset database
npx prisma db push --force-reset

# Hapus semua uploaded files
rm -rf storage/sites/*

# Restart server
npm run dev
```

---

## Setelah Selesai Testing

Jika sudah puas dengan testing lokal, ikuti panduan deployment production di:

📄 **[docs/DEPLOYMENT.md](./DEPLOYMENT.md)**

Perbedaan utama untuk production:
1. Ganti `.env` dengan production values
2. Setup NGINX dengan wildcard subdomain config
3. Setup Cloudflare DNS wildcard record
4. Gunakan PM2 untuk process management
5. Gunakan SSL certificate
