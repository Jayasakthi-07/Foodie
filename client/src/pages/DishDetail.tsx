import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatCurrency';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';
import { FiStar, FiPlus, FiMinus, FiShoppingCart } from 'react-icons/fi';

interface Dish {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images: string[];
  isVeg: boolean;
  rating: number;
  addOns: { name: string; price: number }[];
  restaurant: {
    _id: string;
    name: string;
  };
}

const DishDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const [dish, setDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<{ name: string; price: number }[]>([]);

  useEffect(() => {
    const fetchDish = async () => {
      try {
        const response = await api.get(`/dishes/${id}`);
        setDish(response.data.data.dish);
      } catch (error) {
        console.error('Error fetching dish:', error);
        toast.error('Dish not found');
        navigate('/menu');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDish();
    }
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (!dish) return;

    addItem({
      dish: dish._id,
      name: dish.name,
      price: dish.price,
      quantity,
      image: dish.image,
      addOns: selectedAddOns,
      restaurant: dish.restaurant._id,
      restaurantName: dish.restaurant.name,
    });

    toast.success('Added to cart!');
    navigate('/cart');
  };

  const toggleAddOn = (addOn: { name: string; price: number }) => {
    setSelectedAddOns((prev) => {
      const exists = prev.find((a) => a.name === addOn.name);
      if (exists) {
        return prev.filter((a) => a.name !== addOn.name);
      }
      return [...prev, addOn];
    });
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-saffron-500"></div>
      </div>
    );
  }

  if (!dish) {
    return null;
  }

  const totalPrice = (dish.price + selectedAddOns.reduce((sum, a) => sum + a.price, 0)) * quantity;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <img
              src={dish.image || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800'}
              alt={dish.name}
              className="w-full h-96 object-cover rounded-xl"
            />
            <div className="absolute top-4 left-4">
              {dish.isVeg ? (
                <span className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                  VEG
                </span>
              ) : (
                <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                  NON-VEG
                </span>
              )}
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-4xl font-bold mb-2">{dish.name}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  <FiStar className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold">{dish.rating.toFixed(1)}</span>
                </div>
              </div>
              <p className="text-charcoal-600 dark:text-charcoal-400 text-lg">{dish.description}</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">
                {formatCurrency(dish.price)}
              </h2>
            </div>

            {/* Add-ons */}
            {dish.addOns && dish.addOns.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Add-ons</h3>
                <div className="space-y-2">
                  {dish.addOns.map((addOn) => (
                    <label
                      key={addOn.name}
                      className="flex items-center justify-between p-3 border-2 border-charcoal-200 dark:border-charcoal-700 rounded-lg cursor-pointer hover:border-saffron-500 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedAddOns.some((a) => a.name === addOn.name)}
                          onChange={() => toggleAddOn(addOn)}
                          className="w-5 h-5 text-saffron-500 rounded"
                        />
                        <span>{addOn.name}</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(addOn.price)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Quantity</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border-2 border-charcoal-300 dark:border-charcoal-600 flex items-center justify-center hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
                >
                  <FiMinus className="w-5 h-5" />
                </button>
                <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border-2 border-charcoal-300 dark:border-charcoal-600 flex items-center justify-center hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
                >
                  <FiPlus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="p-4 bg-charcoal-50 dark:bg-charcoal-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold text-saffron-600">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button onClick={handleAddToCart} className="btn-primary w-full flex items-center justify-center space-x-2">
              <FiShoppingCart className="w-5 h-5" />
              <span>Add to Cart</span>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DishDetail;

