# FINAL HANDOFF — نادي الريادة للجودو (Al-Riyadah Judo Club)

**Version:** 2.0.0
**Release:** 1.0 Beta
**Date:** July 18, 2026
**Live URL:** https://kilocode.onrender.com
**Repository:** https://github.com/mur99k/JUDO

---

## 1. Complete Project Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │  EJS SSR │  │ Dash JS  │  │   Static Assets      │   │
│  │ (Pages)  │  │ (SPA-ish)│  │ (CSS/JS/Images)      │   │
│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘   │
│       │              │                   │               │
└───────┼──────────────┼───────────────────┼───────────────┘
        │              │                   │
        ▼              ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│              Express.js Web Server (Render)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ Routes   │→ │Controller│→ │     Services         │   │
│  │ (REST)   │  │ (Logic)  │  │   (Business Logic)   │   │
│  └──────────┘  └──────────┘  └──────────┬───────────┘   │
│                                          │               │
│  ┌───────────────────────────────────────▼───────────┐   │
│  │              Repositories (Data Access)            │   │
│  │  ┌─────────────────────────────────────────────┐  │   │
│  │  │       Connection Adapter (pg / sqlite)       │  │   │
│  │  └──────────────────┬──────────────────────────┘  │   │
│  └─────────────────────┼─────────────────────────────┘   │
│                        │                                 │
└────────────────────────┼─────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌────────────┐ ┌────────────┐ ┌────────────┐
   │  Neon      │ │ Cloudflare │ │ Local FS   │
   │ PostgreSQL │ │ R2 (media) │ │ (dev/seed) │
   └────────────┘ └────────────┘ └────────────┘
```

### Architecture Overview

- **Full-stack Node.js** application using Express.js
- **Server-side rendering** with EJS templates for public pages
- **Client-side JavaScript** modules for dashboard interactivity
- **RESTful API** consumed by dashboard frontend
- **Repository pattern** for database access (all queries isolated in repo files)
- **Unified database adapter** supporting PostgreSQL (production) and SQLite (development)
- **Unified storage adapter** supporting Cloudflare R2 (production) and local filesystem (development)
- **Session-based authentication** with role-based access control

---

## 2. Folder Structure

```
kilocode/
├── server.js                        # Entry point — starts Express + DB init
├── package.json                     # Dependencies & scripts
├── render.yaml                      # Render Blueprint deployment config
├── .env                             # Local environment variables (gitignored)
├── .env.example                     # Documented template for env vars
│
├── src/
│   ├── app.js                       # Express app setup (middleware, static files, routes)
│   ├── config/
│   │   └── index.js                 # Centralized configuration from env vars
│   ├── controllers/                 # Request handlers (9 files)
│   │   ├── attendance.controller.js
│   │   ├── auth.controller.js
│   │   ├── coach.controller.js
│   │   ├── gallery.controller.js
│   │   ├── page.controller.js       # SSR page rendering
│   │   ├── report.controller.js
│   │   ├── settings.controller.js
│   │   ├── student.controller.js
│   │   └── subscription.controller.js
│   ├── database/
│   │   ├── connection.js            # pg/SQLite unified adapter
│   │   ├── migrate.js               # Schema apply + data seeding
│   │   ├── schema-postgres.sql      # PostgreSQL DDL
│   │   ├── schema-sqlite.sql        # SQLite DDL
│   │   └── sync-media.js            # Seed photo sync to disk/cloud
│   ├── middleware/
│   │   ├── auth.js                  # requireAuth, requireAdmin, injectUser
│   │   ├── error.js                 # Centralized error handler
│   │   └── upload.js                # (unused — multer config in routes)
│   ├── repositories/                # Data access layer (6 files)
│   │   ├── attendance.repo.js
│   │   ├── contact.repo.js
│   │   ├── settings.repo.js
│   │   ├── student.repo.js
│   │   ├── subscription.repo.js
│   │   └── user.repo.js
│   ├── routes/                      # Express routers (9 files)
│   │   ├── index.js                 # Route aggregator
│   │   ├── attendance.routes.js
│   │   ├── auth.routes.js
│   │   ├── coach.routes.js
│   │   ├── gallery.routes.js
│   │   ├── page.routes.js
│   │   ├── report.routes.js
│   │   ├── settings.routes.js
│   │   ├── student.routes.js
│   │   └── subscription.routes.js
│   ├── services/                    # Business logic (9 files)
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
│   │   └── index.js                 # R2/local storage adapter
│   ├── utils/
│   │   ├── date.js                  # Date helpers (today, format)
│   │   ├── errors.js                # AppError classes
│   │   ├── logger.js                # File + console logger
│   │   └── response.js              # success/error/paginated JSON helpers
│   └── views/                       # EJS templates
│       ├── components/              # Reusable partials (6 files)
│       ├── layouts/                 # Page layouts (2 files)
│       │   ├── dashboard.ejs
│       │   └── public.ejs
│       └── pages/                   # Page templates (19 files)
│           ├── index.ejs, about.ejs, contact.ejs, login.ejs, etc.
│           └── dashboard/           # 11 dashboard sub-pages
│
├── client/                          # Frontend assets
│   ├── styles/                      # CSS (tokens, base, components, pages, utilities)
│   ├── scripts/                     # JavaScript modules
│   │   ├── modules/                 # Shared modules (api.js, modal.js, toast.js)
│   │   └── pages/                   # Page-specific scripts + dashboard/ subdir
│   └── assets/                      # Icons and images
│
├── scripts/                         # Utility scripts
│   ├── backup-db.js
│   ├── final-verification.js        # 105-check production verification
│   ├── prod-smoke.js
│   └── smoke-test.js
│
├── deploy/                          # Self-hosted deployment configs
│   ├── deplot.sh
│   ├── kilocode.service             # systemd service unit
│   └── nginx-site.conf              # nginx reverse proxy
│
├── بطولات وجوائز/                   # Gallery media (14 images)
├── صور المدربين/                    # Coach photos (2)
├── صور الخلفية في الصفحة الرئيسية/   # Home page backgrounds (7)
├── صور عن النادي/                   # About page photos (3)
├── logo/                            # App logo
├── uploads/                         # Dev uploads (admins/, coaches/, students/)
├── backups/                         # Local SQLite backups
├── data/                            # Local SQLite database
└── logs/                            # Application logs
```

---

## 3. Database Schema (PostgreSQL / SQLite)

### Entity-Relationship Diagram

```
users ──1:M── coach_groups ──M:1── students
                                    │
                          1:M      │
                          ├────────┘
                          │
                          ▼
                    attendance
                          │
                    subscriptions
                    
