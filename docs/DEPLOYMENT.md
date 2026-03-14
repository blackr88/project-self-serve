# PageAmpHTML - Production Deployment Guide (VPS Ubuntu)

---

## Arsitektur

```
Internet
│
Cloudflare DNS (*.pageamphtml.com → Server IP)
│
NGINX
├── *.pageamphtml.com  → Static HTML dari /var/www/storage/sites/{subdomain}/
└── pageamphtml.com    → Reverse proxy ke Next.js :3000
                                │
                           PostgreSQL
```

---

## Prasyarat

- VPS Ubuntu 22.04+ (min 2GB RAM, 2 vCPU, 20GB SSD)
- Domain yang sudah diarahkan ke Cloudflare
- Akses SSH root ke server

---

## Step 1 — Update Server & Install Tools

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip build-essential software-properties-common
```

---

## Step 2 — Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi
node -v    # v20.x.x
npm -v     # 10.x.x

# Install PM2
sudo npm install -g pm2
```

---

## Step 3 — Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Buat database & user
sudo -u postgres psql << 'EOF'
CREATE USER pageamphtml WITH PASSWORD 'GANTI_PASSWORD_KUAT_DISINI';
CREATE DATABASE pageamphtml OWNER pageamphtml;
GRANT ALL PRIVILEGES ON DATABASE pageamphtml TO pageamphtml;
\q
EOF
```

> **PENTING**: Ganti `GANTI_PASSWORD_KUAT_DISINI` dengan password yang kuat.

Verifikasi:
```bash
psql -h localhost -U pageamphtml -d pageamphtml -c "SELECT 1;"
```

---

## Step 4 — Install NGINX

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Step 5 — Buat Direktori

```bash
sudo mkdir -p /var/www/pageamphtml
sudo mkdir -p /var/www/storage/sites
sudo mkdir -p /var/www/storage/error-pages
sudo mkdir -p /var/log/pageamphtml
sudo mkdir -p /etc/nginx/ssl

sudo chown -R $USER:$USER /var/www/pageamphtml
sudo chown -R $USER:$USER /var/www/storage
sudo chown -R $USER:$USER /var/log/pageamphtml
```

---

## Step 6 — Upload Project

```bash
cd /var/www/pageamphtml

# Option A: Git
git clone https://github.com/your-repo/pageamphtml.git .

# Option B: SCP dari local
# scp pageamphtml.tar.gz user@SERVER_IP:/var/www/
# cd /var/www && tar -xzf pageamphtml.tar.gz && mv pageamphtml/* /var/www/pageamphtml/

# Install dependencies
npm install
```

---

## Step 7 — Konfigurasi Environment

```bash
cp .env.example .env
nano .env
```

Isi `.env`:
```env
DATABASE_URL="postgresql://pageamphtml:GANTI_PASSWORD_KUAT_DISINI@localhost:5432/pageamphtml?schema=public"

JWT_SECRET="GENERATE_RANDOM_STRING_64_KARAKTER"
JWT_EXPIRES_IN="7d"

NEXT_PUBLIC_APP_URL="https://pageamphtml.com"
NEXT_PUBLIC_APP_DOMAIN="pageamphtml.com"
STORAGE_PATH="/var/www/storage/sites"

MAX_UPLOAD_SIZE_MB=10
MAX_PAGES_PER_USER=50

NODE_ENV="production"
```

Generate JWT secret:
```bash
openssl rand -hex 32
```

---

## Step 8 — Setup Database (Prisma)

```bash
cd /var/www/pageamphtml

