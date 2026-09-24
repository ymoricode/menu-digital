import { Router } from 'express';
import transactionController from '../controllers/transaction.controller.js';

const router = Router();

// Midtrans Payment Notification webhook (no auth middleware — verified by signature)
router.post('/webhook', transactionController.paymentWebhook);
router.post('/notification', transactionController.paymentWebhook); // Alias for Midtrans naming

// Payment status check (lightweight, DB-only — used by frontend polling)
router.get('/status/:id', transactionController.checkPaymentStatus);

export default router;
