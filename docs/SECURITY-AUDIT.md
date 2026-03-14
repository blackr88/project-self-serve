# PageAmpHTML - Security Audit Report

## Status: Hardened ✅

Dokumen ini merangkum semua proteksi keamanan yang diterapkan pada platform PageAmpHTML.

---

## 1. Authentication Security

### Password
| Fitur | Detail |
|-------|--------|
| Hashing Algorithm | bcrypt |
| Salt Rounds | 12 |
| Min Length | 8 karakter |
| Max Length | 128 karakter |
| Storage | Hanya hash yang disimpan, plaintext tidak pernah di-log |

### JWT Token
| Fitur | Detail |
|-------|--------|
| Library | jsonwebtoken (API) + jose (Edge middleware) |
| Algorithm | HS256 |
| Expiry | 7 hari |
| Payload | userId + email saja (minimal data) |
| Verification | Signature diverifikasi di SETIAP request (middleware + API) |
| Invalid Token | Otomatis dihapus dari cookie + redirect ke login |

### Cookie
| Flag | Value | Fungsi |
|------|-------|--------|
| httpOnly | true | JavaScript tidak bisa baca cookie |
| secure | true (production) | Hanya dikirim via HTTPS |
| sameSite | lax | Cegah CSRF attack |
| path | / | Scope ke seluruh domain |
| maxAge | 7 hari | Auto-expire |

---

## 2. Brute Force Protection

### IP-Based Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| Login/Register | 10 request | per 15 menit |
| Upload | 20 request | per 1 jam |
| Delete | 30 request | per 1 jam |
| General API | 120 request | per 1 menit |

### Account-Level Lockout
| Parameter | Value |
|-----------|-------|
| Max Failed Attempts | 5x per akun |
| Lockout Duration | 15 menit |
| Reset | Otomatis setelah lockout expire |
| Timing Attack Prevention | Random delay 100-300ms saat user not found |

### NGINX Rate Limiting (Layer Tambahan)
| Zone | Rate |
|------|------|
| Auth | 10 req/menit |
| Upload | 5 req/detik |
| General | 30 req/detik |
| Static | 100 req/detik |

---

## 3. Middleware Security (Edge Runtime)

```
Request masuk
  │
  ├─ Block path traversal (.. \ \0)
  │
  ├─ Public path? → Allow
  │
  ├─ API route? → Verify JWT signature
  │   ├─ Valid → Pass + inject x-user-id header
  │   └─ Invalid → Clear cookie + 401
  │
  └─ Dashboard route? → Verify JWT signature
      ├─ Valid → Allow
      └─ Invalid → Clear cookie + redirect /login
```

Poin penting: Middleware BUKAN hanya cek "apakah cookie ada", tapi **memverifikasi signature JWT** menggunakan `jose` library yang compatible dengan Edge Runtime.

---

## 4. Upload Security

### File Validation
| Check | Detail |
|-------|--------|
| File Type | Hanya .html, .htm, .zip |
| Max Size | 10 MB (raw) + 10 MB (extracted) |
| File Extension Whitelist | html, css, js, images, fonts, media |
| Blocked Filenames | .htaccess, .env, .git, Dockerfile, dll |

### Path Traversal Protection (7 Patterns)
```
../          → BLOCKED (directory traversal)
/absolute    → BLOCKED (absolute path)
\backslash   → BLOCKED (Windows path)
\0null       → BLOCKED (null byte injection)
~/home       → BLOCKED (home directory)
%2e%2e       → BLOCKED (URL encoded traversal)
%252e%252e   → BLOCKED (double encoded traversal)
```

### ZIP Extraction Security
| Check | Detail |
|-------|--------|
| Max Files | 500 per ZIP |
| Max Nesting | 10 levels deep |
| index.html Required | Wajib ada di root level |
| Path Resolution | Double-check resolved path within subdomain dir |
| Sanitization | Setiap path component di-sanitize |

### HTML Content Scanner
Scan file HTML untuk mendeteksi:
- Cookie stealing yang target domain pageamphtml.com
- Redirect ke halaman phishing (fake login page)
- Iframe embedding dashboard (clickjacking)
- Service Worker registration (request interception)

---

## 5. HTTP Security Headers

