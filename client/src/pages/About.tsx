import { motion } from 'framer-motion';
import { FiHeart, FiUsers, FiAward, FiTruck } from 'react-icons/fi';

const About = () => {
  const features = [
    {
      icon: FiHeart,
      title: 'Authentic Recipes',
      description: 'Traditional South Indian recipes passed down through generations',
    },
    {
      icon: FiUsers,
      title: 'Expert Chefs',
      description: 'Experienced chefs from South India bringing authentic flavors',
    },
    {
      icon: FiAward,
      title: 'Premium Quality',
      description: 'Only the finest ingredients sourced fresh daily',
    },
    {
      icon: FiTruck,
      title: 'Fast Delivery',
      description: 'Quick and reliable delivery to your doorstep',
    },
  ];

  const stats = [
    { number: '400+', label: 'Dishes' },
    { number: '10', label: 'Restaurants' },
    { number: '50+', label: 'Happy Customers' },
    { number: '1000+', label: 'Orders Delivered' },
  ];

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
            <h1 className="text-4xl md:text-6xl font-bold mb-6">About Foodie</h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
              Bringing authentic South Indian cuisine to your doorstep with love, tradition, and premium quality
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-white dark:bg-charcoal-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <p className="text-lg text-charcoal-600 dark:text-charcoal-400 mb-4">
                Foodie was born from a passion for authentic South Indian cuisine. We believe that food is not just
                sustenance, but a celebration of culture, tradition, and community.
              </p>
              <p className="text-lg text-charcoal-600 dark:text-charcoal-400 mb-4">
                Our journey began with a simple mission: to make the rich, diverse flavors of South India accessible
                to everyone, right from the comfort of their homes. From the crispy dosas of Tamil Nadu to the spicy
                curries of Andhra, we bring you the best of South Indian culinary heritage.
              </p>
              <p className="text-lg text-charcoal-600 dark:text-charcoal-400">
                Every dish is prepared with care, using traditional recipes and the finest ingredients. We work with
                experienced chefs who bring years of expertise and authentic techniques to every meal.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800"
                alt="South Indian cuisine"
                className="rounded-xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-charcoal-50 dark:bg-charcoal-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: '#FF8000' }}>{stat.number}</div>
                <div className="text-charcoal-600 dark:text-charcoal-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Foodie?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="card p-6 text-center"
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(255, 128, 0, 0.1)' }}>
                    <Icon className="w-8 h-8" style={{ color: '#FF8000' }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-charcoal-600 dark:text-charcoal-400">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 dark:bg-charcoal-800" style={{ background: 'linear-gradient(to bottom right, rgba(255, 128, 0, 0.1), rgba(255, 128, 0, 0.15))' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-charcoal-700 dark:text-charcoal-300 mb-4">
              To preserve and share the rich culinary heritage of South India while making it accessible, convenient,
              and delightful for modern food lovers.
            </p>
            <p className="text-lg text-charcoal-700 dark:text-charcoal-300">
              We are committed to quality, authenticity, and customer satisfaction. Every order is a promise of
              delicious, traditional South Indian food delivered with care and love.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;

