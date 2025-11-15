import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { FiDollarSign, FiShoppingBag, FiUsers, FiTrendingUp } from 'react-icons/fi';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalRestaurants: number;
  totalDishes: number;
  pendingOrders: number;
  todayOrders: number;
  todayRevenue: number;
  topDishes: Array<{
    dishName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  revenueByDay: Array<{ date: string; revenue: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
}

const COLORS = ['#f97316', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        // Flatten the nested stats structure
        const data = response.data.data;
        setStats({
          ...data.stats,
          topDishes: data.topDishes || [],
          revenueByDay: data.revenueByDay || [],
          ordersByStatus: data.ordersByStatus || [],
          revenueByMonth: data.revenueByMonth || [],
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-saffron-500"></div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: FiDollarSign,
      color: 'bg-green-500',
      change: '+12.5%',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: FiShoppingBag,
      color: 'bg-blue-500',
      change: '+8.2%',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: FiUsers,
      color: 'bg-purple-500',
      change: '+15.3%',
      link: '/admin/users',
    },
    {
      title: 'Today\'s Revenue',
      value: formatCurrency(stats.todayRevenue),
      icon: FiTrendingUp,
      color: 'bg-saffron-500',
      change: '+5.1%',
    },
  ];

  // Format revenue by day for chart
  const revenueChartData = stats.revenueByDay.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    revenue: item.revenue,
  }));

  // Format orders by status for pie chart
  const statusChartData = stats.ordersByStatus.map((item) => ({
    name: item.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value: item.count,
  }));

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            const CardContent = (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-charcoal-600 dark:text-charcoal-400 text-sm mb-1">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-green-600 text-xs mt-1">{card.change} from last month</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            );

            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card p-6"
              >
                {card.link ? (
                  <Link to={card.link} className="block hover:opacity-80 transition-opacity">
                    {CardContent}
                  </Link>
                ) : (
                  CardContent
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Trend (Last 7 Days) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-6"
          >
            <h2 className="text-xl font-bold mb-4">Revenue Trend (Last 7 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Orders by Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card p-6"
          >
            <h2 className="text-xl font-bold mb-4">Orders by Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card p-6"
          >
            <h2 className="text-xl font-bold mb-4">Monthly Revenue (Last 6 Months)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="revenue" fill="#14b8a6" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top Dishes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="card p-6"
          >
            <h2 className="text-xl font-bold mb-4">Top Selling Dishes</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.topDishes.slice(0, 10)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="dishName" type="category" width={80} />
                <Tooltip formatter={(value) => value} />
                <Legend />
                <Bar dataKey="totalQuantity" fill="#f97316" name="Quantity Sold" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-2">Restaurants</h3>
            <p className="text-3xl font-bold text-saffron-600">{stats.totalRestaurants}</p>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-2">Dishes</h3>
            <p className="text-3xl font-bold text-teal-600">{stats.totalDishes}</p>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-2">Pending Orders</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
          </div>
        </div>

        {/* Top Dishes Table */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-6">Top Selling Dishes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-charcoal-200 dark:border-charcoal-700">
                  <th className="text-left py-3 px-4 font-semibold">Rank</th>
                  <th className="text-left py-3 px-4 font-semibold">Dish</th>
                  <th className="text-right py-3 px-4 font-semibold">Quantity</th>
                  <th className="text-right py-3 px-4 font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.topDishes.length > 0 ? (
                  stats.topDishes.slice(0, 10).map((dish, index) => (
                    <tr
                      key={index}
                      className="border-b border-charcoal-100 dark:border-charcoal-800 hover:bg-charcoal-50 dark:hover:bg-charcoal-800/50"
                    >
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-saffron-100 dark:bg-saffron-900/30 text-saffron-600 dark:text-saffron-400 font-bold">
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">{dish.dishName}</td>
                      <td className="text-right py-3 px-4">{dish.totalQuantity}</td>
                      <td className="text-right py-3 px-4 font-semibold">
                        {formatCurrency(dish.totalRevenue)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-charcoal-600 dark:text-charcoal-400">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
