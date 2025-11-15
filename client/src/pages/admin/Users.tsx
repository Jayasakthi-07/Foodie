import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import { FiEdit, FiSearch, FiFilter, FiUser, FiMail, FiPhone, FiShoppingBag } from 'react-icons/fi';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin' | 'restaurant_manager';
  wallet: number;
  isEmailVerified: boolean;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user' as 'user' | 'admin' | 'restaurant_manager',
    wallet: 0,
    isEmailVerified: false,
  });

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users', {
        params: {
          page: currentPage,
          limit: 20,
          role: roleFilter || undefined,
          search: search || undefined,
        },
      });
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      wallet: user.wallet,
      isEmailVerified: user.isEmailVerified,
    });
  };

  const handleUpdate = async () => {
    if (!editingUser) return;

    try {
      await api.put(`/admin/users/${editingUser._id}`, editForm);
      toast.success('User updated successfully');
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditForm({
      name: '',
      email: '',
      phone: '',
      role: 'user',
      wallet: 0,
      isEmailVerified: false,
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'restaurant_manager':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">User Management</h1>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, email, or phone..."
                className="input-field pl-10 w-full"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center space-x-2">
              <FiFilter className="w-5 h-5 text-charcoal-400" />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-field"
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="restaurant_manager">Restaurant Manager</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-saffron-500"></div>
          </div>
        ) : (
          <>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-charcoal-50 dark:bg-charcoal-800">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold">User</th>
                      <th className="text-left py-4 px-6 font-semibold">Contact</th>
                      <th className="text-left py-4 px-6 font-semibold">Role</th>
                      <th className="text-right py-4 px-6 font-semibold">Wallet</th>
                      <th className="text-right py-4 px-6 font-semibold">Orders</th>
                      <th className="text-right py-4 px-6 font-semibold">Total Spent</th>
                      <th className="text-center py-4 px-6 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-charcoal-100 dark:border-charcoal-800 hover:bg-charcoal-50 dark:hover:bg-charcoal-800/50"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-saffron-100 dark:bg-saffron-900/30 flex items-center justify-center">
                              <FiUser className="w-5 h-5 text-saffron-600 dark:text-saffron-400" />
                            </div>
                            <div>
                              <div className="font-semibold">{user.name}</div>
                              <div className="text-sm text-charcoal-600 dark:text-charcoal-400">
                                {user.isEmailVerified ? (
                                  <span className="text-green-600 dark:text-green-400">✓ Verified</span>
                                ) : (
                                  <span className="text-yellow-600 dark:text-yellow-400">Unverified</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm">
                              <FiMail className="w-4 h-4 text-charcoal-400" />
                              <span>{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center space-x-2 text-sm text-charcoal-600 dark:text-charcoal-400">
                                <FiPhone className="w-4 h-4" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                            {user.role === 'restaurant_manager' ? 'Manager' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="text-right py-4 px-6">
                          <span className="font-semibold text-green-600">{formatCurrency(user.wallet)}</span>
                        </td>
                        <td className="text-right py-4 px-6">
                          <div className="flex items-center justify-end space-x-1">
                            <FiShoppingBag className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold">{user.orderCount}</span>
                          </div>
                        </td>
                        <td className="text-right py-4 px-6">
                          <span className="font-semibold text-saffron-600">{formatCurrency(user.totalSpent)}</span>
                        </td>
                        <td className="text-center py-4 px-6">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-saffron-600 hover:bg-saffron-50 dark:hover:bg-saffron-900/20 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <FiEdit className="w-5 h-5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-6 flex justify-center items-center space-x-2 flex-wrap gap-2">
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

                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

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
                })}

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
          </>
        )}

        {/* Edit Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">Edit User</h2>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-charcoal-700 dark:text-charcoal-300">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-charcoal-700 dark:text-charcoal-300">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="input-field w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-charcoal-700 dark:text-charcoal-300">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-charcoal-700 dark:text-charcoal-300">
                        Role
                      </label>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                        className="input-field w-full"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="restaurant_manager">Restaurant Manager</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-charcoal-700 dark:text-charcoal-300">
                      Wallet Balance
                    </label>
                    <input
                      type="number"
                      value={editForm.wallet}
                      onChange={(e) => setEditForm({ ...editForm, wallet: parseFloat(e.target.value) || 0 })}
                      className="input-field w-full"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-charcoal-50 dark:bg-charcoal-700/50 rounded-lg">
                    <input
                      type="checkbox"
                      id="isEmailVerified"
                      checked={editForm.isEmailVerified}
                      onChange={(e) => setEditForm({ ...editForm, isEmailVerified: e.target.checked })}
                      className="w-5 h-5 text-saffron-600 border-charcoal-300 rounded focus:ring-saffron-500 focus:ring-2"
                    />
                    <label htmlFor="isEmailVerified" className="text-sm font-medium text-charcoal-700 dark:text-charcoal-300 cursor-pointer">
                      Email Verified
                    </label>
                  </div>

                  <div className="flex space-x-4 pt-4 border-t border-charcoal-200 dark:border-charcoal-700">
                    <button 
                      onClick={handleUpdate} 
                      className="btn-primary flex-1 py-3"
                    >
                      Update User
                    </button>
                    <button 
                      onClick={handleCancel} 
                      className="btn-secondary flex-1 py-3"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;

