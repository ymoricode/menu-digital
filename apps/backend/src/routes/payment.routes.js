import { Router } from 'express';
import transactionController from '../controllers/transaction.controller.js';

const router = Router();

// Xendit Payment Request API v3 webhook (no auth — verified by x-callback-token)
router.post('/webhook', transactionController.paymentWebhook);
router.post('/xendit/callback', transactionController.paymentWebhook); // Legacy alias

// Payment status check (lightweight, DB-only — used by frontend polling)
router.get('/status/:id', transactionController.checkPaymentStatus);

export default router;
