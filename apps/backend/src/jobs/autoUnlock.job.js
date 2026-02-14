import transactionService from '../services/transaction.service.js';

// ============================================================
// TABLE AUTO-UNLOCK BACKGROUND JOB
//
// Runs every 60 seconds. Cleans up stale table locks caused by:
//   - Pending payments older than 15 minutes
//   - Expired payments
//   - Failed/cancelled payments
//   - DB inconsistency (occupied but no active transaction)
//
// Safe for:
//   - Cron overlap: uses FOR UPDATE SKIP LOCKED
//   - Server restart: function is re-invoked on boot
//   - Multiple instances: SKIP LOCKED prevents contention
// ============================================================

const INTERVAL_MS = 60 * 1000; // 1 minute
let intervalId = null;
let isRunning = false;

/**
 * Execute one cycle of the auto-unlock job.
 * Prevents overlapping executions via `isRunning` flag.
 */
const runAutoUnlock = async () => {
  // Guard against overlapping cron runs
  if (isRunning) {
    console.log('[AutoUnlock] Previous run still in progress, skipping...');
    return;
  }

  isRunning = true;

  try {
    const result = await transactionService.autoUnlockStaleTables();

    if (result.unlockedCount > 0) {
      console.log(`[AutoUnlock] ✅ Released ${result.unlockedCount} stale table(s)`);
    }
  } catch (error) {
    // Log but don't crash — the interval will retry next cycle
    console.error('[AutoUnlock] ❌ Error during auto-unlock:', error.message);
  } finally {
    isRunning = false;
  }
};

/**
 * Start the background job.
 * 
 * Idempotent: calling start() multiple times won't create duplicate intervals.
 */
export const startAutoUnlockJob = () => {
  if (intervalId) {
    console.log('[AutoUnlock] Job already running');
    return;
  }

  console.log('[AutoUnlock] 🚀 Starting auto-unlock background job (interval: 60s)');

  // Run immediately on startup to clean up any stale locks from server restart
  runAutoUnlock();

  // Then run every minute
  intervalId = setInterval(runAutoUnlock, INTERVAL_MS);
};

/**
 * Stop the background job (for graceful shutdown).
 */
export const stopAutoUnlockJob = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[AutoUnlock] 🛑 Background job stopped');
  }
};

export default {
  startAutoUnlockJob,
  stopAutoUnlockJob,
};
