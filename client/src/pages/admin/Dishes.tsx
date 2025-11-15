import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2, FiPlus, FiStar } from 'react-icons/fi';

interface Dish {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  restaurant: {
    _id: string;
    name: string;
  };
  category: {
    _id: string;
    name: string;
  };
}

const AdminDishes = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDishes();
  }, []);

  const fetchDishes = async () => {
    try {
      const response = await api.get('/dishes');
      setDishes(response.data.data.dishes);
    } catch (error) {
      console.error('Error fetching dishes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dish?')) return;
    try {
      await api.delete(`/dishes/${id}`);
      toast.success('Dish deleted successfully');
      fetchDishes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete dish');
    }
  };

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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Dishes</h1>
          <button className="btn-primary flex items-center space-x-2">
            <FiPlus className="w-5 h-5" />
            <span>Add Dish</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dishes.map((dish, index) => (
            <motion.div
              key={dish._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card p-4"
            >
              <img
                src={dish.image || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800'}
                alt={dish.name}
                className="w-full h-40 object-cover rounded-lg mb-3"
              />
              <h3 className="font-bold mb-1 line-clamp-1">{dish.name}</h3>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-2 line-clamp-2">
                {dish.description}
              </p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-saffron-600">
                  {formatCurrency(dish.price)}
                </span>
                <div className="flex items-center space-x-1">
                  <FiStar className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 btn-outline text-sm py-1">
                  <FiEdit className="w-4 h-4 inline mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(dish._id)}
                  className="px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDishes;

