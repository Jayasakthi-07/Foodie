import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';

interface PromoCode {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
}

const AdminPromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const response = await api.get('/admin/promo-codes');
      setPromoCodes(response.data.data.promoCodes);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;
    try {
      await api.delete(`/admin/promo-codes/${id}`);
      toast.success('Promo code deleted successfully');
      fetchPromoCodes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete promo code');
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
          <h1 className="text-4xl font-bold">Promo Codes</h1>
          <button className="btn-primary flex items-center space-x-2">
            <FiPlus className="w-5 h-5" />
            <span>Add Promo Code</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promoCodes.map((promo, index) => (
            <motion.div
              key={promo._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-saffron-600">{promo.code}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    promo.isActive
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}
                >
                  {promo.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-4">
                {promo.description}
              </p>
              <div className="space-y-2 mb-4 text-sm">
                <div>
                  Discount:{' '}
                  <span className="font-semibold">
                    {promo.discountType === 'percentage'
                      ? `${promo.discountValue}%`
                      : formatCurrency(promo.discountValue)}
                  </span>
                </div>
                <div>Min Order: {formatCurrency(promo.minOrderAmount)}</div>
                {promo.maxDiscount && (
                  <div>Max Discount: {formatCurrency(promo.maxDiscount)}</div>
                )}
                <div>
                  Usage: {promo.usedCount}
                  {promo.usageLimit && ` / ${promo.usageLimit}`}
                </div>
                <div className="text-xs text-charcoal-500 dark:text-charcoal-500">
                  Valid until: {new Date(promo.validUntil).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 btn-outline flex items-center justify-center space-x-2">
                  <FiEdit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(promo._id)}
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

export default AdminPromoCodes;

