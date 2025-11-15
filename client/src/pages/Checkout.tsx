import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import { formatCurrency, formatCurrencyWithDecimals } from '../utils/formatCurrency';
import toast from 'react-hot-toast';
import { FiMapPin, FiCreditCard, FiDollarSign } from 'react-icons/fi';

const addressSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  landmark: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart, getItemsByRestaurant } = useCartStore();
  const { user } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet' | 'card' | 'upi'>('cash');
  const [loading, setLoading] = useState(false);
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  
  const itemsByRestaurant = getItemsByRestaurant();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  useEffect(() => {
    if (user?.addresses) {
      setUserAddresses(user.addresses);
      const defaultAddress = user.addresses.find((a: any) => a.isDefault);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress._id);
        reset(defaultAddress);
      }
    }
  }, [user, reset]);

  const calculateGST = (subtotal: number) => {
    return Math.round(subtotal * 0.18 * 100) / 100;
  };

  const subtotal = getSubtotal();
  const gst = calculateGST(subtotal);
  // Delivery charge per restaurant (30 per restaurant)
  const deliveryCharge = Object.keys(itemsByRestaurant).length * 30;
  const total = subtotal + gst + deliveryCharge;

  const onSubmit = async (data: AddressFormData) => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      // Group items by restaurant and create separate orders
      // For wallet payments, we need to check balance first
      if (paymentMethod === 'wallet' && user) {
        if (user.wallet < total) {
          toast.error('Insufficient wallet balance');
          setLoading(false);
          return;
        }
      }

      const orderPromises = Object.entries(itemsByRestaurant).map(async ([restaurantId, restaurantItems]) => {
        const orderItems = restaurantItems.map((item) => ({
          dish: item.dish,
          quantity: item.quantity,
          addOns: item.addOns,
        }));

        return api.post('/orders', {
          items: orderItems,
          deliveryAddress: data,
          paymentMethod,
        });
      });

      const responses = await Promise.allSettled(orderPromises);
      
      // Check if all orders succeeded
      const successfulOrders = responses.filter((r) => r.status === 'fulfilled');
      const failedOrders = responses.filter((r) => r.status === 'rejected');
      
      if (failedOrders.length > 0) {
        // Some orders failed - show error but don't clear cart
        toast.error(`${failedOrders.length} order(s) failed. Please try again.`);
        if (successfulOrders.length > 0) {
          toast.success(`${successfulOrders.length} order(s) placed successfully`);
        }
        setLoading(false);
        return;
      }

      clearCart();
      
      if (responses.length === 1) {
        toast.success('Order placed successfully!');
        navigate(`/order/${(responses[0] as PromiseFulfilledResult<any>).value.data.data.order._id}`);
      } else {
        toast.success(`${responses.length} orders placed successfully!`);
        // Navigate to orders page to show all orders
        navigate('/orders');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <button onClick={() => navigate('/menu')} className="btn-primary">
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Address & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Saved Addresses */}
            {userAddresses.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">Saved Addresses</h2>
                <div className="space-y-2">
                  {userAddresses.map((address: any) => (
                    <label
                      key={address._id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedAddress === address._id
                          ? 'border-saffron-500 bg-saffron-50 dark:bg-saffron-900/20'
                          : 'border-charcoal-200 dark:border-charcoal-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address._id}
                        checked={selectedAddress === address._id}
                        onChange={() => {
                          setSelectedAddress(address._id);
                          reset(address);
                        }}
                        className="sr-only"
                      />
                      <div>
                        <div className="font-semibold">{address.name}</div>
                        <div className="text-sm text-charcoal-600 dark:text-charcoal-400">
                          {address.addressLine1}, {address.city}, {address.state} - {address.pincode}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* New Address Form */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <FiMapPin className="w-5 h-5" />
                <span>Delivery Address</span>
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <input {...register('name')} className="input-field" />
                    {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input {...register('phone')} className="input-field" />
                    {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Address Line 1</label>
                  <input {...register('addressLine1')} className="input-field" />
                  {errors.addressLine1 && <p className="text-red-600 text-sm mt-1">{errors.addressLine1.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Address Line 2 (Optional)</label>
                  <input {...register('addressLine2')} className="input-field" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">City</label>
                    <input {...register('city')} className="input-field" />
                    {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">State</label>
                    <input {...register('state')} className="input-field" />
                    {errors.state && <p className="text-red-600 text-sm mt-1">{errors.state.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Pincode</label>
                    <input {...register('pincode')} className="input-field" />
                    {errors.pincode && <p className="text-red-600 text-sm mt-1">{errors.pincode.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Landmark (Optional)</label>
                  <input {...register('landmark')} className="input-field" />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <FiCreditCard className="w-5 h-5" />
                <span>Payment Method</span>
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    paymentMethod === 'cash'
                      ? 'border-saffron-500 bg-saffron-50 dark:bg-saffron-900/20'
                      : 'border-charcoal-200 dark:border-charcoal-700'
                  }`}
                >
                  Cash on Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  disabled={!user || user.wallet < total}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    paymentMethod === 'wallet'
                      ? 'border-saffron-500 bg-saffron-50 dark:bg-saffron-900/20'
                      : 'border-charcoal-200 dark:border-charcoal-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center space-x-2 justify-center">
                    <FiDollarSign className="w-5 h-5" />
                    <span>Wallet</span>
                  </div>
                  {user && <div className="text-sm mt-1">Balance: {formatCurrency(user.wallet)}</div>}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrencyWithDecimals(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span>{formatCurrencyWithDecimals(gst)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery ({Object.keys(itemsByRestaurant).length} {Object.keys(itemsByRestaurant).length === 1 ? 'restaurant' : 'restaurants'})</span>
                  <span>{formatCurrency(deliveryCharge)}</span>
                </div>
                <div className="border-t border-charcoal-200 dark:border-charcoal-700 pt-3 flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-saffron-600">{formatCurrencyWithDecimals(total)}</span>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;