contact_messages (standalone)
settings (key-value store)
```

### Table: `users`
| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | SERIAL/INTEGER | PK | Auto-increment ID |
| fullName | TEXT | NOT NULL | Display name |
| email | TEXT | UNIQUE | Login email for admins/coaches |
| phone | TEXT | | Contact number |
| password | TEXT | NOT NULL | bcrypt hash |
| profileImage | TEXT | | Photo URL (R2 or local) |
| role | TEXT | NOT NULL, DEFAULT 'admin', CHECK(admin,coach) | 'admin' or 'coach' |
| createdAt | TIMESTAMP | DEFAULT NOW | Creation timestamp |

### Table: `students`
| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | SERIAL/INTEGER | PK | Auto-increment ID |
| fullName | TEXT | NOT NULL | Student name |
| nationalId | TEXT | UNIQUE | Saudi national ID |
| age | INTEGER | | Age in years |
| phone | TEXT | | Student phone |
| parentPhone | TEXT | | Parent/guardian phone |
| photo | TEXT | | Photo URL |
| password | TEXT | | (legacy column, unused) |
| category | TEXT | | Training category |
| status | TEXT | DEFAULT 'نشط', CHECK() | نشط/منتهي/موقوف/بانتظار الدفع/ملغي |
| createdAt | TIMESTAMP | DEFAULT NOW | |
| updatedAt | TIMESTAMP | DEFAULT NOW | |

### Table: `attendance`
| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | SERIAL/INTEGER | PK | |
| studentId | INTEGER | FK → students(id) ON DELETE CASCADE | |
| date | TEXT | NOT NULL | YYYY-MM-DD |
| status | TEXT | NOT NULL, CHECK() | حاضر/غائب/معذر |
| notes | TEXT | | Optional note |
| createdAt | TIMESTAMP | DEFAULT NOW | |
| **UNIQUE(studentId, date)** | | | One record per student per day |

### Table: `subscriptions`
| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | SERIAL/INTEGER | PK | |
| studentId | INTEGER | FK → students(id) ON DELETE CASCADE | |
| type | TEXT | NOT NULL | Subscription type (e.g. شهري, سنوي) |
| days | INTEGER | DEFAULT 30 | Duration in days |
| amount | REAL | NOT NULL | Price in SAR |
| startDate | TEXT | NOT NULL | YYYY-MM-DD |
| endDate | TEXT | NOT NULL | YYYY-MM-DD |
| status | TEXT | DEFAULT 'نشط', CHECK() | نشط/منتهي/موقوف/بانتظار الدفع/ملغي |
| paymentMethod | TEXT | | Cash, bank transfer, etc. |
| notes | TEXT | | |
| createdAt | TIMESTAMP | DEFAULT NOW | |

### Table: `settings`
| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| key | TEXT | PK | Setting name |
| value | TEXT | NOT NULL | Setting value |

Predefined keys: `adminName`, `adminPhone`, `clubWhatsapp`, `coachBio_{id}`, `aiProvider`, `aiApiKey`

### Table: `contact_messages`
| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | SERIAL/INTEGER | PK | |
| name | TEXT | NOT NULL | Sender name |
| phone | TEXT | | Sender phone |
| message | TEXT | | Message content |
| createdAt | TIMESTAMP | DEFAULT NOW | |

### Table: `coach_groups`
| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | SERIAL/INTEGER | PK | |
| coachId | INTEGER | FK → users(id) ON DELETE CASCADE | |
| studentId | INTEGER | FK → students(id) ON DELETE CASCADE | |

---

## 4. Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3000 | HTTP server port |
| `NODE_ENV` | Yes | development | `production` or `development` |
| `SESSION_SECRET` | **Yes (prod)** | — | ≥16 chars, random string. Render auto-generates. |
| `CORS_ORIGIN` | **Yes (prod)** | * | Allowed CORS origins, comma-separated. **Must not be `*` in production** |
| `HTTPS` | No | true | Enable behind-proxy HTTPS mode |
| `HTTPS_DIRECT` | No | false | Serve HTTPS directly with TLS certs |
| `TLS_KEY_PATH` | No | — | Path to TLS private key (direct HTTPS) |
| `TLS_CERT_PATH` | No | — | Path to TLS certificate (direct HTTPS) |
| `DB_TYPE` | No | auto | `postgres` or `sqlite`. Auto-detects `postgres` in production |
| `DB_PATH` | No | ./data/club.db | SQLite database file path |
| `DATABASE_URL` | **Yes (prod)** | — | PostgreSQL connection string (Neon) |
| `STORAGE_TYPE` | No | auto | `r2` or `local`. Auto-detects `r2` in production |
| `UPLOAD_PATH` | No | ./uploads | Local upload directory |
| `MAX_FILE_SIZE` | No | 5242880 | Max upload file size (bytes, default 5MB) |
| `R2_ENDPOINT` | **Yes (R2)** | — | Cloudflare R2 endpoint URL |
| `R2_REGION` | No | auto | S3 region |
| `R2_BUCKET` | **Yes (R2)** | — | R2 bucket name |
| `R2_ACCESS_KEY_ID` | **Yes (R2)** | — | R2 access key |
| `R2_SECRET_ACCESS_KEY` | **Yes (R2)** | — | R2 secret key |
| `R2_PUBLIC_URL` | **Yes (R2)** | — | Public base URL for R2 bucket |
| `GALLERY_DIR` | No | ./بطولات وجوائز | Gallery photos directory |
| `COACH_DIR` | No | ./صور المدربين | Coach photos directory |
| `BACKGROUNDS_DIR` | No | ./صور الخلفية في الصفحة الرئيسية | Background images directory |
| `ABOUT_DIR` | No | ./صور عن النادي | About page photos directory |
| `LOG_LEVEL` | No | info | Logger level: error, warn, info, debug |
| `LOG_DIR` | No | ./logs | Log file directory |

---

## 5. Deployment Instructions

### Prerequisites
- Node.js ≥ 18 (Render uses Node 26)
- GitHub account
- Render account (free tier)
- Neon account (free tier — PostgreSQL)
- Cloudflare account (free tier — R2 object storage)

### Step-by-Step

#### A. Database Setup (Neon)
1. Sign up at https://neon.tech
2. Create a new project (free tier gives 500 MB, serverless)
3. From project dashboard, copy the **Pooled connection string** (`DATABASE_URL`)
4. Format: `postgresql://user:password@ep-xxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require`

