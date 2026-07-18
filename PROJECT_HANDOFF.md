# Project Handoff — نادي الريادة للجودو (Al-Riyadah Judo Club)

> **Version:** 1.0.0-beta  
> **Release Date:** July 18, 2026  
> **Live URL:** https://riyadah-judo.onrender.com  
> **Repository:** https://github.com/mur99k/JUDO

---

## Table of Contents

1. [Project Architecture](#1-project-architecture)
2. [Folder Structure](#2-folder-structure)
3. [Database Schema](#3-database-schema)
4. [Environment Variables](#4-environment-variables)
5. [API Endpoints](#5-api-endpoints)
6. [User Roles & Permissions](#6-user-roles--permissions)
7. [Deployment Instructions](#7-deployment-instructions)
8. [Render Configuration](#8-render-configuration)
9. [Neon Configuration](#9-neon-configuration)
10. [Cloudflare R2 Configuration](#10-cloudflare-r2-configuration)
11. [Backup & Recovery](#11-backup--recovery)
12. [Security Recommendations](#12-security-recommendations)
13. [Future Roadmap](#13-future-roadmap)
14. [Known Limitations](#14-known-limitations)

---

## 1. Project Architecture

### Overview

Full-stack Arabic (RTL) web application for managing a Saudi judo club. Built with Node.js/Express.js backend, EJS templating, and a dual-mode database adapter supporting PostgreSQL (production) and SQLite (development).

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | Node.js 18+, Express.js 4 | HTTP server, routing, middleware |
| Templating | EJS 3 | Server-side HTML rendering (RTL) |
| Database | PostgreSQL (Neon) / SQLite | Dual adapter — pg for production, better-sqlite3 for dev |
| Storage | Cloudflare R2 / Local FS | Dual adapter — R2 for production, local for dev |
| Auth | express-session + bcryptjs | Session-based auth with role-based access control |
| Infrastructure | Render Free + Neon + Cloudflare | Hosting, database, media storage |

### Architectural Patterns

- **Repository Pattern**: Data access layer abstracts SQL behind repository objects
- **Service Layer**: Business logic encapsulated in service objects
- **Controller Layer**: HTTP request handling, validation, response formatting
- **Unified DB Adapter**: Single `getConnection()` API with dialect translation
- **Dual Storage Adapter**: Single `storage.upload()`/`remove()` API with provider switching

### Data Flow

```
Browser → Express Routes → Middleware (auth, upload) → Controller
  → Service → Repository → Database Adapter → PostgreSQL/SQLite
  → Service → Storage Adapter → Cloudflare R2 / Local FS
  → Controller → EJS View → Browser
```

---

## 2. Folder Structure

```
kilocode/
├── client/                    # Frontend static assets
│   ├── assets/                # Images, fonts, icons
│   ├── scripts/               # Client-side JavaScript (dashboard pages)
│   │   └── pages/dashboard/   # One JS file per dashboard page
│   └── styles/                # CSS
│       ├── base.css           # CSS variables, resets, typography
│       ├── components.css     # Reusable UI components
│       ├── utilities.css      # Utility classes
│       └── pages/             # Page-specific CSS
├── logo/                      # Club logo files
├── scripts/                   # Verification & utility scripts
│   ├── acceptance-test.js     # Full end-to-end acceptance test (112 checks)
│   ├── backup-db.js           # SQLite backup utility
│   ├── cleanup-prod.js        # Production data cleanup
│   ├── final-verification.js  # Production verification suite (105 checks)
│   ├── lifecycle-test.js      # Student lifecycle test (56 checks)
│   ├── prod-smoke.js          # Production smoke test
│   └── smoke-test.js          # Basic smoke test
├── src/                       # Application source code
│   ├── app.js                 # Express app setup
│   ├── config/
│   │   └── index.js           # Environment config loader
│   ├── controllers/           # Request handlers
│   │   ├── attendance.controller.js
│   │   ├── auth.controller.js
│   │   ├── coach.controller.js
│   │   ├── gallery.controller.js
│   │   ├── page.controller.js # SSR page rendering
│   │   ├── report.controller.js
│   │   ├── settings.controller.js
│   │   ├── student.controller.js
│   │   └── subscription.controller.js
│   ├── database/
│   │   ├── connection.js      # Unified DB adapter (pg ↔ sqlite)
│   │   ├── migrate.js         # Schema migration runner
│   │   ├── schema-postgres.sql
│   │   └── schema-sqlite.sql
│   ├── middleware/
│   │   ├── auth.js            # Role-based access middleware
│   │   ├── error.js           # Global error handler
│   │   └── upload.js          # File upload middleware (multer)
│   ├── repositories/          # Data access layer
│   │   ├── attendance.repo.js
│   │   ├── contact.repo.js
│   │   ├── settings.repo.js
│   │   ├── student.repo.js
│   │   ├── subscription.repo.js
│   │   └── user.repo.js
│   ├── routes/
│   │   ├── index.js           # Route aggregator
│   │   ├── attendance.routes.js
│   │   ├── auth.routes.js
│   │   ├── coach.routes.js
│   │   ├── gallery.routes.js
│   │   ├── page.routes.js
│   │   ├── report.routes.js
│   │   ├── settings.routes.js
│   │   ├── student.routes.js
│   │   └── subscription.routes.js
│   ├── services/              # Business logic layer
│   │   ├── attendance.service.js
│   │   ├── auth.service.js
│   │   ├── coach.service.js
│   │   ├── gallery.service.js
│   │   ├── report.service.js
│   │   ├── settings.service.js
│   │   ├── student.service.js
│   │   ├── subscription.service.js
│   │   └── system.service.js
│   ├── storage/
│   │   └── index.js           # Storage adapter (R2 ↔ local)
│   ├── utils/
│   │   ├── date.js            # Date helpers
│   │   ├── errors.js          # Custom error classes
│   │   ├── logger.js          # File logger
│   │   └── response.js        # Response formatters
│   └── views/                 # EJS templates
│       ├── layouts/
│       │   ├── dashboard.ejs  # Dashboard shell
│       │   └── public.ejs     # Public page shell
│       ├── components/        # Reusable partials
│       │   ├── dashboard-header.ejs
│       │   ├── footer.ejs
│       │   ├── navbar.ejs
│       │   ├── sidebar.ejs
│       │   ├── toast-container.ejs
│       │   └── whatsapp.ejs
│       └── pages/
│           ├── index.ejs      # Home page
│           ├── about.ejs
│           ├── contact.ejs
│           ├── login.ejs
│           ├── register.ejs
│           ├── student.ejs
│           ├── coach.ejs
│           └── dashboard/     # Dashboard pages
│               ├── overview.ejs
│               ├── students.ejs
│               ├── attendance.ejs
│               ├── student-report.ejs
│               ├── subscriptions.ejs
│               ├── reports.ejs
│               ├── coaches.ejs
│               ├── gallery.ejs
│               ├── system-health.ejs
│               ├── settings.ejs
│               └── profile.ejs
├── server.js                  # Entry point
├── render.yaml                # Render Blueprint config
├── .env.example               # Environment template
├── package.json
├── CHANGELOG.md
├── RELEASE_NOTES.md
├── PROJECT_HANDOFF.md
└── DEPLOYMENT.md
```

### Media Directories (Arabic-named, synced to R2)

```
صور الخلفية في الصفحة الرئيسية/   # Home page hero backgrounds
بطولات وجوائز/                    # Gallery / achievement photos
صور المدربين/                     # Coach profile photos
صور عن النادي/                    # About page photos
```

---

## 3. Database Schema

### Tables

#### `users` — Admin and coach accounts
| Column | Type | Constraints |
|--------|------|------------|
| id | SERIAL | PRIMARY KEY |
| fullName | TEXT | NOT NULL |
| email | TEXT | UNIQUE |
| phone | TEXT | |
| password | TEXT | NOT NULL (bcrypt hash) |
| profileImage | TEXT | |
| role | TEXT | NOT NULL DEFAULT 'admin' CHECK IN ('admin', 'coach') |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### `students` — Student records
| Column | Type | Constraints |
|--------|------|------------|
| id | SERIAL | PRIMARY KEY |
| fullName | TEXT | NOT NULL |
| nationalId | TEXT | UNIQUE |
| age | INTEGER | |
| phone | TEXT | |
| parentPhone | TEXT | |
| photo | TEXT | |
| password | TEXT | (for student self-login) |
| category | TEXT | (براعم, أشبال, ناشئين, شباب, فريق أول) |
| status | TEXT | DEFAULT 'نشط' CHECK IN ('نشط', 'منتهي', 'موقوف', 'بانتظار الدفع', 'ملغي') |
| createdAt | TIMESTAMP | |
| updatedAt | TIMESTAMP | |

#### `attendance` — Daily attendance records
| Column | Type | Constraints |
|--------|------|------------|
| id | SERIAL | PRIMARY KEY |
| studentId | INTEGER | NOT NULL REFERENCES students(id) ON DELETE CASCADE |
| date | TEXT | NOT NULL |
| status | TEXT | NOT NULL CHECK IN ('حاضر', 'غائب', 'معذر') |
| notes | TEXT | |
| createdAt | TIMESTAMP | |
| UNIQUE(studentId, date) | | |

#### `subscriptions` — Student subscriptions
| Column | Type | Constraints |
|--------|------|------------|
| id | SERIAL | PRIMARY KEY |
| studentId | INTEGER | NOT NULL REFERENCES students(id) ON DELETE CASCADE |
| type | TEXT | NOT NULL |
| days | INTEGER | DEFAULT 30 |
| amount | REAL | NOT NULL |
| startDate | TEXT | NOT NULL |
| endDate | TEXT | NOT NULL |
| status | TEXT | DEFAULT 'نشط' CHECK IN ('نشط', 'منتهي', 'موقوف', 'بانتظار الدفع', 'ملغي') |
| paymentMethod | TEXT | |
| notes | TEXT | |
| createdAt | TIMESTAMP | |

#### `settings` — Key-value configuration
| Column | Type | Constraints |
|--------|------|------------|
| key | TEXT | PRIMARY KEY |
| value | TEXT | NOT NULL |

#### `contact_messages` — Contact form submissions
| Column | Type | Constraints |
|--------|------|------------|
| id | SERIAL | PRIMARY KEY |
| name | TEXT | NOT NULL |
| phone | TEXT | |
| message | TEXT | |
| createdAt | TIMESTAMP | |

#### `coach_groups` — Coach-student assignment (schema only, no UI)
| Column | Type | Constraints |
|--------|------|------------|
| id | SERIAL | PRIMARY KEY |
| coachId | INTEGER | NOT NULL REFERENCES users(id) ON DELETE CASCADE |
| studentId | INTEGER | NOT NULL REFERENCES students(id) ON DELETE CASCADE |

### Key Relationships

```
users 1──M coach_groups M──1 students
students 1──M attendance
students 1──M subscriptions
```

All foreign keys use `ON DELETE CASCADE` — deleting a student removes their attendance and subscriptions.

---

## 4. Environment Variables

See `.env.example` for defaults and descriptions.

| Variable | Required | Production Value | Purpose |
|----------|----------|-----------------|---------|
| `PORT` | Yes | 3000 | Server port |
| `NODE_ENV` | Yes | `production` | Enables view cache, secure cookies, file logging |
| `SESSION_SECRET` | Yes | Auto-generated (Render) | Session encryption key |
| `HTTPS` | Yes | `true` | Trust proxy headers, secure cookies |
| `CORS_ORIGIN` | Yes | `https://riyadah-judo.onrender.com` | Allowed CORS origins (comma-separated) |
| `DB_TYPE` | Yes | `postgres` | Database flavor |
| `DATABASE_URL` | Yes | Neon connection string | PostgreSQL connection |
| `DB_PATH` | No | `./data/club.db` | SQLite path (dev only) |
| `STORAGE_TYPE` | Yes | `r2` | Storage backend |
| `R2_BUCKET` | Yes* | `judo-media` | R2 bucket name |
| `R2_ENDPOINT` | Yes* | `https://<id>.r2.cloudflarestorage.com` | R2 endpoint |
| `R2_REGION` | No | `auto` | R2 region |
| `R2_ACCESS_KEY_ID` | Yes* | R2 access key | R2 credential |
| `R2_SECRET_ACCESS_KEY` | Yes* | R2 secret key | R2 credential |
| `R2_PUBLIC_URL` | Yes* | `https://pub-<hash>.r2.dev` | Public bucket URL |
| `UPLOAD_PATH` | No | `./uploads` | Local upload path (dev) |
| `MAX_FILE_SIZE` | No | `5242880` | Max upload size (bytes) |
| `LOG_LEVEL` | No | `info` | Logging level |
| `LOG_DIR` | No | `./logs` | Log directory |

*Required when `STORAGE_TYPE=r2`

---

## 5. API Endpoints

### Authentication (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/login` | Public | Login (admin email/password or student nationalId) |
| POST | `/register` | Public | Student self-registration |
| POST | `/logout` | Session | Destroy session |
| GET | `/me` | Session | Get current user info |
| POST | `/contact` | Public | Submit contact form |
| PUT | `/profile` | Session | Update own profile |
| PUT | `/change-password` | Session | Change own password |

### Students (`/api/students`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Admin/Coach | List students (query: search, status, category, page, limit) |
| GET | `/:id` | Admin/Coach | Get student by ID (includes attendance stats + subscriptions) |
| POST | `/` | Admin | Create student |
| PUT | `/:id` | Admin/Coach | Update student |
| DELETE | `/:id` | Admin | Delete student (cascades attendance + subscriptions) |

### Coaches (`/api/coaches`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Admin | List all coaches |
| GET | `/:id` | Admin | Get coach by ID |
| POST | `/` | Admin | Create coach |
| PUT | `/:id` | Admin | Update coach |
| DELETE | `/:id` | Admin | Delete coach |

### Attendance (`/api/attendance`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Admin/Coach | Get attendance by date (query: date) |
| GET | `/today` | Admin/Coach | Get today's attendance |
| POST | `/` | Admin/Coach | Save attendance records `{ records: [{ studentId, date, status, notes }] }` |
| GET | `/summary` | Admin/Coach | Monthly summary (query: month, year) |
| GET | `/monthly-grid` | Admin | Monthly grid view (query: month, year) |
| GET | `/student/:studentId/report` | Admin/Coach | Student report (query: startDate, endDate) |
| GET | `/student/:studentId/stats` | Admin/Coach | Student all-time stats |

### Subscriptions (`/api/subscriptions`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Admin | List subscriptions (query: status, studentId) |
| GET | `/:id` | Admin | Get subscription by ID |
| POST | `/` | Admin | Create subscription |
| PUT | `/:id` | Admin | Update subscription |
| DELETE | `/:id` | Admin | Delete subscription |
| GET | `/summary` | Admin/Coach | Subscription stats (active count, revenue) |
| GET | `/stats` | Admin | Detailed subscription stats |

### Reports (`/api/reports`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard` | Admin | Dashboard report (counts + recent students) |
| GET | `/students` | Admin | Student statistics |
| GET | `/subscriptions` | Admin | Subscription statistics |

### Gallery (`/api/gallery`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List gallery photos |
| POST | `/upload` | Admin | Upload photo (multipart/form-data, field: photo) |
| DELETE | `/:name` | Admin | Delete photo by filename |

### Settings (`/api/settings`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Admin | List all settings |
| PUT | `/:key` | Admin | Update setting |

### Other

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | Public | Health check (returns DB, storage, app status) |

### Page Routes (SSR)

| Path | Auth | Description |
|------|------|-------------|
| `/` | Public | Home page |
| `/about` | Public | About page |
| `/contact` | Public | Contact page |
| `/login` | Public | Login page |
| `/register` | Public | Registration page |
| `/dashboard` | Admin/Coach | Dashboard overview |
| `/dashboard/students` | Admin/Coach | Student management |
| `/dashboard/attendance` | Admin/Coach | Attendance management |
| `/dashboard/attendance/student/:id` | Admin/Coach | Student report |
| `/dashboard/subscriptions` | Admin | Subscription management |
| `/dashboard/reports` | Admin | Reports |
| `/dashboard/coaches` | Admin | Coach management |
| `/dashboard/gallery` | Admin | Gallery management |
| `/dashboard/settings` | Admin | Settings |
| `/dashboard/system-health` | Admin | System health |
| `/dashboard/profile` | Admin/Coach | Profile |
| `/student` | Student | Student portal |
| `/coach` | Coach | Coach portal |

---

## 6. User Roles & Permissions

| Permission | Admin | Coach | Student | Public |
|-----------|-------|-------|---------|--------|
| View public pages | ✅ | ✅ | ✅ | ✅ |
| Register as student | ❌ | ❌ | ❌ | ✅ |
| Login | ✅ | ✅ | ✅ | ❌ |
| View own profile | ✅ | ✅ | ✅ | ❌ |
| Manage students (CRUD) | ✅ | Read/Update only | ❌ | ❌ |
| Manage coaches (CRUD) | ✅ | ❌ | ❌ | ❌ |
| Manage attendance | ✅ | ✅ | ❌ | ❌ |
| Manage subscriptions | ✅ | ❌ | ❌ | ❌ |
| View reports | ✅ | Read only | ❌ | ❌ |
| Manage gallery | ✅ | ❌ | ❌ | ❌ |
| Manage settings | ✅ | ❌ | ❌ | ❌ |
| System health | ✅ | ❌ | ❌ | ❌ |
| View own attendance | ✅ | ✅ | ✅ | ❌ |
| View own subscription | ✅ | ✅ | ✅ | ❌ |

---

## 7. Deployment Instructions

### Local Development

```bash
# Prerequisites: Node.js 18+
git clone https://github.com/mur99k/JUDO.git
cd JUDO

# Install dependencies (better-sqlite3 is optional, installs automatically)
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env: set SESSION_SECRET, keep DB_TYPE=sqlite, STORAGE_TYPE=local

# Run the app (auto-migrates on first start)
npm start

# Open in browser
open http://localhost:3000
```

### Production (Render + Neon + Cloudflare R2)

1. **Fork/clone this repository** to your GitHub account.

2. **Create a Neon PostgreSQL database** (neon.tech):
   - Sign up for free (500 MB, serverless, no 90-day expiry)
   - Create a project → copy the pooled connection string (project-pooler DATABASE_URL)

3. **Create a Cloudflare R2 bucket**:
   - Enable public access
   - Generate access key + secret
   - Note the endpoint and public URL

4. **Deploy via Render Blueprint**:
   - Go to [dashboard.render.com](https://dashboard.render.com) → New → Blueprint
   - Connect your GitHub repo
   - Render auto-detects `render.yaml`
   - Set the following environment variables in the Render dashboard:
     - `DATABASE_URL` = your Neon connection string
     - `CORS_ORIGIN` = `https://your-app.onrender.com`
     - `R2_BUCKET` = `judo-media`
     - `R2_ENDPOINT` = your R2 endpoint URL
     - `R2_ACCESS_KEY_ID` = your R2 access key
     - `R2_SECRET_ACCESS_KEY` = your R2 secret key
     - `R2_PUBLIC_URL` = your R2 public bucket URL

5. **Deploy**: Render builds and deploys automatically. First deploy takes ~5 min.

6. **Verify**: Visit `https://your-app.onrender.com/api/health`

### Local Production Simulation

```bash
# Use PostgreSQL locally (requires local pg or Docker)
DB_TYPE=postgres DATABASE_URL=postgresql://localhost:5432/judo npm start

# Use R2 locally (requires R2 credentials)
STORAGE_TYPE=r2 R2_BUCKET=... R2_ENDPOINT=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_PUBLIC_URL=... npm start
```

---

## 8. Render Configuration

See `render.yaml` for the complete Blueprint configuration.

### Key Settings

| Setting | Value |
|---------|-------|
| Runtime | `node` |
| Plan | `free` |
| Region | `oregon` |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Health Check Path | `/api/health` |

### Environment Variables in Render

- `SESSION_SECRET` — Auto-generated by Render (`generateValue: true`)
- `PORT` — Injected automatically by Render; set `sync: false`
- All other secrets (DATABASE_URL, R2_*) must be set manually in Render dashboard

### Notes

- Render free tier **idles after 15 minutes of inactivity** — first request after idle takes 20-30s (cold start)
- No persistent disk on free tier — use Neon for DB, Cloudflare R2 for media
- Auto-deploys on push to `main` branch

---

## 9. Neon Configuration

### Database Setup

1. Create account at [neon.tech](https://neon.tech)
2. Create a project (choose region close to Render)
3. From the project dashboard, copy the **pooled connection string** (ends with `-pooler`)
4. Set as `DATABASE_URL` in Render environment variables

### Connection String Format

```
postgresql://user:password@ep-xxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Notes

- The `-pooler` connection string uses Neon's connection pooling (required for serverless)
- Free tier: 500 MB storage, no auto-suspend on the pooled endpoint
- No SSH or direct connection needed — the app migrates itself on boot

---

## 10. Cloudflare R2 Configuration

### Bucket Setup

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → R2
2. Create bucket named `judo-media` (or any name)
3. Under bucket settings → Public Access → allow public access
4. Note the public URL: `https://pub-<hash>.r2.dev`
5. Go to R2 → API Tokens → Create API Token
6. Grant **Admin Read + Write** to the bucket
7. Save the Access Key ID and Secret Access Key

### CORS Configuration

R2 does not enforce CORS for public buckets, but you may want to add a CORS policy via the S3 API if you upload directly from the browser. Currently all uploads are server-side via multer.

### Media Directory Mapping

| Local Directory | R2 Prefix | Purpose |
|-----------------|-----------|---------|
| `uploads/` | `gallery/` | Gallery photos |
| `uploads/students/` | `students/` | Student profile photos |
| `صور المدربين/` | `coaches/` | Coach profile photos |

### Notes

- R2 free tier: 10 GB storage, 1 million A-class operations/month
- All uploads go through the Node.js server (not direct-to-browser)
- Gallery fallback: if R2 upload fails, files are served from local filesystem

---

## 11. Backup & Recovery

### Database

**Production (Neon PostgreSQL):**
- Neon provides automatic point-in-time recovery (7-day retention on paid, limited on free)
- Manual dump: `pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql`
- Restore: `psql "$DATABASE_URL" < backup.sql`

**Local (SQLite):**
- Use `scripts/backup-db.js` for hot backup
- Manual: `cp database.sqlite backup_$(date +%Y%m%d).sqlite`

### Media (Cloudflare R2)

- R2 stores all uploaded media (gallery, student photos, coach photos)
- To backup: use `aws s3 sync s3://judo-media ./backup-r2/ --endpoint-url <R2_ENDPOINT>`
- To restore: `aws s3 sync ./backup-r2/ s3://judo-media/ --endpoint-url <R2_ENDPOINT>`

### Restore Procedure

In case of complete failure:
1. Restore PostgreSQL from backup
2. Restore R2 bucket from backup
3. Deploy the app (auto-migrates on boot)
4. Admin account password is reset on every boot via migrate.js
5. Verify with `scripts/final-verification.js`

---

## 12. Security Recommendations

### Implemented

- ✅ bcrypt password hashing (no plaintext storage)
- ✅ Session-based auth with HTTP-only cookies
- ✅ Role-based access control middleware
- ✅ `SELECT *` never used for students (password column excluded)
- ✅ Path traversal protection on static file routes
- ✅ Upload MIME type validation
- ✅ CORS enforcement in production (fails fast if wildcard)
- ✅ Production safety checks on startup (session secret, CORS origin)
- ✅ File upload size limits (5 MB default)
- ✅ Rate limiting via session (basic)

### Recommended for Future

- **HTTPS enforcement**: The app trusts `X-Forwarded-Proto` but does not redirect HTTP→HTTPS on its own (Render handles this)
- **Rate limiting**: Add `express-rate-limit` for login/contact endpoints
- **CSRF protection**: Add `csrf` or `csurf` middleware for state-changing requests
- **Helmet.js**: Add security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- **Input sanitization**: Add HTML escaping for all user-generated content in EJS (currently uses `<%= %>` which auto-escapes)
- **Password policy**: Enforce minimum length, complexity, and change frequency
- **2FA**: Add two-factor authentication for admin accounts
- **Audit log**: Log all admin actions (create/update/delete) for accountability
- **API tokens**: Replace session auth with JWT for API-only access
- **npm audit**: Run `npm audit` regularly and update dependencies

---

## 13. Future Roadmap

### Short-term (Next 3 months)
- [ ] Email notifications for contact form submissions
- [ ] Coach-student group assignment UI
- [ ] Payment gateway integration (local bank transfer tracking)
- [ ] Export reports to PDF/Excel
- [ ] Bulk student import from spreadsheet
- [ ] SMS notifications (via WhatsApp Business API)

### Medium-term (3-6 months)
- [ ] Multi-language support (English alongside Arabic)
- [ ] Student performance tracking (belt progression, competition results)
- [ ] Parent portal (view attendance, subscriptions, progress)
- [ ] Class schedule management
- [ ] Automated billing reminders
- [ ] Mobile app (React Native or Flutter)

### Long-term (6-12 months)
- [ ] Financial dashboard (revenue, expenses, P&L)
- [ ] Inventory management (judogi, belts, equipment)
- [ ] Tournament management (registration, brackets, results)
- [ ] Integration with Saudi sports federation systems
- [ ] AI-powered attendance prediction and churn analysis

---

## 14. Known Limitations

### Current

1. **Render free tier cold starts**: First request after ~15 min of inactivity takes 20-30 seconds (server spins down)
2. **No email/push notifications**: Contact form submissions and alerts require manual refresh to check
3. **No payment gateway**: Subscription revenue tracking is manual (no Stripe/Moyasar integration)
4. **Arabic only**: UI is entirely in Arabic; no English toggle
5. **Coach-student groups**: Database schema exists (`coach_groups` table) but no UI for assignment
6. **No bulk operations**: Students, attendance, and subscriptions must be managed individually
7. **No export**: Reports are view-only on screen; no PDF/CSV download
8. **No password reset flow**: Admin passwords are managed server-side (reset on deploy via migrate.js)
9. **Gallery uploads limited to 5 MB**: Raisable via `MAX_FILE_SIZE` env var
10. **No concurrent editing protection**: Two admins editing the same student could overwrite each other

### Architectural

11. **Session storage in memory**: Sessions are stored in Express's default MemoryStore — lost on server restart. For production with multiple instances, use connect-pg-simple or Redis
12. **No automated testing in CI**: Verification scripts exist but are manual (`node scripts/final-verification.js`)
13. **No API versioning**: All routes are under `/api/` with no version prefix (`/api/v1/...`)
14. **No TypeScript**: The codebase uses plain JavaScript with JSDoc comments
15. **Single-server design**: Not designed for horizontal scaling without session store changes

---

## Admin Credentials (Pre-seeded)

| Role | Name | Email | Password |
|------|------|-------|----------|
| Admin | الكابتن معتوق | Matoq701@gmail.com | Ma123456 |
| Coach | كابتن معتوق | coach.moataq@riyadah.com | coach123 |
| Coach | كابتن مروان | coach.marwan@riyadah.com | coach123 |

**⚠️ Change the admin password before going to production.**
