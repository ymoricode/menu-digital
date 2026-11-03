import { Router } from 'express';
import recommendationController from '../controllers/recommendation.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// Route publik untuk melihat aturan asosiasi yang aktif
router.get('/rules', recommendationController.getRules);

// Route admin untuk menjalankan algoritma Apriori pada data transaksi aktual
router.post(
  '/analyze',
  authMiddleware,
  adminMiddleware,
  recommendationController.runAnalysis
);

// Route publik untuk pelanggan: rekomendasi menu berdasarkan ID produk
router.get('/:foodId', recommendationController.getRecommendations);

export default router;

