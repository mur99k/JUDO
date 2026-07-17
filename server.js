const fs = require('fs');
const http = require('http');
const https = require('https');
const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const { getConnection, close } = require('./src/database/connection');
const { initDatabase } = require('./src/database/migrate');
const { syncMediaToDisk } = require('./src/database/sync-media');
const SubscriptionService = require('./src/services/subscription.service');

logger.info('Starting', config.app.name, '| env:', config.isProduction ? 'production' : 'development');

(async () => {
  await initDatabase();
  syncMediaToDisk();

  // Auto-expire overdue subscriptions on startup and every hour.
  await SubscriptionService.syncExpired();
  setInterval(() => {
    SubscriptionService.syncExpired().catch(e => logger.warn('syncExpired failed:', e.message));
  }, 60 * 60 * 1000);
})();

function startServer() {
  // Optional: terminate TLS directly from Node (no reverse proxy).
  if (config.https.direct && config.https.keyPath && config.https.certPath) {
    const opts = {
      key: fs.readFileSync(config.https.keyPath),
      cert: fs.readFileSync(config.https.certPath)
    };
    return https.createServer(opts, app).listen(config.port, () => {
      logger.info('HTTPS server listening on port', config.port);
    });
  }
  return http.createServer(app).listen(config.port, '0.0.0.0', () => {
    logger.info('HTTP server listening on port', config.port, '(behind proxy:', config.https.behindProxy, ')');
  });
}

const server = startServer();

// ─── Graceful shutdown ─────────────────────────────
let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info('Received', signal, '- shutting down gracefully...');
  clearInterval(syncTimer);
  server.close(() => {
    Promise.resolve(close()).catch(e => logger.error('DB close error:', e.message));
    logger.info('Server stopped.');
    process.exit(0);
  });
  // Force-exit if connections hang.
  setTimeout(() => { logger.warn('Forcing exit after timeout.'); process.exit(1); }, 10000);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