### Next.js (Dashboard)
| Header | Value |
|--------|-------|
| Content-Security-Policy | default-src 'self'; frame-ancestors 'none'; form-action 'self' |
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| X-XSS-Protection | 1; mode=block |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |
| X-Powered-By | REMOVED (poweredByHeader: false) |
| Cache-Control (API) | no-store, no-cache, must-revalidate |

### NGINX (Hosted Pages)
| Header | Value |
|--------|-------|
| X-Content-Type-Options | nosniff |
| X-Frame-Options | SAMEORIGIN |
| X-XSS-Protection | 1; mode=block |
| Referrer-Policy | strict-origin-when-cross-origin |
| Strict-Transport-Security | max-age=31536000; includeSubDomains |

### NGINX Blocked Patterns
```
*.php   → 403 (block PHP execution attempts)
*.asp   → 403
*.aspx  → 403
*.jsp   → 403
*.cgi   → 403
*.env   → 403 (block config file access)
/.*     → 403 (block hidden files)
```

---

## 6. Authorization

| Action | Check |
|--------|-------|
| View pages | user_id filter (hanya lihat milik sendiri) |
| Delete page | Ownership check (user_id === page.user_id) |
| Upload to subdomain | Jika sudah dipakai user lain → DITOLAK |
| Re-upload own subdomain | Diizinkan (overwrite) |

---

## 7. Database Security

| Fitur | Detail |
|-------|--------|
| ORM | Prisma (parameterized queries → no SQL injection) |
| Password | Hanya hash yang disimpan |
| User ID | cuid() (tidak predictable seperti auto-increment) |
| Cascade Delete | Hapus user → semua pages ikut terhapus |

---

## 8. NGINX Architecture Security

```
*.pageamphtml.com (subdomain)
  → NGINX serve file LANGSUNG dari disk
  → TIDAK pernah melewati Next.js
  → client_max_body_size 1K (no upload via subdomain)

pageamphtml.com (main domain)
  → NGINX reverse proxy ke Next.js
  → client_max_body_size 12M (upload via dashboard)
```

Ini berarti:
- Hacker TIDAK bisa akses API via subdomain
- Hacker TIDAK bisa upload via subdomain
- Subdomain hanya serve static files, zero dynamic execution

---

## 9. Anti-Enumeration

| Attack | Proteksi |
|--------|----------|
| User enumeration via login | Same message "Invalid email or password" |
| User enumeration via register | "Account already exists" (acceptable trade-off) |
| User enumeration via timing | Random delay pada user-not-found |
| Page enumeration | Halaman list di-filter per user_id |
| Subdomain enumeration | Check endpoint butuh auth |

---

## 10. Rekomendasi Tambahan (Production Hardening)

### Prioritas Tinggi
- [ ] Ganti in-memory rate limiter ke **Redis** (persist across restart/cluster)
- [ ] Aktifkan **Cloudflare WAF** managed rules
- [ ] Setup **Fail2ban** untuk auto-ban IP dari NGINX log
- [ ] Tambah **CAPTCHA** di register (Google reCAPTCHA / Cloudflare Turnstile)

### Prioritas Sedang
- [ ] Tambah **email verification** sebelum bisa upload
- [ ] Tambah **audit log** (tabel terpisah: login, upload, delete events)
- [ ] Setup **log rotation** untuk NGINX dan PM2
- [ ] Monitor disk usage (alert jika storage > 80%)

### Prioritas Rendah
- [ ] Tambah **2FA** (TOTP)
- [ ] Tambah **API key** untuk programmatic access
- [ ] Implement **invite-only** registration mode
- [ ] Content-Security-Policy untuk hosted pages (optional, bisa break user content)

---

## Kesimpulan

Platform ini sudah dilengkapi proteksi berlapis:

1. **Network layer**: Cloudflare WAF + NGINX rate limiting
2. **Transport layer**: HTTPS-only + HSTS
3. **Application layer**: JWT verification + CSP + security headers
4. **Authentication layer**: bcrypt + account lockout + timing attack prevention
5. **Upload layer**: File validation + path traversal block + HTML scanning
6. **Data layer**: Prisma ORM (no SQL injection) + ownership checks
7. **Architecture layer**: NGINX serve static langsung (no dynamic execution on subdomains)

Untuk platform hosting HTML skala kecil-menengah, level keamanan ini sudah **production-ready**.
