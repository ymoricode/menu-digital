// Vercel Serverless Function - Express.js Adapter
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from '../apps/backend/src/routes/auth.routes.js';
import menuRoutes from '../apps/backend/src/routes/menu.routes.js';
import categoryRoutes from '../apps/backend/src/routes/category.routes.js';
import foodRoutes from '../apps/backend/src/routes/food.routes.js';
import barcodeRoutes from '../apps/backend/src/routes/barcode.routes.js';
import transactionRoutes from '../apps/backend/src/routes/transaction.routes.js';
import paymentRoutes from '../apps/backend/src/routes/payment.routes.js';
import dashboardRoutes from '../apps/backend/src/routes/dashboard.routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/barcodes', barcodeRoutes);
app.use('/api/barcode', barcodeRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running on Vercel',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

// Export for Vercel
export default app;
