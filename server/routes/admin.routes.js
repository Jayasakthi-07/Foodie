import express from 'express';
import {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  createCategory,
  updateCategory,
  deleteCategory,
  createPromoCode,
  getAllPromoCodes,
  updatePromoCode,
  exportOrders,
  exportUsers,
  getAdvancedAnalytics,
  getAllUsers,
  updateUser,
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin', 'restaurant_manager'));

router.get('/dashboard', getDashboardStats);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.get('/export/orders', exportOrders);
router.get('/export/users', exportUsers);
router.get('/analytics/advanced', getAdvancedAnalytics);

router.post('/categories', uploadSingle('image'), createCategory);
router.put('/categories/:id', uploadSingle('image'), updateCategory);
router.delete('/categories/:id', deleteCategory);

router.post('/promo-codes', createPromoCode);
router.get('/promo-codes', getAllPromoCodes);
router.put('/promo-codes/:id', updatePromoCode);

export default router;

