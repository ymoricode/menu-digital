import { Router } from 'express';
import categoryController from '../controllers/category.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);

// Protected routes (admin only)
router.post('/', authMiddleware, adminMiddleware, categoryController.create);
router.put('/:id', authMiddleware, adminMiddleware, categoryController.update);
router.delete('/:id', authMiddleware, adminMiddleware, categoryController.remove);

export default router;
