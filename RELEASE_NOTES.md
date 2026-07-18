# Release Notes — Version 1.0.0-beta

**نادي الريادة للجودو (Al-Riyadah Judo Club Management System)**

**Release Date:** July 18, 2026  
**Version:** 1.0.0-beta  
**Live URL:** https://riyadah-judo.onrender.com  
**Status:** ✅ Production-ready beta — 112/112 acceptance tests passed (100%)

---

## Overview

Al-Riyadah Judo Club Management System is a full-featured web application for managing a Saudi judo club. It provides a public-facing website with club information, registration, and contact capabilities, plus a comprehensive admin dashboard for managing students, coaches, attendance, subscriptions, gallery, and reports.

Built for production deployment on Render (free tier) with Neon PostgreSQL for data persistence and Cloudflare R2 for media storage.

---

## Features

### Public Website
- **Home page** with hero slider, services cards, achievements gallery, and coach profiles
- **About page** with club vision, mission, goals, and photo gallery
- **Contact page** with WhatsApp, Call, Location cards, and contact form
- **Student registration** (self-service, national ID-based)
- **Login** for admin, coaches, and students
- **Fully responsive** Arabic (RTL) design with custom CSS design system
- **WhatsApp floating button** on every page

### Admin Dashboard
- **Overview** with key metrics (students, coaches, subscriptions, attendance)
- **Student Management** — CRUD with search, status/category filtering
- **Coach Management** — CRUD with profile photos
- **Attendance Tracking** — daily check-in, monthly grid view, per-student reports
- **Subscription Management** — create, edit, expire with automated status sync
- **Reports** — dashboard stats, student statistics, subscription revenue
- **Gallery** — upload, view, and delete championship photos
- **Settings** — key-value configuration store
- **System Health** — database, storage, and application status monitoring
- **Profile** — personal info and password management

### Coach Dashboard
- Student list and search
- Attendance management (mark present/absent/excused)
- Quick stats (total students, today's attendance, active subscriptions)

### Student Portal
- Profile view with personal details
- Attendance history and statistics
- Subscription status and remaining days

---

## Changes Since Alpha

### Bug Fixes
- PostgreSQL lowercase column mapping: added missing `studentname`, `remainingdays`, `coachname` to `PG_CAMEL_MAP`
- `COUNT(*)` and `SUM()` from PostgreSQL now properly coerced to `Number` type across all repositories
- Coach ordering fixed: كابتن معتوق now appears first (was reversed)
- Mobile coach layout: cards now stack vertically (were side by side)
- Removed all dead code (unused imports, functions, files)

### Cleanup
- Deleted unused migration SQL files
- Deleted debug/test data generators
- Removed all `console.log` debugging statements
- Added ESLint configuration for static analysis
- All unused `require()` imports removed

### Documentation
- `PROJECT_HANDOFF.md`: comprehensive architecture and operations guide
- `README.md`: complete developer setup guide
- Updated `CHANGELOG.md` with full history

---

## Technical Highlights

- **Stack:** Node.js, Express.js, EJS, PostgreSQL/SQLite
- **Architecture:** Repository pattern with unified database adapter
- **Storage:** Dual-mode (Cloudflare R2 for production, local filesystem for dev)
- **Auth:** Session-based with role-based access control (admin/coach/student)
- **Deployment:** Render Blueprint with auto-deploy from GitHub
- **Verification:** Automated acceptance test suite (112 checks)
- **Security:** bcrypt passwords, path traversal protection, MIME validation, CORS enforcement

---

## Quick Start

```bash
git clone https://github.com/mur99k/JUDO.git
cd JUDO
npm install
cp .env.example .env
npm start
```

See `README.md` for complete setup instructions.

---

## Admin Access

| Role | Name | Email | Password |
|------|------|-------|----------|
| Admin | الكابتن معتوق | Matoq701@gmail.com | Ma123456 |
| Coach | كابتن معتوق | coach.moataq@riyadah.com | coach123 |
| Coach | كابتن مروان | coach.marwan@riyadah.com | coach123 |

**⚠️ Change the admin password before going to production.**

---

## Known Limitations

- Render free tier cold starts: first request after inactivity takes 20-30 seconds
- No email notifications for contact form submissions
- No payment gateway integration
- Arabic language only
- Coach-student group management has no UI (schema exists)
- Sessions stored in memory (lost on restart — use Redis for multi-instance)
- No bulk operations (import/export students)

---

## Feedback & Support

Report issues at: https://github.com/mur99k/JUDO/issues  
Developed by: MUR99K

---

## Acknowledgments

- Render for free web hosting
- Neon for free PostgreSQL
- Cloudflare for free R2 object storage
- Google Fonts for Arabic typography (IBM Plex Sans Arabic, Tajawal)
