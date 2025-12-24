import { Router } from 'express';
import menuController from '../controllers/menu.controller.js';

const router = Router();

// Public routes (customer facing)
router.get('/', menuController.getAll);
router.get('/categories', menuController.getCategories);
router.get('/:id', menuController.getById);

export default router;
