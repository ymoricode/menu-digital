import { Router } from 'express';
import authRoutes from './auth.routes.js';
import menuRoutes from './menu.routes.js';
import categoryRoutes from './category.routes.js';
import foodRoutes from './food.routes.js';
import barcodeRoutes from './barcode.routes.js';
import transactionRoutes from './transaction.routes.js';
import paymentRoutes from './payment.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/menus', menuRoutes);
router.use('/categories', categoryRoutes);
router.use('/foods', foodRoutes);
router.use('/barcodes', barcodeRoutes);
router.use('/barcode', barcodeRoutes); // Alias for /barcode/:table_number
router.use('/transactions', transactionRoutes);
router.use('/payment', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
