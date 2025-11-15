import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useThemeStore } from '../../store/themeStore';
import { FiShoppingCart, FiUser, FiLogOut, FiSun, FiMoon, FiMenu, FiX, FiAlertCircle } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatCurrency';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { getTotalItems, getSubtotal } = useCartStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setIsUserMenuOpen(false);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/');
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const cartItems = getTotalItems();
  const cartTotal = getSubtotal();

  return (
    <nav className="sticky top-0 z-50 glass border-b border-charcoal-200 dark:border-charcoal-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center animated-gradient">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="text-2xl font-bold animated-gradient-text">
              Foodie
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-charcoal-700 dark:text-charcoal-200 transition-colors font-medium hover:text-orange-500 dark:hover:text-orange-400"
            >
              Home
            </Link>
            <Link
              to="/menu"
              className="text-charcoal-700 dark:text-charcoal-200 transition-colors font-medium hover:text-orange-500 dark:hover:text-orange-400"
            >
              Menu
            </Link>
            <Link
              to="/about"
              className="text-charcoal-700 dark:text-charcoal-200 transition-colors font-medium hover:text-orange-500 dark:hover:text-orange-400"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-charcoal-700 dark:text-charcoal-200 transition-colors font-medium hover:text-orange-500 dark:hover:text-orange-400"
            >
              Contact
            </Link>
            {isAuthenticated && (
              <Link
                to="/orders"
                className="text-charcoal-700 dark:text-charcoal-200 transition-colors font-medium hover:text-orange-500 dark:hover:text-orange-400"
              >
                Orders
              </Link>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <FiSun className="w-5 h-5 text-charcoal-700 dark:text-charcoal-200" />
              ) : (
                <FiMoon className="w-5 h-5 text-charcoal-700 dark:text-charcoal-200" />
              )}
            </button>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
            >
              <FiShoppingCart className="w-5 h-5 text-charcoal-700 dark:text-charcoal-200" />
              {cartItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                  style={{ backgroundColor: '#FF8000' }}
                >
                  {cartItems}
                </motion.span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
                >
                  <FiUser className="w-5 h-5 text-charcoal-700 dark:text-charcoal-200" />
                  <span className="hidden sm:block text-charcoal-700 dark:text-charcoal-200 font-medium">
                    {user?.name}
                  </span>
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-charcoal-800 rounded-lg shadow-xl border border-charcoal-200 dark:border-charcoal-700 overflow-hidden"
                    >
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-3 text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-700 transition-colors"
                      >
                        Profile
                      </Link>
                      {user?.role === 'admin' || user?.role === 'restaurant_manager' ? (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-3 text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-700 transition-colors"
                        >
                          Admin Dashboard
                        </Link>
                      ) : null}
                      <button
                        onClick={handleLogoutClick}
                        className="w-full text-left px-4 py-3 text-red-600 dark:text-red-400 hover:bg-charcoal-100 dark:hover:bg-charcoal-700 transition-colors flex items-center space-x-2"
                      >
                        <FiLogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn-primary text-sm py-2 px-4"
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
            >
              {isMenuOpen ? (
                <FiX className="w-5 h-5 text-charcoal-700 dark:text-charcoal-200" />
              ) : (
                <FiMenu className="w-5 h-5 text-charcoal-700 dark:text-charcoal-200" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-charcoal-200 dark:border-charcoal-700"
            >
              <div className="py-4 space-y-2">
                <Link
                  to="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 rounded-lg"
                >
                  Home
                </Link>
                <Link
                  to="/menu"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 rounded-lg"
                >
                  Menu
                </Link>
                <Link
                  to="/about"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 rounded-lg"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 rounded-lg"
                >
                  Contact
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      to="/orders"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-2 text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 rounded-lg"
                    >
                      Orders
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-2 text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 rounded-lg"
                    >
                      Profile
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleLogoutCancel}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            >
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-charcoal-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-charcoal-200 dark:border-charcoal-700"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <FiAlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-charcoal-900 dark:text-charcoal-100">
                      Confirm Logout
                    </h3>
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                      Are you sure you want to logout?
                    </p>
                  </div>
                </div>

                <p className="text-charcoal-700 dark:text-charcoal-300 mb-6">
                  You will need to login again to access your account and place orders.
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={handleLogoutCancel}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-charcoal-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogoutConfirm}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors font-medium flex items-center justify-center space-x-2"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

