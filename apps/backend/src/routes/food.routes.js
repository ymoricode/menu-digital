import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import foodController from '../controllers/food.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `food-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
});

const router = Router();

// Public routes
router.get('/', foodController.getAll);
router.get('/:id', foodController.getById);

// Protected routes (admin only)
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  upload.single('image'),
  foodController.create
);
router.put(
  '/:id',
  authMiddleware,
  adminMiddleware,
  upload.single('image'),
  foodController.update
);
router.delete('/:id', authMiddleware, adminMiddleware, foodController.remove);

export default router;
