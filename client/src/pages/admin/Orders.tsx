import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

interface Order {
  _id: string;
  status: string;
  total: number;
  items: any[];
  user: {
    _id: string;
    name: string;
    email: string;
  };
  restaurant: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/admin/orders', {
        params: filter ? { status: filter } : {},
      });
      setOrders(response.data.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      toast.success('Order status updated');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const statusOptions = [
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'out_for_delivery',
    'delivered',
    'cancelled',
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-saffron-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Orders</h1>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === ''
                ? 'bg-saffron-500 text-white'
                : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-200'
            }`}
          >
            All
          </button>
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                filter === status
                  ? 'bg-saffron-500 text-white'
                  : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-200'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-charcoal-50 dark:bg-charcoal-800">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Order ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold">Restaurant</th>
                  <th className="text-left py-3 px-4 font-semibold">Items</th>
                  <th className="text-left py-3 px-4 font-semibold">Total</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-charcoal-100 dark:border-charcoal-800 hover:bg-charcoal-50 dark:hover:bg-charcoal-800/50"
                  >
                    <td className="py-3 px-4 text-sm font-mono">
                      #{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-semibold">{order.user.name}</div>
                        <div className="text-sm text-charcoal-600 dark:text-charcoal-400">
                          {order.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{order.restaurant.name}</td>
                    <td className="py-3 px-4">{order.items.length}</td>
                    <td className="py-3 px-4 font-semibold">{formatCurrency(order.total)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        className="input-field text-sm"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;

