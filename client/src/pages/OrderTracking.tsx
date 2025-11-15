import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatCurrency';
import { initializeSocket, getSocket } from '../utils/socket';
import toast from 'react-hot-toast';
import { FiMapPin, FiClock, FiCheckCircle, FiXCircle, FiTruck, FiPackage } from 'react-icons/fi';

interface Order {
  _id: string;
  status: string;
  total: number;
  items: any[];
  restaurant: {
    _id: string;
    name: string;
    image: string;
  };
  deliveryAddress: any;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  estimatedDeliveryTime: string;
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: FiPackage },
  { key: 'confirmed', label: 'Confirmed', icon: FiCheckCircle },
  { key: 'preparing', label: 'Preparing', icon: FiClock },
  { key: 'ready', label: 'Ready', icon: FiCheckCircle },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: FiTruck },
  { key: 'delivered', label: 'Delivered', icon: FiCheckCircle },
];

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${id}`);
        setOrder(response.data.data.order);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Order not found');
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!order) return;

    const socket = initializeSocket();
    if (!socket) return;

    socket.emit('order:subscribe', order._id);

    const handleOrderUpdate = (data: any) => {
      if (data.orderId === order._id) {
        setOrder((prev) => prev ? { ...prev, status: data.status } : null);
        // Only show toast for major status changes
        if (['delivered', 'out_for_delivery', 'ready'].includes(data.status)) {
          toast.success(`Order ${data.status.replace('_', ' ')}!`, { duration: 2000 });
        }
      }
    };

    socket.on('order:updated', handleOrderUpdate);

    return () => {
      socket.off('order:updated', handleOrderUpdate);
      socket.emit('order:unsubscribe', order._id);
    };
  }, [order]);

  // Calculate elapsed time and update every second (only for active orders)
  useEffect(() => {
    if (!order) return;
    
    // Don't update elapsed time for delivered or cancelled orders
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [order]);

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    const index = statusSteps.findIndex((step) => step.key === order.status);
    return index >= 0 ? index : 0;
  };

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.put(`/orders/${id}/cancel`);
      toast.success('Order cancelled successfully');
      navigate('/orders');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-saffron-500"></div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const currentStep = getCurrentStepIndex();

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Order Tracking</h1>

        {/* Order Info */}
        <div className="card p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <img
              src={order.restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}
              alt={order.restaurant.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div>
              <h2 className="text-xl font-bold">{order.restaurant.name}</h2>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                Order #{order._id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-saffron-600 mb-1">
                {formatCurrency(order.total)}
              </div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                {order.items.length} item{order.items.length > 1 ? 's' : ''}
              </p>
            </div>
            {order.status !== 'delivered' && order.status !== 'cancelled' && (
              <button onClick={handleCancelOrder} className="btn-outline text-red-600 border-red-600">
                Cancel Order
              </button>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-bold mb-6">Order Status</h2>
          <div className="relative">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentStep;
              const isCurrent = index === currentStep;
              const isCancelled = order.status === 'cancelled';
              const isDelivered = order.status === 'delivered';
              const showProgress = isCurrent && !isCancelled && !isDelivered;
              
              // Calculate progress percentage for current step (only for active orders)
              const getProgressPercentage = () => {
                if (!showProgress) return 0;
                const elapsed = elapsedTime;
                const stepTimings = [0, 30, 60, 90, 120, 180];
                const stepStart = stepTimings[index];
                const stepEnd = stepTimings[index + 1] || 180;
                const stepDuration = stepEnd - stepStart;
                const stepElapsed = Math.max(0, Math.min(stepDuration, elapsed - stepStart));
                return Math.min(100, (stepElapsed / stepDuration) * 100);
              };

              const progressPercentage = getProgressPercentage();

              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start mb-6 last:mb-0"
                >
                  <div className="flex flex-col items-center mr-4">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{
                        scale: showProgress ? [1, 1.1, 1] : 1,
                      }}
                      transition={{
                        duration: 2,
                        repeat: showProgress ? Infinity : 0,
                        ease: 'easeInOut',
                      }}
                      className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isCancelled && index > currentStep
                          ? 'bg-charcoal-200 dark:bg-charcoal-700'
                          : isCompleted
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                          : 'bg-charcoal-200 dark:bg-charcoal-700 text-charcoal-500'
                      }`}
                    >
                      <Icon className="w-6 h-6 relative z-10" />
                      {showProgress && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-green-400"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 0, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeOut',
                          }}
                        />
                      )}
                    </motion.div>
                    {index < statusSteps.length - 1 && (
                      <div className="relative w-0.5 h-16 overflow-hidden">
                        <div
                          className={`absolute inset-0 ${
                            isCompleted ? 'bg-green-500' : 'bg-charcoal-200 dark:bg-charcoal-700'
                          }`}
                        />
                        {showProgress && (
                          <motion.div
                            className="absolute inset-0 bg-green-500 origin-top"
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: progressPercentage / 100 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-grow pt-1">
                    <h3 className={`font-semibold transition-colors duration-500 ${
                      isCompleted ? 'text-green-600 dark:text-green-400' : 'text-charcoal-600 dark:text-charcoal-400'
                    }`}>
                      {step.label}
                    </h3>
                    {showProgress && (
                      <div className="mt-2">
                        <p className="text-sm text-charcoal-500 dark:text-charcoal-500 mb-1">
                          In progress...
                        </p>
                        <div className="w-full bg-charcoal-200 dark:bg-charcoal-700 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            className="bg-green-500 h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                    )}
                    {isCompleted && !showProgress && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {isDelivered && isCurrent ? '✓ Delivered' : '✓ Completed'}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Order Items */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between pb-4 border-b border-charcoal-200 dark:border-charcoal-700 last:border-0">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                    Qty: {item.quantity} × {formatCurrency(item.price)}
                  </p>
                  {item.addOns && item.addOns.length > 0 && (
                    <p className="text-xs text-charcoal-500 dark:text-charcoal-500 mt-1">
                      Add-ons: {item.addOns.map((a: any) => a.name).join(', ')}
                    </p>
                  )}
                </div>
                <div className="font-semibold">{formatCurrency(item.subtotal)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
            <FiMapPin className="w-5 h-5" />
            <span>Delivery Address</span>
          </h2>
          <div className="text-charcoal-700 dark:text-charcoal-300">
            <p className="font-semibold">{order.deliveryAddress.name}</p>
            <p>{order.deliveryAddress.addressLine1}</p>
            {order.deliveryAddress.addressLine2 && <p>{order.deliveryAddress.addressLine2}</p>}
            <p>
              {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
            </p>
            {order.deliveryAddress.landmark && (
              <p className="text-sm text-charcoal-500 dark:text-charcoal-500">
                Landmark: {order.deliveryAddress.landmark}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;

