import { Router } from 'express';
import barcodeController from '../controllers/barcode.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// Public routes (customer facing)
router.get('/table/:table_number', barcodeController.getByTableNumber);

// Protected routes (admin only)
router.get('/', authMiddleware, adminMiddleware, barcodeController.getAll);
router.get('/:id', authMiddleware, adminMiddleware, barcodeController.getById);
router.post('/', authMiddleware, adminMiddleware, barcodeController.create);
router.post('/:id/regenerate', authMiddleware, adminMiddleware, barcodeController.regenerate);
router.delete('/:id', authMiddleware, adminMiddleware, barcodeController.remove);

export default router;
