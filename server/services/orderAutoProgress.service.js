import Order from '../models/Order.model.js';

// Status progression timeline (in seconds from order creation)
const STATUS_TIMELINE = {
  pending: 0, // 0-30 seconds
  confirmed: 30, // 30-60 seconds
  preparing: 60, // 60-90 seconds
  ready: 90, // 90-120 seconds
  out_for_delivery: 120, // 120-150 seconds
  delivered: 180, // 150-180 seconds (3 minutes total)
};

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

let io = null;
export const setSocketIO = (socketIO) => {
  io = socketIO;
};

export const progressOrders = async () => {
  try {
    // Find all active orders (not delivered or cancelled)
    const activeOrders = await Order.find({
      status: { $nin: ['delivered', 'cancelled'] },
    }).populate('user', '_id').populate('restaurant', '_id');

    const now = Date.now();

    for (const order of activeOrders) {
      const orderAge = (now - new Date(order.createdAt).getTime()) / 1000; // Age in seconds

      // Determine what status the order should be at
      let targetStatus = order.status;
      
      if (orderAge >= STATUS_TIMELINE.delivered) {
        targetStatus = 'delivered';
      } else if (orderAge >= STATUS_TIMELINE.out_for_delivery) {
        targetStatus = 'out_for_delivery';
      } else if (orderAge >= STATUS_TIMELINE.ready) {
        targetStatus = 'ready';
      } else if (orderAge >= STATUS_TIMELINE.preparing) {
        targetStatus = 'preparing';
      } else if (orderAge >= STATUS_TIMELINE.confirmed) {
        targetStatus = 'confirmed';
      } else {
        targetStatus = 'pending';
      }

      // Only update if status needs to change
      if (order.status !== targetStatus) {
        const updateData = {
          status: targetStatus,
        };

        if (targetStatus === 'delivered') {
          updateData.deliveredAt = new Date();
        }

        await Order.findByIdAndUpdate(order._id, updateData);

        // Emit socket event for real-time update
        if (io) {
          // Emit to order-specific room
          io.to(`order:${order._id.toString()}`).emit('order:updated', {
            orderId: order._id.toString(),
            status: targetStatus,
            userId: order.user?._id?.toString(),
            restaurantId: order.restaurant?._id?.toString(),
          });
          
          // Also emit to user's room
          if (order.user?._id) {
            io.to(`user:${order.user._id.toString()}`).emit('order:updated', {
              orderId: order._id.toString(),
              status: targetStatus,
              userId: order.user._id.toString(),
              restaurantId: order.restaurant?._id?.toString(),
            });
          }
        }

        console.log(`Order ${order._id} progressed to ${targetStatus}`);
      }
    }
  } catch (error) {
    console.error('Error progressing orders:', error);
  }
};

// Start the auto-progression service
export const startOrderAutoProgress = () => {
  // Run every 5 seconds to check and update order statuses
  setInterval(progressOrders, 5000);
  console.log('✅ Order auto-progression service started (checking every 5 seconds)');
  
  // Run immediately on startup
  progressOrders();
};

