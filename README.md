# PageAmpHTML

**Static HTML Hosting Platform with Automatic Subdomain Routing**

A self-hosted SaaS platform for deploying static HTML pages with custom subdomains. Similar to Cloudflare Pages or Vercel, but focused exclusively on static HTML hosting.

## Features

- **Instant Deploy** — Upload HTML or ZIP, get a live subdomain immediately
- **Automatic Subdomains** — `yourpage.pageamphtml.com` created on upload
- **ZIP Support** — Upload multi-file sites with CSS, JS, and images
- **NGINX Direct Serving** — Static files served by NGINX, not Node.js
- **User Dashboard** — Manage pages, view stats, copy URLs
- **Auth System** — JWT-based authentication with bcrypt password hashing
- **Rate Limiting** — Built-in protection against abuse
- **Upload Security** — Path traversal protection, file validation, size limits

## Architecture

```
Internet → Cloudflare DNS → NGINX → Static HTML Storage (direct serving)
                                  → Next.js Dashboard + API → PostgreSQL
```

**Key design**: NGINX serves hosted HTML files directly. Next.js only handles the dashboard, authentication, and upload API.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT + bcrypt
- **Web Server**: NGINX (wildcard subdomain routing)
- **DNS**: Cloudflare (wildcard DNS)

## Quick Start (Development)

```bash
# Clone and install
git clone <repo-url>
cd pageamphtml
npm install

# Setup database
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

## Production Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the complete VPS deployment guide.

## Project Structure

```
pageamphtml/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login & Register pages
│   │   ├── (dashboard)/       # Dashboard, My Pages, Upload, Settings
│   │   └── api/               # API routes
│   ├── components/            # Reusable UI components
│   └── lib/                   # Utilities & helpers
├── nginx/
│   ├── pageamphtml.conf       # NGINX configuration
│   └── error-pages/           # Custom 404/403 pages
├── scripts/
│   └── setup.js               # Initial setup script
├── docs/
│   └── DEPLOYMENT.md          # Full deployment guide
└── ecosystem.config.js        # PM2 configuration
```

## API Endpoints

| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| POST   | `/api/register`       | Create account       |
| POST   | `/api/login`          | Sign in              |
| POST   | `/api/logout`         | Sign out             |
| GET    | `/api/user`           | Get user info        |
| PUT    | `/api/user/password`  | Change password      |
| GET    | `/api/pages`          | List user's pages    |
| POST   | `/api/pages/upload`   | Upload HTML/ZIP      |
| GET    | `/api/pages/check`    | Check subdomain      |
| DELETE | `/api/pages/:id`      | Delete a page        |

## User Limits

- Maximum **50 pages** per user
- Maximum **10 MB** per upload
- Accepted files: `.html`, `.htm`, `.zip`

## License

MIT
