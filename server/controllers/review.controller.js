import Review from '../models/Review.model.js';
import Dish from '../models/Dish.model.js';
import Restaurant from '../models/Restaurant.model.js';
import Order from '../models/Order.model.js';

// Create a review
export const createReview = async (req, res) => {
  try {
    const { dishId, restaurantId, orderId, rating, comment, images } = req.body;
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Verify user ordered the item if orderId is provided
    let isVerified = false;
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        user: userId,
        status: 'delivered',
      });
      if (order) {
        isVerified = true;
        // Check if dish/restaurant matches order
        if (dishId && !order.items.some((item) => item.dish.toString() === dishId)) {
          return res.status(400).json({
            success: false,
            message: 'Dish not found in this order',
          });
        }
        if (restaurantId && order.restaurant.toString() !== restaurantId) {
          return res.status(400).json({
            success: false,
            message: 'Restaurant does not match this order',
          });
        }
      }
    }

    // Check if user already reviewed this item
    const existingReview = await Review.findOne({
      user: userId,
      ...(dishId && { dish: dishId }),
      ...(restaurantId && { restaurant: restaurantId }),
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this item',
      });
    }

    const review = await Review.create({
      user: userId,
      dish: dishId || undefined,
      restaurant: restaurantId || undefined,
      order: orderId || undefined,
      rating,
      comment,
      images: images || [],
      isVerified,
    });

    // Update dish/restaurant rating
    if (dishId) {
      await updateDishRating(dishId);
    }
    if (restaurantId) {
      await updateRestaurantRating(restaurantId);
    }

    await review.populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create review',
    });
  }
};

// Get reviews for a dish
export const getDishReviews = async (req, res) => {
  try {
    const { dishId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ dish: dishId })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments({ dish: dishId }),
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch reviews',
    });
  }
};

// Get reviews for a restaurant
export const getRestaurantReviews = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ restaurant: restaurantId })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments({ restaurant: restaurantId }),
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch reviews',
    });
  }
};

// Update dish rating (helper function)
const updateDishRating = async (dishId) => {
  const reviews = await Review.find({ dish: dishId });
  if (reviews.length === 0) return;

  const avgRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  await Dish.findByIdAndUpdate(dishId, {
    rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
    totalReviews: reviews.length,
  });
};

// Update restaurant rating (helper function)
const updateRestaurantRating = async (restaurantId) => {
  const reviews = await Review.find({ restaurant: restaurantId });
  if (reviews.length === 0) return;

  const avgRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  await Restaurant.findByIdAndUpdate(restaurantId, {
    rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
    totalReviews: reviews.length,
  });
};

// Update review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, images } = req.body;
    const userId = req.user._id;

    const review = await Review.findOne({ _id: reviewId, user: userId });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }
      review.rating = rating;
    }

    if (comment !== undefined) review.comment = comment;
    if (images !== undefined) review.images = images;

    await review.save();

    // Update dish/restaurant rating
    if (review.dish) {
      await updateDishRating(review.dish);
    }
    if (review.restaurant) {
      await updateRestaurantRating(review.restaurant);
    }

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: { review },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update review',
    });
  }
};

// Delete review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findOne({ _id: reviewId, user: userId });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    const dishId = review.dish;
    const restaurantId = review.restaurant;

    await Review.findByIdAndDelete(reviewId);

    // Update dish/restaurant rating
    if (dishId) {
      await updateDishRating(dishId);
    }
    if (restaurantId) {
      await updateRestaurantRating(restaurantId);
    }

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete review',
    });
  }
};

