// Vercel Serverless Function - Express.js Adapter
import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log('Request:', {
    method: req.method,
    url: req.url,
    path: req.path,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
  });
  next();
});

// Try to load routes with error handling
let routesLoaded = false;
let loadError = null;

try {
  const authRoutes = (await import('../apps/backend/src/routes/auth.routes.js')).default;
  const menuRoutes = (await import('../apps/backend/src/routes/menu.routes.js')).default;
  const categoryRoutes = (await import('../apps/backend/src/routes/category.routes.js')).default;
  const foodRoutes = (await import('../apps/backend/src/routes/food.routes.js')).default;
  const barcodeRoutes = (await import('../apps/backend/src/routes/barcode.routes.js')).default;
  const transactionRoutes = (await import('../apps/backend/src/routes/transaction.routes.js')).default;
  const paymentRoutes = (await import('../apps/backend/src/routes/payment.routes.js')).default;
  const dashboardRoutes = (await import('../apps/backend/src/routes/dashboard.routes.js')).default;

  // API Routes - with /api prefix
  app.use('/api/auth', authRoutes);
  app.use('/api/menus', menuRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/foods', foodRoutes);
  app.use('/api/barcodes', barcodeRoutes);
  app.use('/api/barcode', barcodeRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/payment', paymentRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // Also without /api prefix as fallback
  app.use('/auth', authRoutes);
  app.use('/menus', menuRoutes);
  app.use('/categories', categoryRoutes);
  app.use('/foods', foodRoutes);
  app.use('/barcodes', barcodeRoutes);
  app.use('/barcode', barcodeRoutes);
  app.use('/transactions', transactionRoutes);
  app.use('/payment', paymentRoutes);
  app.use('/dashboard', dashboardRoutes);
  
  routesLoaded = true;
} catch (error) {
  loadError = error;
  console.error('Failed to load routes:', error);
}

// Health check - both paths
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    success: true,
    message: 'API is running on Vercel',
    routesLoaded,
    error: loadError ? loadError.message : null,
    timestamp: new Date().toISOString(),
  });
});

// Debug endpoint
app.get(['/debug', '/api/debug'], (req, res) => {
  res.json({
    url: req.url,
    path: req.path,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    method: req.method,
    headers: req.headers,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    url: req.url,
    path: req.path,
    originalUrl: req.originalUrl,
    routesLoaded,
  });
});

// Export for Vercel
export default app;


