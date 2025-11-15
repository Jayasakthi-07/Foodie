import Restaurant from '../models/Restaurant.model.js';

export const getAllRestaurants = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { cuisine: { $regex: search, $options: 'i' } },
      ];
    }

    const restaurants = await Restaurant.find(query)
      .populate('manager', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { restaurants },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch restaurants',
    });
  }
};

export const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate(
      'manager',
      'name email'
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    res.json({
      success: true,
      data: { restaurant },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch restaurant',
    });
  }
};

export const createRestaurant = async (req, res) => {
  try {
    const restaurantData = {
      ...req.body,
      image: req.file ? `/uploads/${req.file.filename}` : req.body.image,
    };

    const restaurant = await Restaurant.create(restaurantData);

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: { restaurant },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create restaurant',
    });
  }
};

export const updateRestaurant = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    res.json({
      success: true,
      message: 'Restaurant updated successfully',
      data: { restaurant },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update restaurant',
    });
  }
};

export const deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    res.json({
      success: true,
      message: 'Restaurant deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete restaurant',
    });
  }
};