npx prisma generate
npx prisma db push
```

Output yang diharapkan:
```
🚀 Your database is now in sync with your Prisma schema.
```

---

## Step 9 — Build Next.js

```bash
npm run build
```

Copy error pages:
```bash
cp nginx/error-pages/* /var/www/storage/error-pages/
```

---

## Step 10 — Setup Cloudflare DNS

Login ke Cloudflare Dashboard → Domain Anda → **DNS** → **Records**:

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| A | `@` | `IP_SERVER_ANDA` | ON (orange cloud) | Auto |
| A | `*` | `IP_SERVER_ANDA` | ON (orange cloud) | Auto |

Record `*` (wildcard) wajib ada — ini yang membuat semua subdomain mengarah ke server.

**SSL/TLS Settings:**
1. SSL/TLS → Overview → Set ke **Full (strict)**
2. Edge Certificates → Enable **Always Use HTTPS**
3. Edge Certificates → Min TLS Version → **1.2**

---

## Step 11 — SSL Certificate

### Option A: Cloudflare Origin Certificate (Recommended)

1. Cloudflare → SSL/TLS → Origin Server → **Create Certificate**
2. Hostnames: `pageamphtml.com`, `*.pageamphtml.com`
3. Validity: 15 years
4. Simpan certificate dan key:

```bash
sudo nano /etc/nginx/ssl/pageamphtml.com.crt
# Paste Origin Certificate

sudo nano /etc/nginx/ssl/pageamphtml.com.key
# Paste Private Key

sudo chmod 600 /etc/nginx/ssl/pageamphtml.com.key
sudo chmod 644 /etc/nginx/ssl/pageamphtml.com.crt
```

### Option B: Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d pageamphtml.com -d "*.pageamphtml.com"
```

---

## Step 12 — Setup NGINX

```bash
# Hapus default
sudo rm -f /etc/nginx/sites-enabled/default

# Copy config
sudo cp /var/www/pageamphtml/nginx/pageamphtml.conf /etc/nginx/sites-available/pageamphtml.conf

# Aktifkan
sudo ln -sf /etc/nginx/sites-available/pageamphtml.conf /etc/nginx/sites-enabled/

# Jika domain bukan pageamphtml.com, ganti:
sudo sed -i 's/pageamphtml\.com/domainanda.com/g' /etc/nginx/sites-available/pageamphtml.conf

# Test & reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 13 — Jalankan dengan PM2

```bash
cd /var/www/pageamphtml

pm2 start ecosystem.config.js
pm2 save
pm2 startup
# Ikuti instruksi output dari pm2 startup
```

Verifikasi:
```bash
pm2 status
pm2 logs pageamphtml
```

---

## Step 14 — Setup Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Step 15 — Set Permission Storage

```bash
# Node.js process perlu write access ke storage
sudo chown -R $USER:www-data /var/www/storage/sites
sudo chmod -R 775 /var/www/storage/sites
```

---

## Step 16 — First Access (Buat Akun Admin)

1. Buka `https://pageamphtml.com` di browser
2. Anda akan otomatis diarahkan ke halaman **Setup**
3. Buat akun admin pertama (email + password)
4. Setelah submit, halaman Setup **tidak akan pernah muncul lagi**
5. Anda masuk ke Dashboard sebagai admin

**Menambah user baru:**
- Login sebagai admin
- Buka menu **User Management** di sidebar
- Klik **Add User** → isi email, password, pilih role (user / admin)

---

## Step 17 — Backup Otomatis

```bash
cat > /var/www/pageamphtml/scripts/backup.sh << 'SCRIPT'
#!/bin/bash
BACKUP_DIR="/var/backups/pageamphtml"
TS=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U pageamphtml pageamphtml > "$BACKUP_DIR/db_$TS.sql"
tar -czf "$BACKUP_DIR/storage_$TS.tar.gz" /var/www/storage/sites/
find $BACKUP_DIR -type f -mtime +7 -delete
echo "Backup done: $TS"
SCRIPT

chmod +x /var/www/pageamphtml/scripts/backup.sh

# Jadwalkan jam 2 pagi setiap hari
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/pageamphtml/scripts/backup.sh") | crontab -
```

---

## Update Aplikasi

```bash
cd /var/www/pageamphtml
git pull origin main        # atau upload file baru
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 restart pageamphtml
```

---

## Troubleshooting

### NGINX error
```bash
sudo nginx -t
sudo journalctl -u nginx -f
```

### Subdomain tidak muncul
```bash
ls -la /var/www/storage/sites/NAMA_SUBDOMAIN/
curl -H "Host: NAMA.pageamphtml.com" http://localhost
```

### Database connection error
```bash
sudo systemctl status postgresql
cat .env | grep DATABASE_URL
```

### Build error
```bash
rm -rf .next node_modules
npm install
npm run build
```

### PM2 tidak berjalan
```bash
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

---

## Ringkasan Port & Direktori

| Service | Port | Fungsi |
|---------|------|--------|
| Next.js | 3000 | Dashboard + API |
| PostgreSQL | 5432 | Database |
| NGINX | 80/443 | Static files + reverse proxy |

| Direktori | Fungsi |
|-----------|--------|
| `/var/www/pageamphtml/` | Source code |
| `/var/www/storage/sites/` | File HTML user |
| `/var/www/storage/error-pages/` | Custom 404/403 |
| `/etc/nginx/ssl/` | SSL certificate |

---

## Alur Registrasi User

```
Pertama kali akses → /setup → Buat admin → Selesai (setup ditutup permanen)
                                                │
                                                ▼
                              Admin login → Dashboard → User Management
                                                            │
                                                   Buat user baru (admin/user)
                                                            │
                                                   User login → Dashboard → Upload
```

**Tidak ada halaman register publik.** Semua user didaftarkan oleh admin.
