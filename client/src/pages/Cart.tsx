import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { formatCurrency, formatCurrencyWithDecimals } from '../utils/formatCurrency';
import { FiPlus, FiMinus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Cart = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getSubtotal, clearCart, getItemsByRestaurant } = useCartStore();

  const calculateGST = (subtotal: number) => {
    return Math.round(subtotal * 0.18 * 100) / 100;
  };

  const itemsByRestaurant = getItemsByRestaurant();
  const subtotal = getSubtotal();
  const gst = calculateGST(subtotal);
  // Delivery charge per restaurant (30 per restaurant)
  const deliveryCharge = Object.keys(itemsByRestaurant).length * 30;
  const total = subtotal + gst + deliveryCharge;

  if (items.length === 0) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center">
        <div className="text-center">
          <FiShoppingBag className="w-24 h-24 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-charcoal-600 dark:text-charcoal-400 mb-6">
            Add some delicious dishes to get started!
          </p>
          <Link to="/menu" className="btn-primary">
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(itemsByRestaurant).map(([restaurantId, restaurantItems], restaurantIndex) => {
              const restaurantName = restaurantItems[0]?.restaurantName || 'Restaurant';
              const restaurantSubtotal = restaurantItems.reduce((sum, item) => {
                const itemSubtotal = item.price * item.quantity;
                const addOnsTotal = item.addOns.reduce((addSum, addon) => addSum + addon.price, 0) * item.quantity;
                return sum + itemSubtotal + addOnsTotal;
              }, 0);
              
              return (
                <div key={restaurantId} className="space-y-4">
                  <div className="border-b border-charcoal-200 dark:border-charcoal-700 pb-2">
                    <h2 className="text-xl font-bold text-saffron-600">{restaurantName}</h2>
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                      Subtotal: {formatCurrency(restaurantSubtotal)}
                    </p>
                  </div>
                  {restaurantItems.map((item, index) => (
                    <motion.div
                      key={`${item.dish}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (restaurantIndex * 0.1) + (index * 0.05) }}
                      className="card p-4"
                    >
                      <div className="flex gap-4">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800'}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-grow">
                          <h3 className="text-lg font-semibold mb-1">{item.name}</h3>
                          {item.addOns.length > 0 && (
                            <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-2">
                              Add-ons: {item.addOns.map((a) => a.name).join(', ')}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => updateQuantity(item.dish, item.quantity - 1)}
                                className="w-8 h-8 rounded-lg border-2 border-charcoal-300 dark:border-charcoal-600 flex items-center justify-center hover:bg-charcoal-100 dark:hover:bg-charcoal-800"
                              >
                                <FiMinus className="w-4 h-4" />
                              </button>
                              <span className="font-semibold w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.dish, item.quantity + 1)}
                                className="w-8 h-8 rounded-lg border-2 border-charcoal-300 dark:border-charcoal-600 flex items-center justify-center hover:bg-charcoal-100 dark:hover:bg-charcoal-800"
                              >
                                <FiPlus className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="text-lg font-bold">
                                {formatCurrency((item.price + item.addOns.reduce((sum, a) => sum + a.price, 0)) * item.quantity)}
                              </span>
                              <button
                                onClick={() => {
                                  removeItem(item.dish);
                                  toast.success('Item removed from cart');
                                }}
                                className="text-red-500 hover:text-red-700 p-2"
                              >
                                <FiTrash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatCurrencyWithDecimals(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span className="font-semibold">{formatCurrencyWithDecimals(gst)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge ({Object.keys(itemsByRestaurant).length} {Object.keys(itemsByRestaurant).length === 1 ? 'restaurant' : 'restaurants'})</span>
                  <span className="font-semibold">{formatCurrency(deliveryCharge)}</span>
                </div>
                <div className="border-t border-charcoal-200 dark:border-charcoal-700 pt-3 flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-saffron-600">{formatCurrencyWithDecimals(total)}</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="btn-primary w-full mb-4"
              >
                Proceed to Checkout
              </button>
              <Link
                to="/menu"
                className="block text-center text-saffron-600 dark:text-saffron-400 hover:underline"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

