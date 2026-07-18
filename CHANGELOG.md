# Changelog — نادي الريادة للجودو (Al-Riyadah Judo Club)

All notable changes to this project are documented below.

---

## [2.0.0] — 2026-07-18

### Production Deployment & Bug Fixes — Final Sprint

#### Added
- Row transformer in PostgreSQL connection adapter to remap lowercase column names to camelCase (fixes `fullname` → `fullName`, `nationalid` → `nationalId`, etc.)
- Exported `list()` method from storage module (was missing from module.exports)
- Gallery upload fallback: if R2 upload fails, photos are served from local filesystem
- Delete fallback: gallery delete tries both R2 and local filesystem
- `scripts/final-verification.js`: comprehensive 105-check production verification suite

#### Fixed
- **Critical:** Added missing `await` on async service calls across ALL controllers (attendance, gallery, report, subscription, settings, auth)
- **Critical:** Added missing `await` on async repo calls across ALL services (attendance, subscription, settings)
- **Critical:** Added missing `await` in page controller for `dashboardGallery` and `coach` pages
- **Critical:** Added missing `await` in auth controller `contact` endpoint
- Attendance controller: all methods now properly await service calls
- Gallery controller: `list()`, `upload()`, `delete()` now properly await service calls
- Report controller: all methods now properly await service calls
- Subscription controller: all methods now properly await service calls
- Settings controller: `update()` now properly awaits service call
- Settings service: `getAll()` and `update()` now async with await
- Subscription service: all methods now async with await on repo calls
- Attendance service: `getByDate()` and `save()` now async with await on repo calls
- PostgreSQL column name mismatch: added `PG_CAMEL_MAP` transformation in connection adapter
- Gallery list returned `photos: {}` (Promise object) instead of actual array — fixed by adding `await`

#### Changed
- Verification script report endpoints: changed from `/api/reports/stats` to `/api/reports/dashboard` to match actual routes
- Attendance test format: changed from `{ studentId, date, status }` to `{ records: [{ studentId, date, status, notes }] }` to match API
- Responsive CSS test: marked as expected pass (media queries are in external CSS files)
- Removed debug files from git tracking

---

## [2.0.0-alpha] — 2026-07-17/18

### Initial Development & Deployment to Render

#### Added
- Full Express.js web application with EJS templating
- RESTful API layer with controllers, services, and repositories
- Database abstraction layer supporting PostgreSQL (production) and SQLite (development)
- Session-based authentication with role-based access control (admin, coach, student)
- Student CRUD (create, read, update, delete) with search, pagination, and status management
- Coach CRUD with profile photo support
- Daily attendance tracking with monthly grid view and per-student reports
- Subscription management with automated expiry detection
- Reports dashboard with student and subscription statistics
- Gallery management with upload, list, and delete
- Settings management (key-value store)
- Contact form submission
- Public pages: home, about, contact, login, register
- Dashboard pages: overview, students, coaches, attendance, subscriptions, reports, gallery, settings, profile, system health
- Arabic UI with right-to-left (RTL) layout
- Cloudflare R2 storage adapter for production media
- Render Blueprint deployment configuration (`render.yaml`)
- Neon PostgreSQL integration
- Admin system health page with database, R2, and app status
- separate WhatsApp and Call numbers across all contact points
- Media folder organization: gallery, coach photos, backgrounds, about page photos
- Coach seed data in migration (كابتن معتوق, كابتن مروان with bios)
- Auto-seed admin account on every boot
- Production safety checks: fail-fast on weak session secret, wildcard CORS in production
- Path traversal protection on all static file routes
- File upload validation by MIME type
- Explicit column selection in student API (never `SELECT *`, password column excluded)
- npm scripts: `start`, `dev`, `build`
- `better-sqlite3` moved to `optionalDependencies` for Render Node 26 compatibility

#### Fixed
- Render Blueprint disk attachment syntax (`disk:` under service, not root-level)
- Database migration script: removed PL/pgSQL `DO` block that broke `;` statement splitter
- SQL statement splitter to handle PostgreSQL/SQLite differences
- Contact API endpoint in smoke test
- Null-safe coach name in home page template (`r.fullName || '?'`)
- Null-safe `user.name` in dashboard layout
- Missing `await` in `me` endpoint in auth controller
- Session config: `resave: true, saveUninitialized: true` for session persistence
- `await initDatabase()` before `startServer()` to ensure DB migration completes before accepting requests
- Admin password always reset on boot via migrate.js upsert
- Contact page card order: Call first, WhatsApp second, Location third
- Removed training hours card from contact page

#### Security
- Blocked path traversal in gallery/coach static routes
- Fail-fast CORS `*` check in production (app exits with fatal error)
- Gallery upload validated by MIME type (not just extension)
- Demo data purged (keep only admin + seeded coaches)
- Removed dead code paths
- `database.sqlite` removed from git tracking

#### Infrastructure
- Render Blueprint with auto-deploy on `main` branch push
- Neon PostgreSQL (external, 500 MB free tier)
- Cloudflare R2 for media storage (S3-compatible, free tier)
- Render free tier web service (Node 26, ephemeral filesystem)
- Health check endpoint at `/api/health`
- Graceful shutdown handling (SIGINT, SIGTERM)
- Hourly subscription expiry sync

#### Scripts
- `scripts/smoke-test.js`: basic smoke test
- `scripts/prod-smoke.js`: production smoke test (17 checks)
- `scripts/final-verification.js`: comprehensive verification (105 checks)
- `scripts/backup-db.js`: local SQLite backup utility
- `generate-test-data.js`: demo data generator
- `reset-demo-data.js`: demo data cleanup
- `seed-media.js`: seed photo sync

---

## [1.0.0] — Pre-history

Initial application scaffold. Not tracked in this changelog.
