import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatCurrency';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';
import { FiSearch, FiFilter, FiStar, FiClock, FiShoppingCart } from 'react-icons/fi';

interface Dish {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isVeg: boolean;
  rating: number;
  restaurant: {
    _id: string;
    name: string;
  };
  category: {
    _id: string;
    name: string;
  };
}

interface Category {
  _id: string;
  name: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const Menu = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedRestaurant, setSelectedRestaurant] = useState(searchParams.get('restaurant') || '');
  const [isVeg, setIsVeg] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const { addItem } = useCartStore();

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [selectedCategory, selectedRestaurant, search, isVeg, sortBy, sortOrder, priceRange]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dishesRes, categoriesRes] = await Promise.all([
          api.get('/dishes', {
            params: {
              restaurant: selectedRestaurant || undefined,
              category: selectedCategory || undefined,
              search: search || undefined,
              isVeg: isVeg !== undefined ? isVeg.toString() : undefined,
              sortBy,
              sortOrder,
              minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
              maxPrice: priceRange[1] < 2000 ? priceRange[1] : undefined,
              page: currentPage,
              limit: 20,
            },
          }),
          api.get('/dishes/categories'),
        ]);

        setDishes(dishesRes.data.data.dishes);
        setCategories(categoriesRes.data.data.categories);
        if (dishesRes.data.data.pagination) {
          setPagination(dishesRes.data.data.pagination);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, selectedRestaurant, search, isVeg, sortBy, sortOrder, priceRange, currentPage]);

  const handleAddToCart = (e: React.MouseEvent, dish: Dish) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      dish: dish._id,
      name: dish.name,
      price: dish.price,
      quantity: 1,
      image: dish.image,
      addOns: [],
      restaurant: dish.restaurant._id,
      restaurantName: dish.restaurant.name,
    });

    toast.success(`${dish.name} added to cart!`);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Our Menu</h1>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes..."
              className="input-field pl-10 w-full md:w-96"
            />
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-charcoal-100 dark:bg-charcoal-800 hover:bg-charcoal-200 dark:hover:bg-charcoal-700 transition-colors"
            >
              <FiFilter className="w-5 h-5" />
              <span>Advanced Filters</span>
            </button>

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field text-sm"
              >
                <option value="createdAt">Newest</option>
                <option value="price">Price</option>
                <option value="rating">Rating</option>
                <option value="name">Name</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 rounded-lg bg-charcoal-100 dark:bg-charcoal-800 hover:bg-charcoal-200 dark:hover:bg-charcoal-700"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="card p-6 space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Filters</h3>
                <button
                  onClick={() => {
                    setIsVeg(undefined);
                    setPriceRange([0, 2000]);
                  }}
                  className="text-sm text-saffron-600 hover:text-saffron-700"
                >
                  Clear All
                </button>
              </div>

              {/* Veg/Non-Veg Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsVeg(undefined)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isVeg === undefined
                        ? 'bg-saffron-500 text-white'
                        : 'bg-charcoal-100 dark:bg-charcoal-800'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setIsVeg(true)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isVeg === true
                        ? 'bg-saffron-500 text-white'
                        : 'bg-charcoal-100 dark:bg-charcoal-800'
                    }`}
                  >
                    Veg
                  </button>
                  <button
                    onClick={() => setIsVeg(false)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isVeg === false
                        ? 'bg-saffron-500 text-white'
                        : 'bg-charcoal-100 dark:bg-charcoal-800'
                    }`}
                  >
                    Non-Veg
                  </button>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="flex-1"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === ''
                  ? 'bg-saffron-500 text-white'
                  : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => setSelectedCategory(category._id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category._id
                    ? 'bg-saffron-500 text-white'
                    : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dishes Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-saffron-500"></div>
          </div>
        ) : dishes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-charcoal-600 dark:text-charcoal-400 text-lg">No dishes found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {dishes.map((dish, index) => (
              <motion.div
                key={dish._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card group"
              >
                <Link to={`/dish/${dish._id}`} className="block">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={dish.image || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800'}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2">
                      {dish.isVeg ? (
                        <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                          VEG
                        </span>
                      ) : (
                        <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                          NON-VEG
                        </span>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 bg-white dark:bg-charcoal-800 px-2 py-1 rounded flex items-center space-x-1">
                      <FiStar className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-semibold">{dish.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold mb-1 line-clamp-1">{dish.name}</h3>
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-2 line-clamp-2">
                      {dish.description}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-saffron-600">
                        {formatCurrency(dish.price)}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="px-4 pb-4">
                  <button
                    onClick={(e) => handleAddToCart(e, dish)}
                    className="w-full bg-saffron-500 hover:bg-saffron-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <FiShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-2 flex-wrap gap-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPage === 1
                  ? 'bg-charcoal-200 dark:bg-charcoal-700 text-charcoal-400 cursor-not-allowed'
                  : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-200 dark:hover:bg-charcoal-700'
              }`}
            >
              « prev
            </button>

            {/* Page Numbers */}
            {(() => {
              const pages: (number | string)[] = [];
              const totalPages = pagination.pages;
              const current = currentPage;

              // Always show first page
              if (totalPages > 0) {
                pages.push(1);
              }

              // Calculate start and end of page range
              let start = Math.max(2, current - 2);
              let end = Math.min(totalPages - 1, current + 2);

              // Adjust if we're near the start
              if (current <= 4) {
                end = Math.min(6, totalPages - 1);
              }

              // Adjust if we're near the end
              if (current >= totalPages - 3) {
                start = Math.max(2, totalPages - 5);
              }

              // Add ellipsis after first page if needed
              if (start > 2) {
                pages.push('...');
              }

              // Add page numbers in range
              for (let i = start; i <= end; i++) {
                if (i !== 1 && i !== totalPages) {
                  pages.push(i);
                }
              }

              // Add ellipsis before last page if needed
              if (end < totalPages - 1) {
                pages.push('...');
              }

              // Always show last page
              if (totalPages > 1) {
                pages.push(totalPages);
              }

              return pages.map((page, index) => {
                if (page === '...') {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-2 py-2 text-charcoal-500 dark:text-charcoal-400"
                    >
                      ...
                    </span>
                  );
                }

                const pageNum = page as number;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-charcoal-800 dark:bg-charcoal-600 text-white'
                        : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-200 dark:hover:bg-charcoal-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              });
            })()}

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(pagination.pages, prev + 1))}
              disabled={currentPage === pagination.pages}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPage === pagination.pages
                  ? 'bg-charcoal-200 dark:bg-charcoal-700 text-charcoal-400 cursor-not-allowed'
                  : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-200 dark:hover:bg-charcoal-700'
              }`}
            >
              next »
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;

