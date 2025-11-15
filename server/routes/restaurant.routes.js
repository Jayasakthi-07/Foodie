import express from 'express';
import {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from '../controllers/restaurant.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/', getAllRestaurants);
router.get('/:id', getRestaurantById);
router.post('/', authenticate, authorize('admin', 'restaurant_manager'), uploadSingle('image'), createRestaurant);
router.put('/:id', authenticate, authorize('admin', 'restaurant_manager'), uploadSingle('image'), updateRestaurant);
router.delete('/:id', authenticate, authorize('admin'), deleteRestaurant);

export default router;

