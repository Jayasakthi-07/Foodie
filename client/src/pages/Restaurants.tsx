import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatCurrency';
import { FiClock, FiStar, FiSearch, FiFilter } from 'react-icons/fi';

interface Restaurant {
  _id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  deliveryTime: number;
  deliveryCharge: number;
  minimumOrder: number;
  cuisine?: string;
  city?: string;
}

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    const searchQuery = searchParams.get('search') || '';
    setSearch(searchQuery);
    fetchRestaurants(searchQuery);
  }, [searchParams, sortBy]);

  const fetchRestaurants = async (searchQuery: string = '') => {
    setLoading(true);
    try {
      const params: any = { isActive: 'true' };
      if (searchQuery) {
        params.search = searchQuery;
      }
      const response = await api.get('/restaurants', { params });
      let allRestaurants = response.data.data.restaurants;

      // Sort restaurants
      if (sortBy === 'rating') {
        allRestaurants.sort((a: Restaurant, b: Restaurant) => b.rating - a.rating);
      } else if (sortBy === 'deliveryTime') {
        allRestaurants.sort((a: Restaurant, b: Restaurant) => a.deliveryTime - b.deliveryTime);
      } else if (sortBy === 'deliveryCharge') {
        allRestaurants.sort((a: Restaurant, b: Restaurant) => a.deliveryCharge - b.deliveryCharge);
      } else if (sortBy === 'name') {
        allRestaurants.sort((a: Restaurant, b: Restaurant) => a.name.localeCompare(b.name));
      }

      setRestaurants(allRestaurants);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search) {
      setSearchParams({ search });
    } else {
      setSearchParams({});
    }
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">All Restaurants</h1>
          <p className="text-charcoal-600 dark:text-charcoal-400">
            Discover {restaurants.length} amazing restaurants near you
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search restaurants by name or cuisine..."
                className="input-field pl-10 w-full"
              />
            </div>
            <button type="submit" className="btn-primary px-8">
              Search
            </button>
          </form>

          {/* Sort Options */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FiFilter className="w-4 h-4 text-charcoal-400" />
              <span className="text-sm font-medium text-charcoal-700 dark:text-charcoal-300 whitespace-nowrap">Sort by:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="input-field text-sm w-auto min-w-[180px]"
            >
              <option value="rating">Highest Rated</option>
              <option value="deliveryTime">Fastest Delivery</option>
              <option value="deliveryCharge">Lowest Delivery Fee</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Restaurants Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-saffron-500"></div>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-charcoal-600 dark:text-charcoal-400 text-lg mb-4">
              {search ? `No restaurants found matching "${search}"` : 'No restaurants available'}
            </p>
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setSearchParams({});
                  fetchRestaurants('');
                }}
                className="btn-outline"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {restaurants.map((restaurant, index) => (
              <motion.div
                key={restaurant._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card group cursor-pointer hover:shadow-xl transition-shadow"
              >
                <Link to={`/menu?restaurant=${restaurant._id}`}>
                  <div className="relative h-48 overflow-hidden rounded-t-xl">
                    <img
                      src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-white dark:bg-charcoal-800 px-3 py-1 rounded-full flex items-center space-x-1 shadow-lg">
                      <FiStar className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-semibold">{restaurant.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-2 line-clamp-1">{restaurant.name}</h3>
                    {restaurant.cuisine && (
                      <p className="text-xs text-saffron-600 dark:text-saffron-400 mb-2 font-medium">
                        {restaurant.cuisine}
                      </p>
                    )}
                    <p className="text-charcoal-600 dark:text-charcoal-400 mb-4 line-clamp-2 text-sm">
                      {restaurant.description}
                    </p>
                    {restaurant.city && (
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-2">
                        📍 {restaurant.city}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-charcoal-500 dark:text-charcoal-400 mb-2">
                      <div className="flex items-center space-x-1">
                        <FiClock className="w-3 h-3" />
                        <span>{restaurant.deliveryTime} min</span>
                      </div>
                      <span className="font-semibold">Delivery: {formatCurrency(restaurant.deliveryCharge)}</span>
                    </div>
                    {restaurant.minimumOrder > 0 && (
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                        Min. order: {formatCurrency(restaurant.minimumOrder)}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Restaurants;

