# Changelog — نادي الريادة للجودو (Al-Riyadah Judo Club)

All notable changes to this project are documented below.

---

## [1.0.0-beta] — 2026-07-18

### Release Baseline — Production Beta

#### Added
- `PROJECT_HANDOFF.md`: comprehensive handoff document with architecture, deployment, and operations guide
- `README.md`: complete setup guide for new developers
- `.eslintrc.json`: basic linting configuration
- `scripts/acceptance-test.js`: full 112-check end-to-end acceptance test suite
- `scripts/cleanup-prod.js`: production data cleanup utility
- `scripts/lifecycle-test.js`: student lifecycle test (56 checks)

#### Fixed
- **PostgreSQL column casing**: Added `studentname`, `remainingdays`, `coachname` to `PG_CAMEL_MAP` — subscription and coach data now returns correct camelCase field names
- **COUNT(*) / SUM() string coercion**: All aggregate results from PostgreSQL (`COUNT(*)`, `SUM()`, `COALESCE`) now wrapped in `Number()` across attendance, student, and subscription repositories — fixes strict equality checks and arithmetic
- **Coach ordering**: Changed `ORDER BY createdAt DESC` to `ASC` in user repo — كابتن معتوق now appears before كابتن مروان
- **Mobile coach layout**: Changed `.coaches-row` grid from `repeat(2, 1fr)` to `1fr` on mobile — coaches stack vertically instead of side by side
- Removed unused `crypto` import from config/index.js
- Removed unused `AppError` import from auth.controller.js
- Removed unused `paginated` and `NotFoundError` imports from student.controller.js
- Removed duplicate inline `UserRepo` require from page.controller.js coach handler

#### Changed
- Cleaned up dead code: removed unused `countAll()` from student.repo.js, `findAll()` from contact.repo.js, `paginated()` from response.js, and 4 unused date utility functions
- Deleted unused migration SQL files (`001_initial.sql`, `002_add_password_plain.sql`, `003_add_coach_groups.sql`)
- Deleted debug/test scripts (`generate-test-data.js`, `reset-demo-data.js`, `seed-media.js`)
- Updated `package.json` version to `1.0.0-beta`
- Updated `RELEASE_NOTES.md` for v1.0.0-beta

#### Security
- All user-generated content auto-escaped via EJS `<%= %>` syntax
- Removed dead code paths that could be exploited
- Added ESLint config for static analysis

---

## [1.0.0-alpha] — 2026-07-17/18

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
- Missing `await` on ALL async service/repo calls across 6 controllers + 3 services + page controller
- Gallery list returned Promise instead of array
- `storage.list` export was missing from module.exports
- PostgreSQL column name mismatch: added `PG_CAMEL_MAP` for fullName, nationalId, etc.

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
