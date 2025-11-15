import express from 'express';
import {
  getAllDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish,
  getAllCategories,
} from '../controllers/dish.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { uploadMultiple } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/categories', getAllCategories);
router.get('/', getAllDishes);
router.get('/:id', getDishById);
router.post('/', authenticate, authorize('admin', 'restaurant_manager'), uploadMultiple('images', 5), createDish);
router.put('/:id', authenticate, authorize('admin', 'restaurant_manager'), uploadMultiple('images', 5), updateDish);
router.delete('/:id', authenticate, authorize('admin', 'restaurant_manager'), deleteDish);

export default router;

