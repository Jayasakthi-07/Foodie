import User from '../models/User.model.js';
import Dish from '../models/Dish.model.js';
import Restaurant from '../models/Restaurant.model.js';

// Add dish to favorites
export const addDishToFavorites = async (req, res) => {
  try {
    const { dishId } = req.params;
    const userId = req.user._id;

    // Check if dish exists
    const dish = await Dish.findById(dishId);
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found',
      });
    }

    // Add to favorites if not already added
    const user = await User.findById(userId);
    if (!user.favorites) {
      user.favorites = { dishes: [], restaurants: [] };
    }

    if (!user.favorites.dishes.includes(dishId)) {
      user.favorites.dishes.push(dishId);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Dish added to favorites',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add dish to favorites',
    });
  }
};

// Remove dish from favorites
export const removeDishFromFavorites = async (req, res) => {
  try {
    const { dishId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (user.favorites && user.favorites.dishes) {
      user.favorites.dishes = user.favorites.dishes.filter(
        (id) => id.toString() !== dishId
      );
      await user.save();
    }

    res.json({
      success: true,
      message: 'Dish removed from favorites',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove dish from favorites',
    });
  }
};

// Add restaurant to favorites
export const addRestaurantToFavorites = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const userId = req.user._id;

    // Check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Add to favorites if not already added
    const user = await User.findById(userId);
    if (!user.favorites) {
      user.favorites = { dishes: [], restaurants: [] };
    }

    if (!user.favorites.restaurants.includes(restaurantId)) {
      user.favorites.restaurants.push(restaurantId);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Restaurant added to favorites',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add restaurant to favorites',
    });
  }
};

// Remove restaurant from favorites
export const removeRestaurantFromFavorites = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (user.favorites && user.favorites.restaurants) {
      user.favorites.restaurants = user.favorites.restaurants.filter(
        (id) => id.toString() !== restaurantId
      );
      await user.save();
    }

    res.json({
      success: true,
      message: 'Restaurant removed from favorites',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove restaurant from favorites',
    });
  }
};

// Get user's favorites
export const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favorites.dishes', 'name price image rating isAvailable')
      .populate('favorites.restaurants', 'name image rating deliveryTime isActive');

    res.json({
      success: true,
      data: {
        dishes: user.favorites?.dishes || [],
        restaurants: user.favorites?.restaurants || [],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch favorites',
    });
  }
};

// Check if item is in favorites
export const checkFavorite = async (req, res) => {
  try {
    const { type, id } = req.params; // type: 'dish' or 'restaurant'
    const user = await User.findById(req.user._id);

    let isFavorite = false;
    if (type === 'dish' && user.favorites?.dishes) {
      isFavorite = user.favorites.dishes.some(
        (dishId) => dishId.toString() === id
      );
    } else if (type === 'restaurant' && user.favorites?.restaurants) {
      isFavorite = user.favorites.restaurants.some(
        (restaurantId) => restaurantId.toString() === id
      );
    }

    res.json({
      success: true,
      data: { isFavorite },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check favorite status',
    });
  }
};

