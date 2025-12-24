import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// All dashboard routes are protected (admin only)
router.use(authMiddleware, adminMiddleware);

router.get('/summary', dashboardController.getSummary);
router.get('/top-products', dashboardController.getTopProducts);
router.get('/monthly-income', dashboardController.getMonthlyIncome);
router.get('/weekly-income', dashboardController.getWeeklyIncome);
router.get('/recent-transactions', dashboardController.getRecentTransactions);

export default router;
