import { Router } from 'express';
import transactionController from '../controllers/transaction.controller.js';

const router = Router();

// Xendit webhook callback (no auth - verified by token)
router.post('/xendit/callback', transactionController.xenditCallback);

export default router;
