import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

export const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId}`);

    // Join user's personal room for order updates
    socket.join(`user:${socket.userId}`);

    // Join admin room if admin
    if (socket.userRole === 'admin' || socket.userRole === 'restaurant_manager') {
      socket.join('admin');
    }

    // Handle order tracking subscription
    socket.on('order:subscribe', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`User ${socket.userId} subscribed to order ${orderId}`);
    });

    // Handle order tracking unsubscription
    socket.on('order:unsubscribe', (orderId) => {
      socket.leave(`order:${orderId}`);
      console.log(`User ${socket.userId} unsubscribed from order ${orderId}`);
    });

    // Allow subscribing to user's orders
    socket.on('user:subscribe', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`User ${socket.userId} subscribed to user orders ${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
    });
  });

  // Helper function to emit order updates
  io.emitOrderUpdate = (orderId, data) => {
    io.to(`order:${orderId}`).emit('order:update', data);
    io.to(`user:${data.userId}`).emit('order:update', data);
    io.to('admin').emit('order:update', data);
  };
};

