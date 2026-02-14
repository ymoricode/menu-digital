import { Router } from 'express';
import transactionController from '../controllers/transaction.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// Public routes (customer)
router.post('/', transactionController.create);
router.get('/status/:external_id', transactionController.getByExternalId);
router.post('/sync/:external_id', transactionController.syncPaymentStatus);
router.get('/table-status/:barcodeId', transactionController.checkTableStatus);

// Protected routes (admin)
router.get('/', authMiddleware, adminMiddleware, transactionController.getAll);
router.get('/export', authMiddleware, adminMiddleware, transactionController.exportToExcel);
router.patch('/:id/complete', authMiddleware, adminMiddleware, transactionController.completeTransaction);
router.patch('/:id/cancel', authMiddleware, adminMiddleware, transactionController.cancelTransaction);
router.get('/:id', authMiddleware, adminMiddleware, transactionController.getById);

export default router;
