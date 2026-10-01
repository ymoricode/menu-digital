import { Router } from 'express';
import transactionController from '../controllers/transaction.controller.js';
import 'dotenv/config';

const router = Router();

// Midtrans Payment Notification webhook (no auth middleware — verified by signature)
router.post('/webhook', transactionController.paymentWebhook);
router.post('/notification', transactionController.paymentWebhook); // Alias for Midtrans naming

// Payment status check (lightweight, DB-only — used by frontend polling)
router.get('/status/:id', transactionController.checkPaymentStatus);

// ── Development-only: debug endpoint for Sandbox testing ──
// Returns Midtrans transaction details including QR Code URL
// NOT available in production
if (process.env.NODE_ENV !== 'production') {
  router.get('/debug/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;

      // Fetch from Midtrans API
      const MIDTRANS_API_BASE = process.env.MIDTRANS_IS_PRODUCTION === 'true'
        ? 'https://api.midtrans.com'
        : 'https://api.sandbox.midtrans.com';

      const authHeader = `Basic ${Buffer.from(process.env.MIDTRANS_SERVER_KEY + ':').toString('base64')}`;

      const response = await fetch(
        `${MIDTRANS_API_BASE}/v2/${encodeURIComponent(orderId)}/status`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: authHeader,
          },
        }
      );

      const result = await response.json();

      // Extract QR Code URL from actions
      const qrCodeAction = result.actions?.find(
        (a) => a.name === 'generate-qr-code' || a.name === 'generate-qr-code-v2'
      );

      // Return useful info without exposing server key
      res.json({
        success: true,
        warning: 'DEVELOPMENT ONLY — not available in production',
        orderId,
        transactionStatus: result.transaction_status,
        statusCode: result.status_code,
        qrCodeUrl: qrCodeAction?.url || null,
        qrString: result.qr_string || null,
        grossAmount: result.gross_amount,
        paymentType: result.payment_type,
        expiryTime: result.expiry_time || null,
        settlementTime: result.settlement_time || null,
        actions: result.actions || [],
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });
}

export default router;
