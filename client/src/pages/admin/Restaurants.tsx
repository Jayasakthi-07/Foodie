import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2, FiPlus, FiStar } from 'react-icons/fi';

interface Restaurant {
  _id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  deliveryTime: number;
  deliveryCharge: number;
  minimumOrder: number;
  isActive: boolean;
}

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await api.get('/restaurants');
      setRestaurants(response.data.data.restaurants);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this restaurant?')) return;
    try {
      await api.delete(`/restaurants/${id}`);
      toast.success('Restaurant deleted successfully');
      fetchRestaurants();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete restaurant');
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
          <h1 className="text-4xl font-bold">Restaurants</h1>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingRestaurant(null);
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <FiPlus className="w-5 h-5" />
            <span>Add Restaurant</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant, index) => (
            <motion.div
              key={restaurant._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card p-6"
            >
              <img
                src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}
                alt={restaurant.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="text-xl font-bold mb-2">{restaurant.name}</h3>
              <p className="text-charcoal-600 dark:text-charcoal-400 mb-4 line-clamp-2">
                {restaurant.description}
              </p>
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center space-x-2">
                  <FiStar className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span>{restaurant.rating.toFixed(1)}</span>
                </div>
                <div>Delivery: {restaurant.deliveryTime} min</div>
                <div>Min Order: {formatCurrency(restaurant.minimumOrder)}</div>
                <div>
                  Status:{' '}
                  <span className={restaurant.isActive ? 'text-green-600' : 'text-red-600'}>
                    {restaurant.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingRestaurant(restaurant);
                    setShowForm(true);
                  }}
                  className="flex-1 btn-outline flex items-center justify-center space-x-2"
                >
                  <FiEdit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(restaurant._id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminRestaurants;

