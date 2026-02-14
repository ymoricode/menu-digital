import app from './app.js';
import { startAutoUnlockJob, stopAutoUnlockJob } from './jobs/autoUnlock.job.js';
import 'dotenv/config';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🍔 Menu Digital API Server                      ║
║                                                   ║
║   Server running on port ${PORT}                     ║
║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
║                                                   ║
║   API: http://localhost:${PORT}/api                  ║
║   Health: http://localhost:${PORT}/api/health        ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);

  // Start background jobs
  startAutoUnlockJob();
});

// ============================================================
// Graceful shutdown — stop background jobs + close server
// ============================================================
const gracefulShutdown = (signal) => {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  stopAutoUnlockJob();
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
