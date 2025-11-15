import Order from '../models/Order.model.js';
import Dish from '../models/Dish.model.js';
import Restaurant from '../models/Restaurant.model.js';
import User from '../models/User.model.js';
import { calculateOrderTotal } from '../utils/calculateOrder.utils.js';

// Import io from server (will be set after server initialization)
let io = null;
export const setSocketIO = (socketIO) => {
  io = socketIO;
};

export const createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod, notes, specialInstructions, scheduledAt } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required',
      });
    }

    // Get restaurant from first item
    const firstDish = await Dish.findById(items[0].dish);
    if (!firstDish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found',
      });
    }

    const restaurant = await Restaurant.findById(firstDish.restaurant);
    if (!restaurant || !restaurant.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant is not available',
      });
    }

    // Validate all items belong to same restaurant
    const dishIds = items.map((item) => item.dish);
    const dishes = await Dish.find({ _id: { $in: dishIds } });
    const allSameRestaurant = dishes.every(
      (dish) => dish.restaurant.toString() === restaurant._id.toString()
    );

    if (!allSameRestaurant) {
      return res.status(400).json({
        success: false,
        message: 'All items must be from the same restaurant',
      });
    }

    // Build order items with prices
    const orderItems = await Promise.all(
      items.map(async (item) => {
        const dish = dishes.find((d) => d._id.toString() === item.dish);
        if (!dish || !dish.isAvailable) {
          throw new Error(`Dish ${item.dish} is not available`);
        }

        const addOns = (item.addOns || []).map((addon) => ({
          name: addon.name,
          price: addon.price,
        }));

        const addOnsTotal = addOns.reduce((sum, addon) => sum + addon.price, 0);
        const subtotal = (dish.price + addOnsTotal) * item.quantity;

        return {
          dish: dish._id,
          name: dish.name,
          price: dish.price,
          quantity: item.quantity,
          addOns,
          subtotal,
        };
      })
    );

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Calculate totals without promo code
    const { gst, deliveryCharge, discount, total } = calculateOrderTotal(
      orderItems,
      restaurant.deliveryCharge,
      null // No promo code
    );

    // Check minimum order
    if (subtotal < restaurant.minimumOrder) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ₹${restaurant.minimumOrder}`,
      });
    }

    // Handle wallet payment
    let paymentStatus = 'pending';
    if (paymentMethod === 'wallet') {
      const user = await User.findById(req.user._id);
      if (user.wallet < total) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance',
        });
      }
      user.wallet -= total;
      await user.save();
      paymentStatus = 'paid';
    }

    // Validate scheduledAt if provided
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      const now = new Date();
      if (scheduledDate <= now) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled time must be in the future',
        });
      }
      // Limit scheduling to 7 days in advance
      const maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (scheduledDate > maxDate) {
        return res.status(400).json({
          success: false,
          message: 'Orders can only be scheduled up to 7 days in advance',
        });
      }
    }

    // Create order
    const order = await Order.create({
      user: req.user._id,
      restaurant: restaurant._id,
      items: orderItems,
      subtotal,
      gst,
      deliveryCharge,
      discount,
      total,
      deliveryAddress,
      paymentMethod,
      paymentStatus,
      notes,
      specialInstructions,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      estimatedDeliveryTime: scheduledAt 
        ? new Date(new Date(scheduledAt).getTime() + restaurant.deliveryTime * 60000)
        : new Date(Date.now() + restaurant.deliveryTime * 60000),
    });

    // Populate order
    await order.populate('restaurant', 'name image');
    await order.populate('user', 'name email phone');

    // Emit socket event
    if (io) {
      io.emit('order:created', {
        orderId: order._id,
        restaurant: restaurant._id,
        status: order.status,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order',
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { user: req.user._id };

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('restaurant', 'name image')
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

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurant', 'name image address')
      .populate('user', 'name email phone')
      .populate('items.dish', 'name image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user owns the order or is admin
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'restaurant_manager'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch order',
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`,
      });
    }

    // Refund wallet if paid
    if (order.paymentMethod === 'wallet' && order.paymentStatus === 'paid') {
      const user = await User.findById(req.user._id);
      user.wallet += order.total;
      await user.save();
    }

    order.status = 'cancelled';
    order.paymentStatus = order.paymentMethod === 'wallet' ? 'refunded' : order.paymentStatus;
    await order.save();

    // Emit socket event
    if (io) {
      io.emit('order:updated', {
        orderId: order._id,
        status: order.status,
      });
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: { order },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel order',
    });
  }
};

// Reorder from previous order
export const reorder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    // Find the original order
    const originalOrder = await Order.findOne({
      _id: orderId,
      user: userId,
    }).populate('restaurant');

    if (!originalOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if restaurant is still active
    if (!originalOrder.restaurant.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant is no longer available',
      });
    }

    // Validate dishes are still available
    const dishIds = originalOrder.items.map((item) => item.dish);
    const dishes = await Dish.find({ _id: { $in: dishIds } });
    
    const unavailableDishes = [];
    for (const item of originalOrder.items) {
      const dish = dishes.find((d) => d._id.toString() === item.dish.toString());
      if (!dish || !dish.isAvailable) {
        unavailableDishes.push(item.name);
      }
    }

    if (unavailableDishes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Some dishes are no longer available: ${unavailableDishes.join(', ')}`,
        unavailableDishes,
      });
    }

    // Build new order items with current prices
    const newOrderItems = await Promise.all(
      originalOrder.items.map(async (item) => {
        const dish = dishes.find((d) => d._id.toString() === item.dish.toString());
        const addOns = (item.addOns || []).map((addon) => ({
          name: addon.name,
          price: addon.price,
        }));

        const addOnsTotal = addOns.reduce((sum, addon) => sum + addon.price, 0);
        const subtotal = (dish.price + addOnsTotal) * item.quantity;

        return {
          dish: dish._id,
          name: dish.name,
          price: dish.price,
          quantity: item.quantity,
          addOns,
          subtotal,
        };
      })
    );

    // Calculate totals with current prices
    const subtotal = newOrderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const { gst, deliveryCharge, discount, total } = calculateOrderTotal(
      newOrderItems,
      originalOrder.restaurant.deliveryCharge,
      null
    );

    // Check minimum order
    if (subtotal < originalOrder.restaurant.minimumOrder) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ₹${originalOrder.restaurant.minimumOrder}`,
      });
    }

    // Return the order data for frontend to add to cart or place directly
    res.json({
      success: true,
      message: 'Order ready to reorder',
      data: {
        items: newOrderItems.map((item) => ({
          dish: item.dish,
          quantity: item.quantity,
          addOns: item.addOns,
        })),
        restaurant: originalOrder.restaurant._id,
        subtotal,
        gst,
        deliveryCharge,
        discount,
        total,
        deliveryAddress: originalOrder.deliveryAddress,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reorder',
    });
  }
};

