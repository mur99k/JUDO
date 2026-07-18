# Release Notes — Version 1.0 Beta

**نادي الريادة للجودو (Al-Riyadah Judo Club Management System)**

**Release Date:** July 18, 2026  
**Version:** 2.0.0 (designated 1.0 Beta)  
**Live URL:** https://kilocode.onrender.com  
**Status:** ✅ Production-ready — 105/105 verification checks passed (100%)

---

## Overview

Al-Riyadah Judo Club Management System is a full-featured web application for managing a Saudi judo club. It provides a public-facing website with club information, registration, and contact capabilities, plus a comprehensive admin dashboard for managing students, coaches, attendance, subscriptions, gallery, and reports.

Built for production deployment on Render (free tier) with Neon PostgreSQL for data persistence and Cloudflare R2 for media storage.

---

## Features

### Public Website
- **Home page** with hero section, services, achievements gallery, and coach profiles
- **About page** with club vision, mission, goals, and photo gallery
- **Contact page** with WhatsApp, Call, Location cards, and contact form
- **Student registration** (self-service, national ID-based)
- **Login** for admin, coaches, and students
- **Fully responsive** Arabic (RTL) design with custom CSS design system

### Admin Dashboard
- **Overview** with key metrics (students, coaches, subscriptions, attendance)
- **Student Management** — CRUD with search, pagination, status tracking
- **Coach Management** — CRUD with profile photos
- **Attendance Tracking** — daily check-in, monthly grid view, per-student reports
- **Subscription Management** — create, renew, expire with automated status sync
- **Reports** — dashboard stats, student statistics, subscription revenue
- **Gallery** — upload, view, and delete championship photos
- **Settings** — key-value configuration store
- **System Health** — database, storage, and application status monitoring

### Coach Dashboard
- Student list view
- Attendance management (mark present/absent)
- Student reports

### Student Portal
- Profile view
- Attendance records
- Subscription status

---

## Technical Highlights

- **Stack:** Node.js, Express.js, EJS, PostgreSQL/SQLite
- **Architecture:** Repository pattern with unified database adapter
- **Storage:** Dual-mode (Cloudflare R2 for production, local filesystem for dev)
- **Auth:** Session-based with role-based access control (admin/coach/student)
- **Deployment:** Render Blueprint with auto-deploy from GitHub
- **Verification:** Automated 105-check production test suite
- **Security:** bcrypt passwords, path traversal protection, MIME validation, CORS enforcement

---

## Changelog Summary

- 26 commits across 2 days of active development
- 12+ database schema revisions
- Full migration from SQLite → PostgreSQL
- Storage migration from local filesystem → Cloudflare R2
- Complete production hardening and security audit
- 105 automated checks all passing

See `CHANGELOG.md` for the complete commit history.

---

## Quick Start

```bash
# Clone
git clone https://github.com/mur99k/JUDO.git
cd JUDO

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env for your setup

# Run locally (SQLite)
npm start

# Open browser
open http://localhost:3000
```

---

## Admin Access

| Role | Email | Password |
|------|-------|----------|
| Admin | Matoq701@gmail.com | Ma123456 |
| Coach | coach.moataq@riyadah.com | coach123 |
| Coach | coach.marwan@riyadah.com | coach123 |

**⚠️ Change the admin password immediately after first login.**

---

## Known Issues

- Render free tier cold starts: first request after inactivity takes 20-30 seconds
- No email notifications for contact form submissions
- No payment gateway integration
- Arabic language only
- Coach-student group management has no UI (schema exists)

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
