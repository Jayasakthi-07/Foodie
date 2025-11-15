import Dish from '../models/Dish.model.js';
import Category from '../models/Category.model.js';
import Restaurant from '../models/Restaurant.model.js';

export const getAllDishes = async (req, res) => {
  try {
    const {
      restaurant,
      category,
      search,
      isVeg,
      minPrice,
      maxPrice,
      minRating,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { isAvailable: true };

    if (restaurant) query.restaurant = restaurant;
    if (category) query.category = category;
    if (isVeg !== undefined) query.isVeg = isVeg === 'true';
    if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };
    if (minRating) query.rating = { ...query.rating, $gte: parseFloat(minRating) };

    // Filter by tags (multiple tags supported)
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }

    // Handle search using regex (searches only in dish name)
    if (search) {
      const searchRegex = new RegExp(search, 'i'); // Case-insensitive
      query.name = searchRegex;
      
      // Save search to user's search history if authenticated
      if (req.user) {
        try {
          const User = (await import('../models/User.model.js')).default;
          await User.findByIdAndUpdate(req.user._id, {
            $push: {
              searchHistory: {
                $each: [{ query: search, timestamp: new Date() }],
                $slice: -20, // Keep only last 20 searches
              },
            },
          });
        } catch (error) {
          // Ignore search history errors
        }
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // If searching, sort by relevance first, then by the selected sort option
    let sort = {};
    if (search) {
      // When searching, we want to prioritize matches in name over description
      // This is handled by the query, but we can still apply the user's sort preference
      sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    } else {
      sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    }

    const [dishes, total] = await Promise.all([
      Dish.find(query)
        .populate('restaurant', 'name image')
        .populate('category', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Dish.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        dishes,
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
      message: error.message || 'Failed to fetch dishes',
    });
  }
};

export const getDishById = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id)
      .populate('restaurant', 'name image rating deliveryTime')
      .populate('category', 'name');

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found',
      });
    }

    res.json({
      success: true,
      data: { dish },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dish',
    });
  }
};

export const createDish = async (req, res) => {
  try {
    const dishData = {
      ...req.body,
      images: req.files
        ? req.files.map((file) => `/uploads/${file.filename}`)
        : req.body.images || [],
    };

    if (req.files && req.files.length > 0) {
      dishData.image = `/uploads/${req.files[0].filename}`;
    }

    const dish = await Dish.create(dishData);

    await dish.populate('restaurant', 'name');
    await dish.populate('category', 'name');

    res.status(201).json({
      success: true,
      message: 'Dish created successfully',
      data: { dish },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create dish',
    });
  }
};

export const updateDish = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map((file) => `/uploads/${file.filename}`);
      updateData.image = `/uploads/${req.files[0].filename}`;
    }

    const dish = await Dish.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('restaurant', 'name')
      .populate('category', 'name');

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found',
      });
    }

    res.json({
      success: true,
      message: 'Dish updated successfully',
      data: { dish },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update dish',
    });
  }
};

export const deleteDish = async (req, res) => {
  try {
    const dish = await Dish.findByIdAndDelete(req.params.id);

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found',
      });
    }

    res.json({
      success: true,
      message: 'Dish deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete dish',
    });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });
    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch categories',
    });
  }
};

