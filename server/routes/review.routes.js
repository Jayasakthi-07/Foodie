import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  createReview,
  getDishReviews,
  getRestaurantReviews,
  updateReview,
  deleteReview,
} from '../controllers/review.controller.js';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/dish/:dishId', getDishReviews);
router.get('/restaurant/:restaurantId', getRestaurantReviews);
router.put('/:reviewId', protect, updateReview);
router.delete('/:reviewId', protect, deleteReview);

export default router;

