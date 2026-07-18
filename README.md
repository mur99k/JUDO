# نادي الريادة للجودو — Al-Riyadah Judo Club

> Arabic (RTL) web application for managing a Saudi judo club.  
> **Live:** https://riyadah-judo.onrender.com  
> **Version:** 1.0.0-beta

---

## Quick Start

```bash
# Prerequisites: Node.js 18+
git clone https://github.com/mur99k/JUDO.git
cd JUDO

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Default .env uses SQLite + local storage — no changes needed for dev

# Run the app (auto-migrates on first start)
npm start

# Open in browser
open http://localhost:3000
```

The app runs on port 3000. Login with the seeded admin account (see [Admin Access](#admin-access)).

---

## Features

### Public Website
- Home page with hero slider, services, achievements gallery, and coach profiles
- About page with club vision, mission, goals, and photo gallery
- Contact page with WhatsApp, Call, Location cards, and contact form
- Student self-registration (national ID-based)
- Fully responsive Arabic (RTL) design

### Admin Dashboard
Manage students, coaches, attendance, subscriptions, gallery, settings, and reports.

### Coach Dashboard
View students, mark attendance, and see quick stats.

### Student Portal
View profile, attendance history, and subscription status.

---

## Architecture

```
┌──────────────────────────────────────────────┐
│                 Browser (RTL)                 │
├──────────────────────────────────────────────┤
│            Node.js / Express.js               │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Routes   │→ │Controllers│→ │  Services  │  │
│  └──────────┘  └──────────┘  └──────┬─────┘  │
│                                     │         │
│  ┌──────────────────────────────────┴──────┐  │
│  │           Repositories                  │  │
│  │  ┌──────────────────────────────────┐   │  │
│  │  │   Database Adapter (pg/sqlite)   │   │  │
│  │  └──────────────────────────────────┘   │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │    Storage Adapter (R2/local)            │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │    EJS Views (server-side rendered)     │  │
│  └─────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

## Project Structure

```
kilocode/
├── client/                    # CSS, JS, images (frontend assets)
├── scripts/                   # Verification & utility scripts
├── src/
│   ├── app.js                 # Express app setup
│   ├── config/                # Environment config
│   ├── controllers/           # Request handlers
│   ├── database/              # Schema + migration + DB adapter
│   ├── middleware/             # Auth, error handling, upload
│   ├── repositories/          # Data access (SQL)
│   ├── routes/                # Express route definitions
│   ├── services/              # Business logic
│   ├── storage/               # File storage adapter (R2/local)
│   ├── utils/                 # Helpers (date, errors, logger, response)
│   └── views/                 # EJS templates (layouts, components, pages)
├── server.js                  # Entry point
├── render.yaml                # Render Blueprint config
├── .env.example               # Environment variable template
└── package.json
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | `development` | `production` on Render |
| `SESSION_SECRET` | `change-me` | Long random string for session encryption |
| `DB_TYPE` | `sqlite` | `postgres` for production |
| `DATABASE_URL` | (empty) | Neon PostgreSQL connection string |
| `STORAGE_TYPE` | `local` | `r2` for production |
| `R2_BUCKET` | (empty) | Cloudflare R2 bucket name |
| `R2_ENDPOINT` | (empty) | R2 endpoint URL |
| `R2_ACCESS_KEY_ID` | (empty) | R2 access key |
| `R2_SECRET_ACCESS_KEY` | (empty) | R2 secret key |
| `R2_PUBLIC_URL` | (empty) | R2 public bucket URL |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |
| `HTTPS` | `true` | Trust proxy headers |

See `.env.example` for full documentation.

---

## Database

The app auto-migrates on first start. Two SQL modes:

- **Development** (default): SQLite via `better-sqlite3`. File at `./database.sqlite` or `DB_PATH`.
- **Production**: PostgreSQL via `pg`. Set `DB_TYPE=postgres` and `DATABASE_URL`.

Migration files:
- `src/database/schema-postgres.sql` — Production schema
- `src/database/schema-sqlite.sql` — Development schema
- `src/database/migrate.js` — Migration runner (runs on boot)

---

## Admin Access

Seeded accounts (created on every boot):

| Role | Name | Email | Password |
|------|------|-------|----------|
| Admin | الكابتن معتوق | Matoq701@gmail.com | Ma123456 |
| Coach | كابتن معتوق | coach.moataq@riyadah.com | coach123 |
| Coach | كابتن مروان | coach.marwan@riyadah.com | coach123 |

---

## API Overview

All API routes are prefixed with `/api`. See `PROJECT_HANDOFF.md` for the complete API reference.

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | Login (admin/coach with email, student with nationalId) |
| `POST /api/auth/register` | Student self-registration |
| `GET /api/auth/me` | Get current user info |
| `GET/POST/PUT/DELETE /api/students` | Student CRUD |
| `GET/POST/PUT/DELETE /api/coaches` | Coach CRUD |
| `GET/POST /api/attendance` | Attendance management |
| `GET/POST/PUT/DELETE /api/subscriptions` | Subscription CRUD |
| `GET /api/reports/dashboard` | Dashboard statistics |
| `GET /api/health` | Health check |

---

## Verification

```bash
# Quick smoke test
node scripts/smoke-test.js

# Production verification (105 checks)
node scripts/final-verification.js

# Full acceptance test (112 checks)
node scripts/acceptance-test.js

# Student lifecycle test (56 checks)
node scripts/lifecycle-test.js
```

---

## Deployment

The project uses **Render Blueprint** for deployment. On every push to `main`:

1. Render builds `npm install`
2. Starts with `node server.js`
3. App auto-migrates the database

### Required Services

- **Neon PostgreSQL** (free tier): Connection string → `DATABASE_URL`
- **Cloudflare R2** (free tier): Bucket credentials → `R2_*` variables

See `render.yaml` for the full Blueprint configuration and `PROJECT_HANDOFF.md` for step-by-step deployment instructions.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the server |
| `npm run dev` | Start the server (same as start) |
| `npm run build` | Run database migrations only |
| `node scripts/final-verification.js` | Run 105 production checks |
| `node scripts/acceptance-test.js` | Run 112 end-to-end acceptance checks |
| `node scripts/cleanup-prod.js` | Delete all test data from production |
| `node scripts/backup-db.js` | Backup SQLite database |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Templating | EJS (server-side rendered, RTL) |
| Database | PostgreSQL (Neon) / SQLite |
| Storage | Cloudflare R2 / local filesystem |
| Session | express-session (MemoryStore) |
| Auth | bcryptjs |
| Linting | ESLint |

---

## License

Developed by MUR99K for نادي الريادة للجودو.
