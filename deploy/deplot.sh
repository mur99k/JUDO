#!/usr/bin/env bash
# deploy.sh — one-shot production deploy onto a Linux server.
# Run as the deploy user from the project root (e.g. /opt/kilocode).
set -euo pipefail

echo "==> Installing dependencies (better-sqlite3 compiles here)..."
npm install --omit=dev

echo "==> Ensuring env is set (.env must exist with a STRONG SESSION_SECRET)..."
if [ ! -f .env ]; then
  echo "ERROR: .env missing. Copy .env.example → .env and fill SESSION_SECRET." >&2
  exit 1
fi

echo "==> Running DB migrations + seed (idempotent)..."
node -e "require('./src/database/migrate').initDatabase(); console.log('DB ready.');"

echo "==> Starting with pm2..."
pm2 restart kilocode || pm2 start server.js --name kilocode
pm2 save

echo "==> Deployment complete. Verify: pm2 logs kilocode, curl http://localhost:3000/api/health"