#### B. Media Storage Setup (Cloudflare R2)
1. Sign up at https://cloudflare.com
2. Go to R2 → Create a bucket named `judo-media`
3. Set public access: Bucket Settings → Public URL → Allow access
4. Note the public URL: `https://pub-XXXX.r2.dev`
5. Go to R2 → API Tokens → Create API Token with **Admin Read & Write** permissions
6. Note the **Access Key ID** and **Secret Access Key**
7. Note the **Endpoint URL** (e.g. `https://XXXX.r2.cloudflarestorage.com`)

#### C. Render Deployment
1. Push this repository to GitHub
2. Log in to https://dashboard.render.com
3. Click **New** → **Blueprint**
4. Connect your GitHub repo
5. Render will read `render.yaml` and create a Web Service
6. Before deploy completes, set these **Environment Variables** (sync: false):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon pooled connection string |
| `R2_BUCKET` | `judo-media` |
| `R2_ENDPOINT` | Your R2 endpoint URL |
| `R2_ACCESS_KEY_ID` | Your R2 access key |
| `R2_SECRET_ACCESS_KEY` | Your R2 secret key |
| `R2_PUBLIC_URL` | Your R2 public URL (e.g. `https://pub-XXXX.r2.dev`) |
| `CORS_ORIGIN` | Your Render URL (e.g. `https://kilocode.onrender.com`) |
| `SESSION_SECRET` | (Render will auto-generate) |

