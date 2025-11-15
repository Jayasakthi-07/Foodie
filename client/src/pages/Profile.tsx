import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatCurrency';
import toast from 'react-hot-toast';
import { FiUser, FiPhone, FiMapPin, FiPlus, FiEdit, FiTrash2, FiDollarSign } from 'react-icons/fi';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number').optional().or(z.literal('')),
});

const addressSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  landmark: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type AddressFormData = z.infer<typeof addressSchema>;

const Profile = () => {
  const { user, updateUser, checkAuth } = useAuthStore();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [walletAmount, setWalletAmount] = useState('');

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  });

  const {
    register: registerAddress,
    handleSubmit: handleAddressSubmit,
    formState: { errors: addressErrors },
    reset: resetAddress,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      await api.put('/user/profile', data);
      await checkAuth();
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const onAddressSubmit = async (data: AddressFormData) => {
    try {
      if (editingAddress) {
        await api.put(`/user/addresses/${editingAddress}`, data);
        toast.success('Address updated successfully');
      } else {
        await api.post('/user/addresses', data);
        toast.success('Address added successfully');
      }
      await checkAuth();
      setShowAddressForm(false);
      setEditingAddress(null);
      resetAddress();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.delete(`/user/addresses/${addressId}`);
      await checkAuth();
      toast.success('Address deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleAddWallet = async () => {
    const amount = parseFloat(walletAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      await api.post('/user/wallet/add', { amount });
      await checkAuth();
      toast.success('Wallet balance added successfully');
      setWalletAmount('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add wallet balance');
    }
  };

  const startEditAddress = (address: any) => {
    setEditingAddress(address._id);
    resetAddress(address);
    setShowAddressForm(true);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">My Profile</h1>

        {/* Profile Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 mb-6"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <FiUser className="w-6 h-6" />
            <span>Personal Information</span>
          </h2>
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input {...registerProfile('name')} className="input-field" />
              {profileErrors.name && (
                <p className="text-red-600 text-sm mt-1">{profileErrors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input-field bg-charcoal-100 dark:bg-charcoal-700 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input {...registerProfile('phone')} className="input-field" />
              {profileErrors.phone && (
                <p className="text-red-600 text-sm mt-1">{profileErrors.phone.message}</p>
              )}
            </div>
            <button type="submit" className="btn-primary">
              Update Profile
            </button>
          </form>
        </motion.div>

        {/* Wallet */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 mb-6"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <FiDollarSign className="w-6 h-6" />
            <span>Wallet</span>
          </h2>
          <div className="mb-4">
            <div className="text-3xl font-bold text-saffron-600 mb-2">
              {formatCurrency(user?.wallet || 0)}
            </div>
            <p className="text-charcoal-600 dark:text-charcoal-400">Available balance</p>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={walletAmount}
              onChange={(e) => setWalletAmount(e.target.value)}
              placeholder="Enter amount"
              className="input-field flex-grow"
            />
            <button onClick={handleAddWallet} className="btn-primary">
              Add Money
            </button>
          </div>
        </motion.div>

        {/* Addresses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center space-x-2">
              <FiMapPin className="w-6 h-6" />
              <span>Saved Addresses</span>
            </h2>
            <button
              onClick={() => {
                setShowAddressForm(!showAddressForm);
                setEditingAddress(null);
                resetAddress();
              }}
              className="btn-secondary flex items-center space-x-2"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Address</span>
            </button>
          </div>

          {showAddressForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-charcoal-50 dark:bg-charcoal-800 rounded-lg"
            >
              <form onSubmit={handleAddressSubmit(onAddressSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input {...registerAddress('name')} className="input-field" />
                    {addressErrors.name && (
                      <p className="text-red-600 text-sm mt-1">{addressErrors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input {...registerAddress('phone')} className="input-field" />
                    {addressErrors.phone && (
                      <p className="text-red-600 text-sm mt-1">{addressErrors.phone.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Address Line 1</label>
                  <input {...registerAddress('addressLine1')} className="input-field" />
                  {addressErrors.addressLine1 && (
                    <p className="text-red-600 text-sm mt-1">{addressErrors.addressLine1.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Address Line 2 (Optional)</label>
                  <input {...registerAddress('addressLine2')} className="input-field" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">City</label>
                    <input {...registerAddress('city')} className="input-field" />
                    {addressErrors.city && (
                      <p className="text-red-600 text-sm mt-1">{addressErrors.city.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">State</label>
                    <input {...registerAddress('state')} className="input-field" />
                    {addressErrors.state && (
                      <p className="text-red-600 text-sm mt-1">{addressErrors.state.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Pincode</label>
                    <input {...registerAddress('pincode')} className="input-field" />
                    {addressErrors.pincode && (
                      <p className="text-red-600 text-sm mt-1">{addressErrors.pincode.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary">
                    {editingAddress ? 'Update Address' : 'Save Address'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddress(null);
                      resetAddress();
                    }}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="space-y-4">
            {user?.addresses && user.addresses.length > 0 ? (
              user.addresses.map((address: any) => (
                <div
                  key={address._id}
                  className="p-4 border-2 border-charcoal-200 dark:border-charcoal-700 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      {address.isDefault && (
                        <span className="inline-block bg-saffron-500 text-white text-xs px-2 py-1 rounded mb-2">
                          Default
                        </span>
                      )}
                      <div className="font-semibold">{address.name}</div>
                      <div className="text-sm text-charcoal-600 dark:text-charcoal-400">
                        {address.addressLine1}
                        {address.addressLine2 && `, ${address.addressLine2}`}
                      </div>
                      <div className="text-sm text-charcoal-600 dark:text-charcoal-400">
                        {address.city}, {address.state} - {address.pincode}
                      </div>
                      {address.landmark && (
                        <div className="text-sm text-charcoal-500 dark:text-charcoal-500">
                          Landmark: {address.landmark}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditAddress(address)}
                        className="p-2 text-saffron-600 hover:bg-saffron-50 dark:hover:bg-saffron-900/20 rounded"
                      >
                        <FiEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address._id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-charcoal-600 dark:text-charcoal-400 text-center py-8">
                No saved addresses. Add one to get started!
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;

