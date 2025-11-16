import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatCurrency';
import { getImageUrl } from '../utils/getImageUrl';
import { FiClock, FiStar, FiArrowRight } from 'react-icons/fi';

interface Restaurant {
  _id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  deliveryTime: number;
  deliveryCharge: number;
}

const Home = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await api.get('/restaurants?isActive=true');
        // Show only first 12 restaurants
        const allRestaurants = response.data.data.restaurants;
        setRestaurants(allRestaurants.slice(0, 12));
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative text-white py-20 md:py-32 overflow-hidden animated-gradient">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Authentic South Indian Cuisine
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Experience the rich flavors of South India, delivered fresh to your doorstep
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/menu" className="btn-primary bg-white hover:bg-charcoal-100" style={{ color: '#FF8000' }}>
                Explore Menu
              </Link>
              <Link 
                to="/register" 
                className="btn-outline border-white text-white transition-colors"
                style={{ 
                  '--hover-bg': 'white',
                  '--hover-text': '#FF8000'
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = '#FF8000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'white';
                }}
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-charcoal-50 dark:bg-charcoal-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(255, 128, 0, 0.1)' }}>
                <FiClock className="w-8 h-8" style={{ color: '#FF8000' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Get your favorite dishes delivered in 30-45 minutes
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(255, 128, 0, 0.1)' }}>
                <FiStar className="w-8 h-8" style={{ color: '#FF8000' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Fresh ingredients and authentic recipes from South India
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(255, 128, 0, 0.1)' }}>
                <FiArrowRight className="w-8 h-8" style={{ color: '#FF8000' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Ordering</h3>
              <p className="text-charcoal-600 dark:text-charcoal-400">
                Simple and intuitive ordering process
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Restaurants Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Our Restaurants</h2>
              {!loading && restaurants.length > 0 && (
                <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mt-1">
                  Showing {restaurants.length} restaurants
                </p>
              )}
            </div>
            <Link
              to="/restaurants"
              className="hidden md:flex items-center space-x-2 font-semibold transition-colors"
              style={{ color: '#FF8000' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FF9933'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#FF8000'}
            >
              <span>View All Restaurants</span>
              <FiArrowRight className="w-5 h-5" />
            </Link>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: '#FF8000' }}></div>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-charcoal-600 dark:text-charcoal-400 text-lg">No restaurants available</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {restaurants.map((restaurant, index) => (
                  <motion.div
                    key={restaurant._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="card group cursor-pointer hover:shadow-xl transition-shadow"
                  >
                    <Link to={`/menu?restaurant=${restaurant._id}`}>
                      <div className="relative h-48 overflow-hidden rounded-t-xl">
                        <img
                          src={getImageUrl(restaurant.image) || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'}
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
                        <p className="text-charcoal-600 dark:text-charcoal-400 mb-4 line-clamp-2 text-sm">
                          {restaurant.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-charcoal-500 dark:text-charcoal-400">
                          <div className="flex items-center space-x-1">
                            <FiClock className="w-3 h-3" />
                            <span>{restaurant.deliveryTime} min</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(restaurant.deliveryCharge)}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
              {restaurants.length > 0 && (
                <div className="mt-8 text-center md:hidden">
                  <Link
                    to="/restaurants"
                    className="btn-primary inline-flex items-center space-x-2"
                  >
                    <span>View All Restaurants</span>
                    <FiArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;