> **Important:** `SESSION_SECRET` is auto-generated by setting `generateValue: true` in `render.yaml`. You can also set it manually. Must be ≥ 16 characters.

7. Click **Apply** and wait for deployment (~2-3 minutes)
8. Open the URL `https://your-app.onrender.com`

#### D. Post-Deploy Verification
```bash
# Run the verification suite
node scripts/final-verification.js
```
Expected: **105/105 passed (100%)**

---

## 6. Render Configuration

**Service type:** Web Service (Blueprint)
**Runtime:** Node
**Plan:** Free
**Region:** Oregon
**Branch:** main
**Build command:** `npm install`
**Start command:** `node server.js`
**Health check path:** `/api/health`

### Auto-generated env vars:
- `SESSION_SECRET` — random 64-char hex string
- `PORT` — Render assigns dynamically (not configurable on free tier)

### Important notes:
- **Ephemeral filesystem:** Any files written to disk (uploaded images, SQLite DB) are lost on restart. Only `بطولات وجوائز/`, `صور المدربين/`, `صور عن النادي/`, `صور الخلفية في الصفحة الرئيسية/` persist because they're in the git repo.
- **R2 dependency:** Media uploads must use R2 for persistence across restarts.
- **PostgreSQL dependency:** All data must be in PostgreSQL (Neon) for persistence.
- Auto-deploys on every push to `main` branch.

---

## 7. Neon Configuration

**Provider:** Neon (Serverless PostgreSQL)
**Plan:** Free (500 MB storage, shared compute)
**Connection:** Pooled connection string (recommended for serverless)

### Security:
- SSL required (`sslmode=require`)
- IP restriction not needed (password + SSL auth)
- Default database: `neondb`

### Schema:
Applied automatically on every boot by `migrate.js`. The `applySchema()` function:
1. Reads `schema-postgres.sql`
2. Strips comments and PL/pgSQL DO blocks
3. Splits on `;` and executes each statement

The schema uses `CREATE TABLE IF NOT EXISTS` so it's safe to run repeatedly.

---

## 8. Cloudflare R2 Configuration

**Bucket name:** `judo-media`
**Endpoint:** `https://XXXX.r2.cloudflarestorage.com`
**Public URL:** `https://pub-XXXX.r2.dev`
**Region:** `auto`

### Access:
- API Token with **Admin Read & Write** permissions
- Objects are publicly accessible via the public URL
- No egress fees (free tier includes 10 GB storage + unlimited egress)

### Storage structure:
```
gallery/{filename}         — Admin gallery uploads
students/{filename}        — Student profile photos
coaches/{filename}         — Coach profile photos
admins/{filename}          — Admin profile photos
```

