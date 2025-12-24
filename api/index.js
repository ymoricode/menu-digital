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

// Vercel path reconstruction middleware
// Vercel rewrites /api/auth/login to /api/index.js?path=auth/login
// We need to reconstruct the original path
app.use((req, res, next) => {
  if (req.query.path) {
    // Reconstruct the URL from the path query parameter
    const pathFromQuery = '/' + req.query.path;
    req.url = pathFromQuery;
    req.originalUrl = '/api' + pathFromQuery;
  }
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

  // API Routes - without /api prefix since we reconstructed the path
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

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running on Vercel',
    routesLoaded,
    error: loadError ? loadError.message : null,
    timestamp: new Date().toISOString(),
  });
});

// Debug endpoint
app.get('/debug', (req, res) => {
  res.json({
    url: req.url,
    path: req.path,
    originalUrl: req.originalUrl,
    query: req.query,
    method: req.method,
  });
});

// Root handler
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Menu Digital API',
    endpoints: ['/auth', '/menus', '/categories', '/foods', '/barcodes', '/transactions', '/payment', '/dashboard'],
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    url: req.url,
    path: req.path,
    query: req.query,
    routesLoaded,
  });
});

// Export for Vercel
export default app;



