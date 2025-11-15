import Order from '../models/Order.model.js';
import { io } from '../server.js';

let socketIO = null;

export const setSocketIO = (ioInstance) => {
  socketIO = ioInstance;
};

// Process scheduled orders
const processScheduledOrders = async () => {
  try {
    const now = new Date();
    
    // Find orders that are scheduled and should be placed now
    const scheduledOrders = await Order.find({
      scheduledAt: { $lte: now },
      status: 'pending',
      scheduledAt: { $exists: true, $ne: null },
    }).populate('restaurant', 'name').populate('user', 'name email');

    for (const order of scheduledOrders) {
      // Update order status to confirmed (it was already created, just needs to be processed)
      order.status = 'confirmed';
      await order.save();

      // Emit socket event
      if (socketIO) {
        socketIO.emit('order:created', {
          orderId: order._id,
          restaurant: order.restaurant._id,
          status: order.status,
        });
      }

      console.log(`✅ Processed scheduled order ${order.orderNumber || order._id}`);
    }
  } catch (error) {
    console.error('Error processing scheduled orders:', error);
  }
};

// Check for scheduled orders every minute
export const startScheduledOrdersProcessor = () => {
  setInterval(processScheduledOrders, 60 * 1000); // Check every minute
  console.log('🚀 Scheduled orders processor started');
};