### Fallback behavior:
If R2 upload fails, the gallery upload falls back to the local filesystem (served via `/gallery-img/` route). Photos stored locally are lost on Render restart.

---

## 9. Default Admin Account

| Field | Value |
|-------|-------|
| Email | `Matoq701@gmail.com` |
| Password | `Ma123456` |
| Role | `admin` |
| Name | الكابتن معتوق |

**⚠️ IMPORTANT:** Change the password immediately after first login.

The admin account is **upserted on every server boot** by `migrate.js`. The password hash is always reset to the default on restart. To permanently change the password, edit `migrate.js` or change it via the dashboard profile page (password changes via the UI persist in the database).

### Seeded Coach Accounts:

| Name | Email | Password | Role |
|------|-------|----------|------|
| كابتن معتوق | coach.moataq@riyadah.com | coach123 | coach |
| كابتن مروان | coach.marwan@riyadah.com | coach123 | coach |

---

## 10. User Roles and Permissions

| Endpoint / Feature | Guest | Student | Coach | Admin |
|-------------------|-------|---------|-------|-------|
| **Public pages** (/, /about, /contact, /login, /register) | ✅ | ✅ | ✅ | ✅ |
| **Student register** | ✅ | — | — | — |
| **Student login** (nationalId) | ✅ | — | — | — |
| **Admin login** (email+password) | ✅ | — | — | — |
| **Student dashboard** (/student) | — | ✅ | — | — |
| **Coach dashboard** (/coach) | — | — | ✅ | ✅ |
| **Admin dashboard** (/dashboard) | — | — | — | ✅ |
| **Students API** (GET) | — | — | ✅ | ✅ |
| **Students API** (POST/PUT/DELETE) | — | — | — | ✅ |
| **Coaches API** (all) | — | — | — | ✅ |
| **Attendance API** (all) | — | — | ✅ | ✅ |
| **Subscriptions API** (GET) | — | — | ✅ | ✅ |
| **Subscriptions API** (POST/PUT/DELETE) | — | — | — | ✅ |
| **Reports API** | — | — | — | ✅ |
| **Gallery API** (GET) | ✅ | ✅ | ✅ | ✅ |
| **Gallery API** (POST/DELETE) | — | — | — | ✅ |
| **Settings API** | — | — | — | ✅ |
| **System Health** | — | — | — | ✅ |
| **Profile update** | — | ✅ | ✅ | ✅ |

### Role Assignment:
- **admin:** Seeded via `migrate.js`. Can create more admins directly in the DB.
- **coach:** Created via admin dashboard (coaches section).
- **student:** Self-registers via the public registration page or added by admin.

---

## 11. API Endpoints

### Authentication
```
POST   /api/auth/login            Login (admin: email+password, student: nationalId)
POST   /api/auth/register         Student self-registration
POST   /api/auth/logout           Logout
GET    /api/auth/me              Current user info (requireAuth)
POST   /api/auth/contact          Submit contact form
PUT    /api/auth/profile          Update profile (requireAuth, multipart)
PUT    /api/auth/password         Change password (requireAuth)
```

### Students
```
GET    /api/students              List students (requireAdminOrCoach)
GET    /api/students/:id          Get student (requireAdminOrCoach)
POST   /api/students              Create student (requireAdmin)
PUT    /api/students/:id          Update student (requireAdminOrCoach, multipart)
DELETE /api/students/:id          Delete student (requireAdmin)
```

### Coaches
```
GET    /api/coaches               List coaches (requireAdmin)
GET    /api/coaches/:id           Get coach (requireAdmin)
POST   /api/coaches               Create coach (requireAdmin, multipart)
PUT    /api/coaches/:id           Update coach (requireAdmin, multipart)
DELETE /api/coaches/:id           Delete coach (requireAdmin)
```

### Attendance
```
GET    /api/attendance            Get by date (query: date) (requireAuth)
GET    /api/attendance/today      Get today's attendance (requireAuth)
GET    /api/attendance/monthly    Get monthly grid (query: month, year) (requireAuth)
GET    /api/attendance/summary    Get monthly summary (query: month, year) (requireAuth)
GET    /api/attendance/student/:studentId/report   Student report (query: startDate, endDate) (requireAuth)
GET    /api/attendance/student/:studentId/stats    Student all-time stats (requireAuth)
POST   /api/attendance            Save attendance records (body: { records: [...] }) (requireAuth)
```

