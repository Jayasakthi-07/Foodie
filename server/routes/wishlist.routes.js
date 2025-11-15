import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  addDishToFavorites,
  removeDishFromFavorites,
  addRestaurantToFavorites,
  removeRestaurantFromFavorites,
  getFavorites,
  checkFavorite,
} from '../controllers/wishlist.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/dish/:dishId', addDishToFavorites);
router.delete('/dish/:dishId', removeDishFromFavorites);
router.post('/restaurant/:restaurantId', addRestaurantToFavorites);
router.delete('/restaurant/:restaurantId', removeRestaurantFromFavorites);
router.get('/', getFavorites);
router.get('/check/:type/:id', checkFavorite); // type: dish or restaurant

export default router;

