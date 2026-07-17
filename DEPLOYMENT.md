# Deployment — Beta

Minimal, reliable setup for running the club management app on a Linux server
behind a reverse proxy (nginx). Node serves HTTP on an internal port; nginx
terminates TLS and forwards to it.

## 1. Server prerequisites
- Node.js 18+ (native `better-sqlite3` — build on the target, not on Windows).
- nginx (or any TLS-terminating proxy).
- A process manager: `pm2` (recommended) or systemd.

## 2. Install
```bash
git clone <repo> && cd <repo>
npm install --omit=dev      # or: npm install  (better-sqlite3 compiles here)
cp .env.example .env
nano .env                   # fill real values
```

### Required `.env` for production
| Var | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | e.g. `3000` |
| `SESSION_SECRET` | long random: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CORS_ORIGIN` | `https://your-domain.com` |
| `HTTPS` | `true` (proxy terminates TLS) |
| `DB_PATH` | `./data/club.db` (default) |
| `UPLOAD_PATH` | `./uploads` (default) |

> On first boot `initDatabase()` runs migrations + seeds the admin
> (`admin@riyadah.com` / `admin123`) and the 5 settings keys.

## 3. Run with pm2
```bash
npm install -g pm2
pm2 start server.js --name kilocode
pm2 save
pm2 startup                  # auto-start on boot
```

Graceful shutdown is handled (SIGINT/SIGTERM → closes DB, stops timers).

## 4. nginx (TLS termination)
```nginx
server {
  listen 443 ssl;
  server_name your-domain.com;

  ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

  client_max_body_size 6m;   # > MAX_FILE_SIZE for uploads

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
The app trusts `X-Forwarded-*` (`app.set('trust proxy', 1)`) and sets
`Secure` cookies automatically because `HTTPS=true`.

## 5. Daily database backup
```bash
# crontab -e  →  daily 03:00
0 3 * * * cd /path/to/app && node scripts/backup-db.js >> logs/backup.log 2>&1
```
Backups land in `backups/` (timestamped, last 14 kept). The script checkpoints
WAL first so copies are consistent. **Also back up `uploads/`** (photos) with your
normal file backup.

To restore: stop the app, replace `data/club.db` (+ `-wal`/`-shm`) with a
backup, restart.

## 6. Health check
`GET /api/health` → `{ "status": "ok", ... }`. Use it in nginx/uptime
monitoring.

## 7. Logs
- `logs/app.log` — leveled, timestamped (level via `LOG_LEVEL`).
- `logs/backup.log` — backup runs.

## 8. Pre-launch verification
- [ ] App boots (`pm2 logs kilocode` clean, no FATAL).
- [ ] Admin login works (`admin@riyadah.com` / `admin123`).
- [ ] Student login works (by national ID).
- [ ] DB connection stable (check `logs/app.log`).
- [ ] Image upload works (gallery + student/admin photos).
- [ ] Attendance save/load works.
- [ ] Subscriptions create/expire correctly.
- [ ] Reports generate.
- [ ] Gallery shows on home + dashboard.
- [ ] Permissions: admin vs coach routes enforced.
- [ ] HTTPS redirects/serves (browser shows 🔒).
- [ ] `/api/health` returns `ok`.

> Beta goal: **stability over polish**. Ship it, collect real feedback, fix
> incrementally.