### Subscriptions
```
GET    /api/subscriptions         List subscriptions (query: status, studentId) (requireAdmin)
GET    /api/subscriptions/:id     Get subscription (requireAdmin)
GET    /api/subscriptions/stats   Get stats (requireAdmin)
POST   /api/subscriptions         Create subscription (requireAdmin)
PUT    /api/subscriptions/:id     Update subscription (requireAdmin)
DELETE /api/subscriptions/:id     Delete subscription (requireAdmin)
```

### Reports
```
GET    /api/reports/dashboard     Dashboard stats (requireAdmin)
GET    /api/reports/students      Student statistics (requireAdmin)
GET    /api/reports/subscriptions Subscription statistics (requireAdmin)
```

### Gallery
```
GET    /api/gallery               List all gallery photos
POST   /api/gallery               Upload photo (requireAdmin, multipart)
DELETE /api/gallery/:name         Delete photo (requireAdmin)
```

### Settings
```
GET    /api/settings              Get all settings (requireAdmin)
PUT    /api/settings              Update settings (body: { key: value, ... }) (requireAdmin)
```

### System
```
GET    /api/health                Health check (public)
```

---

## 12. External Services

### 1. Neon PostgreSQL
- **Purpose:** Primary database (students, attendance, subscriptions, settings, users)
- **Plan:** Free (500 MB, serverless, shared compute)
- **Connection:** Pooled URL with `sslmode=require`
- **Failover:** Neon auto-failover on region outage. No action needed — re-deploy if connection drops.

### 2. Cloudflare R2
- **Purpose:** Media storage (gallery photos, profile images, backgrounds)
- **Plan:** Free (10 GB storage, unlimited egress)
- **Access:** S3-compatible API with access key + secret
- **Public URL:** All objects are publicly readable via the public bucket URL
- **Failover:** If R2 is unreachable, gallery uploads fall back to local filesystem (images lost on restart)

### 3. Render
- **Purpose:** Web server hosting, HTTPS termination, auto-deploy
- **Plan:** Free (sleeps after inactivity, wakes on request)
- **Region:** Oregon, USA
- **Limitations:** Ephemeral filesystem, 512 MB RAM, sleeps after 15 min inactivity

### 4. Google Fonts
- **Purpose:** IBM Plex Sans Arabic and Tajawal fonts
- **URL:** https://fonts.googleapis.com

### 5. Chart.js (CDN)
- **Purpose:** Dashboard charts on overview and reports pages
- **URL:** https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js

---

## 13. Backup and Restore Procedure

### Database Backup (Neon PostgreSQL)

**Automated Backups:**
Neon provides automatic daily backups with 7-day retention on the free plan.

**Manual Backup:**
```bash
# Export database to SQL file
pg_dump --no-owner --no-acl "$DATABASE_URL" > backup-$(date +%F).sql

# Restore from backup
psql "$DATABASE_URL" < backup-2026-07-18.sql
```

### Media Backup (Cloudflare R2)

**Manual Backup:**
```bash
# Install AWS CLI v2 configured with R2 credentials
aws s3 sync s3://judo-media ./r2-backup-$(date +%F) --endpoint-url https://XXXX.r2.cloudflarestorage.com

# Restore
aws s3 sync ./r2-backup-2026-07-18 s3://judo-media --endpoint-url https://XXXX.r2.cloudflarestorage.com
```

### Local SQLite Backup
```bash
# Run the backup script
node scripts/backup-db.js
# Creates backup in ./backups/ with timestamp filename
```

---

## 14. Recovery Procedure (Server Failure)

### Scenario A: Render service crashes or is deleted
1. Fork/clone the repository to a new GitHub repo
2. Create a new Render Blueprint pointing to the new repo
3. Set all environment variables (same values as before)
4. Deploy — the database schema and seed data apply automatically
5. The app will connect to the same Neon database (no data loss)
6. Media in R2 is still available (no data loss)

### Scenario B: Neon database is corrupted or deleted
1. Restore from the latest Neon backup (automatic daily backups)
2. If no backup: re-seed the database by deploying the app (migrate.js will re-create schema and seed data)
3. Student, attendance, subscription data would be lost without a backup

