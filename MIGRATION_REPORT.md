# Migration Report — Judo Club → Render Free (PostgreSQL + Cloudflare R2)

**Date:** 2026-07-17
**Goal:** Make the Al-Riyadah Judo Club web app deployable on **Render Free** so a
public beta persists data across server restarts, replacing the two things the
free tier does not support:

1. **SQLite** (no persistent disk) → **Render Free PostgreSQL**
2. **Local-disk media** (ephemeral FS) → **Cloudflare R2** (S3-compatible, free 10 GB, no egress fees)

---

## What changed

### 1. Database layer — one SQL, two dialects
- New unified adapter `src/database/connection.js` exposing a single async
  `db.query(sql, params)`:
  - **prod (`DB_TYPE=postgres`)** → `pg` `Pool` against `DATABASE_URL`.
  - **dev (`DB_TYPE=sqlite`)** → `better-sqlite3` with an on-the-fly translator
    that rewrites Postgres idioms to SQLite: `$N`→`?`, `RETURNING id`,
    `ON CONFLICT … DO UPDATE`→`INSERT OR REPLACE`, `SERIAL`→`INTEGER`,
    `NOW()`/`CURRENT_DATE`→`date('now')`, `TO_CHAR`/`EXTRACT`→`strftime`.
    Date math (`julianday`) is computed in JS where needed.
- Authored **one Postgres-native SQL** (`schema-postgres.sql`) and a mirror
  (`schema-sqlite.sql`). `src/database/migrate.js` applies the correct flavor
  idempotently and seeds the admin (`admin@riyadah.com`) + settings.
- All repositories (`student`, `user`, `contact`, `settings`, `attendance`,
  `subscription`) and services/controllers were converted to **async** and now
  await every DB call. `subscription` computes `remainingDays` in JS;
  `getMonthlyRevenue` uses `TO_CHAR`/`EXTRACT` (portable via adapter).

### 2. Storage layer — one adapter, two backends
- New `src/storage/index.js` with a uniform surface:
  `upload(key, buffer, mime)`, `remove(key)`, `list(prefix)`, `publicUrl(key)`,
  `normalizeDbValue(value)`, `keyFromUrl(value)`, `isRemote()`.
  - **prod (`STORAGE_TYPE=r2`)** → `@aws-sdk/client-s3` against the R2 bucket.
  - **dev (`STORAGE_TYPE=local`)** → `./uploads` served by the existing `/uploads` route.
- Student/coach/admin photos and **gallery uploads** now flow through the
  storage adapter (temp file → `storage.upload` → store normalized URL →
  delete temp; deletes call `storage.remove`). Gallery `list()` merges
  repo-seeded photos with cloud-stored uploads.
- `page.controller.js` rewritten to use `UserRepo`/`SettingsRepo` + storage
  normalization (no direct `better-sqlite3`). `sync-media.js` backfills the two
  real coach photos to R2 by name match.

### 3. Config & deploy
- `src/config/index.js`: `dbType`/`storage.type` default by environment
  (`postgres`/`r2` in prod, `sqlite`/`local` in dev). Production safety guards
  fail-fast on a weak `SESSION_SECRET` or wildcard `CORS_ORIGIN`.
- `render.yaml`: free **web service** + free **PostgreSQL** database
  (`kilocode-db`), with `DB_TYPE=postgres`, `STORAGE_TYPE=r2`, and `R2_*`
  env vars (`sync:false`). No persistent disk needed.
- `.env.example` documents `DATABASE_URL`, `DB_TYPE`, `STORAGE_TYPE`, `R2_*`.
- `package.json`: added `pg` and `@aws-sdk/client-s3`; kept `better-sqlite3`
  for dev. `build` script awaits `initDatabase()`.

---

## Verification performed

| Check | Method | Result |
|-------|--------|--------|
| Dev endpoint suite (login, perms, CRUD, attendance, subscription, reports, gallery upload+delete, no password leak) | boot + curl | **17/17** |
| Production-shaped smoke test (`scripts/smoke-test.js`, sqlite+local) | `node scripts/smoke-test.js` | **18/18** |
| Postgres schema + repo SQL (including `getMonthlyRevenue` `TO_CHAR`/`EXTRACT`, `expireOverdue` filter, attendance `ON CONFLICT` upsert) | `pg-mem` real Postgres engine | **OK** |
| `initDatabase()` on fresh SQLite | `node -e …initDatabase()` | **MIGRATE OK** |

> The Postgres path was validated against a real Postgres grammar (pg-mem);
> it cannot be executed live here because there is no Postgres/Docker/R2 in
> this environment. It will run against Render's free Postgres on deploy.

### Bug fixed during verification
`gallery.controller.js` `upload` bypassed the storage-aware service and returned
a local `/gallery-img/` path — so uploads would not have persisted on Render.
It now delegates to `GalleryService.upload` (storage adapter). Smoke test now
asserts removal from the active backend.

---

## What persists after a restart (Render Free)

- **Users, students, attendance, subscriptions, settings, contact messages,
  coach groups** — in managed PostgreSQL. ✅
- **All uploaded media** (gallery, student/coach/admin photos) — in Cloudflare
  R2. ✅
- **Repo-seeded gallery photos & coach photos** present in the git checkout
  (ephemeral FS) are re-uploaded to R2 by `sync-media.js` on first boot. ✅

## Known Free-tier limits / watch-items
- Render Free PostgreSQL **spins down after 90 days of inactivity**; the web
  service also sleeps after 15 min idle (cold start ~30–60 s).
- Free Postgres has a **1 GB** row limit — fine for this club's scale.
- R2 free tier: **10 GB storage, 1 M Class A / 10 M Class B ops/mo**.
- No custom domain email; use the R2 public bucket URL for media.
- `DATABASE_URL` is auto-injected by Render; do **not** hardcode it.

---

## Deployment checklist (Render)

1. **Cloudflare R2**
   - Create a bucket (e.g. `kilocode-media`); enable **public access** (or a
     public.dev.dev R2.dev URL) so images are served without signed URLs.
   - Generate **API token** (Access Key ID + Secret) with Object Read/Write.
   - Note the **S3-compatible endpoint** (`https://<id>.r2.cloudflarestorage.com`)
     and the **public URL** (`https://pub-<id>.r2.dev` or your custom domain).
2. **Push code** to GitHub (this branch).
3. **New → Blueprint** on Render, connect the repo (uses `render.yaml`).
4. **Environment** (auto from `render.yaml`): set `R2_ENDPOINT`, `R2_REGION`
   (`auto`), `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
   `R2_PUBLIC_URL`, `CORS_ORIGIN` (your real origin, **not** `*`),
   and a strong `SESSION_SECRET` (32+ random chars).
   `DATABASE_URL` and `DB_TYPE=postgres` are wired by the Blueprint.
5. **Deploy** — the build step runs `initDatabase()` (creates tables, seeds admin
   + settings). First boot runs `sync-media.js` to backfill seed photos to R2.
6. **Verify:** `GET /api/health` returns `200`; log in as
   `admin@riyadah.com` / `admin123`; upload a gallery photo and confirm it
   survives a manual restart (Redeploy).
7. **Optional:** change the admin password immediately after first login.
