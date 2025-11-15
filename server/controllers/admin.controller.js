import Order from '../models/Order.model.js';
import Dish from '../models/Dish.model.js';
import Restaurant from '../models/Restaurant.model.js';
import User from '../models/User.model.js';
import Category from '../models/Category.model.js';
import PromoCode from '../models/PromoCode.model.js';
// Import io from server (will be set after server initialization)
let io = null;
export const setSocketIO = (socketIO) => {
  io = socketIO;
};

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalOrders,
      totalRevenue,
      totalUsers,
      totalRestaurants,
      totalDishes,
      pendingOrders,
      todayOrders,
      todayRevenue,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      User.countDocuments({ role: 'user' }),
      Restaurant.countDocuments(),
      Dish.countDocuments(),
      Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'preparing'] } }),
      Order.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
            status: { $ne: 'cancelled' },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    // Get revenue by day for last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayRevenue = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: date, $lt: nextDate },
            status: { $ne: 'cancelled' },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]);
      
      last7Days.push({
        date: date.toISOString().split('T')[0],
        revenue: dayRevenue[0]?.total || 0,
      });
    }

    // Get orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get revenue by month for last 6 months
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const monthRevenue = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: date, $lt: nextMonth },
            status: { $ne: 'cancelled' },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]);
      
      last6Months.push({
        month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue[0]?.total || 0,
      });
    }

    // Top selling dishes
    const topDishes = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.dish',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'dishes',
          localField: '_id',
          foreignField: '_id',
          as: 'dish',
        },
      },
      { $unwind: '$dish' },
      {
        $project: {
          dishName: '$dish.name',
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalOrders: totalOrders || 0,
          totalRevenue: (totalRevenue[0]?.total && !isNaN(totalRevenue[0].total)) ? totalRevenue[0].total : 0,
          totalUsers: totalUsers || 0,
          totalRestaurants: totalRestaurants || 0,
          totalDishes: totalDishes || 0,
          pendingOrders: pendingOrders || 0,
          todayOrders: todayOrders || 0,
          todayRevenue: (todayRevenue[0]?.total && !isNaN(todayRevenue[0].total)) ? todayRevenue[0].total : 0,
        },
        topDishes,
        revenueByDay: last7Days,
        ordersByStatus: ordersByStatus.map(item => ({ status: item._id, count: item.count })),
        revenueByMonth: last6Months,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dashboard stats',
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const { status, restaurant, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (restaurant) query.restaurant = restaurant;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phone')
        .populate('restaurant', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        orders,
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
      message: error.message || 'Failed to fetch orders',
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
        ...(status === 'delivered' && { deliveredAt: new Date() }),
      },
      { new: true }
    )
      .populate('user', 'name email')
      .populate('restaurant', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Emit socket event
    if (io) {
      io.emit('order:updated', {
        orderId: order._id,
        status: order.status,
        userId: order.user._id.toString(),
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update order status',
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const categoryData = {
      ...req.body,
      image: req.file ? `/uploads/${req.file.filename}` : req.body.image,
    };

    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create category',
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const category = await Category.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update category',
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete category',
    });
  }
};

export const createPromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Promo code created successfully',
      data: { promoCode },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create promo code',
    });
  }
};

export const getAllPromoCodes = async (req, res) => {
  try {
    const promoCodes = await PromoCode.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { promoCodes },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch promo codes',
    });
  }
};

export const updatePromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found',
      });
    }

    res.json({
      success: true,
      message: 'Promo code updated successfully',
      data: { promoCode },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update promo code',
    });
  }
};

// Export orders as CSV
export const exportOrders = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 });

    // Convert to CSV
    const csvHeader = 'Order Number,Date,User,Email,Phone,Restaurant,Items,Subtotal,GST,Delivery Charge,Discount,Total,Status,Payment Method,Payment Status\n';
    
    const csvRows = orders.map((order) => {
      const items = order.items.map((item) => `${item.name} x${item.quantity}`).join('; ');
      const date = new Date(order.createdAt).toLocaleString('en-IN');
      
      return [
        order.orderNumber || order._id,
        date,
        order.user?.name || 'N/A',
        order.user?.email || 'N/A',
        order.user?.phone || 'N/A',
        order.restaurant?.name || 'N/A',
        `"${items}"`,
        order.subtotal,
        order.gst,
        order.deliveryCharge,
        order.discount,
        order.total,
        order.status,
        order.paymentMethod,
        order.paymentStatus,
      ].join(',');
    });

    const csv = csvHeader + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export orders',
    });
  }
};

// Export users as CSV
export const exportUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = {};

    if (role) query.role = role;

    const users = await User.find(query).sort({ createdAt: -1 });

    // Convert to CSV
    const csvHeader = 'Name,Email,Phone,Role,Wallet Balance,Total Orders,Total Spent,Joined Date\n';
    
    const csvRows = await Promise.all(
      users.map(async (user) => {
        const orderCount = await Order.countDocuments({ user: user._id });
        const totalSpent = await Order.aggregate([
          { $match: { user: user._id, status: { $ne: 'cancelled' } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]);
        
        const spent = totalSpent[0]?.total || 0;
        const date = new Date(user.createdAt).toLocaleString('en-IN');

        return [
          user.name,
          user.email,
          user.phone || 'N/A',
          user.role,
          user.wallet || 0,
          orderCount,
          spent,
          date,
        ].join(',');
      })
    );

    const csv = csvHeader + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=users-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export users',
    });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    // Get order stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const orderCount = await Order.countDocuments({ user: user._id });
        const totalSpent = await Order.aggregate([
          { $match: { user: user._id, status: { $ne: 'cancelled' } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]);

        return {
          ...user.toObject(),
          orderCount,
          totalSpent: totalSpent[0]?.total || 0,
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
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
      message: error.message || 'Failed to fetch users',
    });
  }
};

// Update user details
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, wallet, isEmailVerified } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email.toLowerCase();
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;
    if (wallet !== undefined) user.wallet = wallet;
    if (isEmailVerified !== undefined) user.isEmailVerified = isEmailVerified;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user',
    });
  }
};

export const getAdvancedAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};

    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Customer retention (users who ordered more than once)
    const repeatCustomers = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
      { $group: { _id: '$user', orderCount: { $sum: 1 } } },
      { $match: { orderCount: { $gt: 1 } } },
      { $count: 'total' },
    ]);

    // Average order value
    const avgOrderValue = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, avg: { $avg: '$total' } } },
    ]);

    // Top customers by spending
    const topCustomers = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$total' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          userName: '$user.name',
          userEmail: '$user.email',
          totalSpent: 1,
          orderCount: 1,
        },
      },
    ]);

    // Orders by day of week
    const ordersByDay = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          count: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dayNames = ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const ordersByDayFormatted = ordersByDay.map((item) => ({
      day: dayNames[item._id],
      count: item.count,
      revenue: item.revenue,
    }));

    res.json({
      success: true,
      data: {
        repeatCustomers: repeatCustomers[0]?.total || 0,
        avgOrderValue: avgOrderValue[0]?.avg || 0,
        topCustomers,
        ordersByDay: ordersByDayFormatted,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch advanced analytics',
    });
  }
};