### Scenario C: R2 bucket is deleted
1. Re-create the bucket with the same name
2. Re-upload media files from local backup
3. Gallery photos checked into git (بطولات وجوائز/) will auto-restore on next deploy
4. Admin-uploaded gallery photos, coach photos, and student photos stored in R2 would be lost without a backup

### Scenario D: Entire system rebuild (post-apocalypse)
1. Create new Neon project → copy DATABASE_URL
2. Create new R2 bucket → copy credentials + public URL
3. Create new Render Blueprint → set all env vars
4. Deploy
5. If you have SQL backup: `psql "$DATABASE_URL" < backup.sql`
6. If you have R2 backup: `aws s3 sync ./r2-backup s3://judo-media --endpoint-url ...`

---

## 15. Security Recommendations

### Critical (implement immediately):
1. **Change default admin password** after first login via dashboard profile page
2. **Set a strong CORS origin** — must not be `*` in production (app will crash if `*`)
3. **Use a strong SESSION_SECRET** — minimum 32 random characters
4. **Enable HTTPS** — Render provides automatic HTTPS on `.onrender.com` domains

### Important:
5. **Regular password rotation** for admin and coach accounts
6. **Monitor Neon database** connection limits (free tier: 10 simultaneous connections)
7. **Set up R2 bucket lifecycle policies** to auto-delete old gallery uploads
8. **Review server logs** periodically (`logs/app.log`)
9. **Keep dependencies updated** via `npm audit` and `npm update`

### Architecture:
10. **Passwords are bcrypt-hashed** — no plain text storage
11. **Session-based auth** with HTTP-only, SameSite cookies
12. **Path traversal protection** on all static file routes (gallery-img, coach-img, about-img)
13. **Input validation** on all API endpoints
14. **File upload validation** by MIME type (only JPG, PNG, GIF, WebP allowed)
15. **Students API excludes password column** — explicit column list, never `SELECT *`

### Render Free Tier Limitations:
16. Service **sleeps after 15 minutes of inactivity** — first request after sleep takes ~30 seconds
17. **Ephemeral filesystem** — uploaded files not stored in R2 will be lost on restart
18. **512 MB RAM** — monitor usage; memory leaks could crash the service

---

## 16. Known Limitations

1. **Render free tier cold starts** — the first request after inactivity takes 20-30 seconds
2. **No email notifications** — contact form submissions are stored in DB but not emailed
3. **No SMS integration** — WhatsApp and call are manual (click-to-chat / click-to-call)
4. **No attendance QR code** — attendance is marked manually by admin
5. **No payment gateway** — subscriptions are tracked manually
6. **No multi-language support** — Arabic only
7. **Coach-student grouping** is implemented in the schema (`coach_groups`) but has no UI
8. **R2 fallback uploads are ephemeral** — if R2 fails, gallery uploads fall to disk (lost on restart)
9. **No email/password reset flow** — admin password is reset on every boot via migrate.js
10. **Neon free tier limits** — 500 MB storage, 10 concurrent connections
11. **No automated nightly backups** — backup must be triggered manually
12. **Dashboard uses Session-based auth** — no JWT support for mobile apps

---

## 17. Future Improvement Roadmap

### Short-term (Next Sprint)
- [ ] Email notification for contact form submissions
- [ ] Coach-student group management UI
- [ ] Student attendance QR code check-in
- [ ] Email/password reset flow
- [ ] Downloadable attendance reports (PDF/CSV)

### Medium-term (Next Quarter)
- [ ] Payment gateway integration (e.g., Stripe, Moyasar)
- [ ] Student portal with schedule and progress tracking
- [ ] Multi-language support (Arabic/English)
- [ ] Automated daily database backups to R2
- [ ] Dashboard activity log / audit trail

### Long-term (Next Year)
- [ ] Mobile app (React Native or Flutter)
- [ ] Competition management module
- [ ] Online class booking system
- [ ] Financial reporting with charts
- [ ] Integration with Saudi sports federation APIs
- [ ] AI-powered attendance prediction and insights

---

## 18. Version Number and Release Date

| Attribute | Value |
|-----------|-------|
| **Application version** | 2.0.0 |
| **Release designation** | 1.0 Beta |
| **Release date** | July 18, 2026 |
| **Node.js version** | ≥ 18 (tested on Node 26) |
| **Database** | PostgreSQL 16 (Neon) / SQLite 3 |
| **License** | Proprietary — All Rights Reserved |
