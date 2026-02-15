import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import notificationService from '../services/notification.service.js';

const router = express.Router();

/**
 * GET /api/notifications/stream
 * Server-Sent Events endpoint for real-time admin notifications
 * Requires admin authentication
 */
router.get(
  '/stream',
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:5173',
      'Access-Control-Allow-Credentials': 'true',
    });

    // Send initial connection confirmation
    res.write(
      `event: connected\ndata: ${JSON.stringify({ message: 'Connected to notification stream' })}\n\n`
    );

    // Keep-alive: send a comment every 30 seconds to prevent timeout
    const keepAlive = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 30000);

    // Register this client
    notificationService.addClient(res);

    // Cleanup on disconnect
    req.on('close', () => {
      clearInterval(keepAlive);
    });
  }
);

export default router;
