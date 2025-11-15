import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    cuisine: {
      type: String,
      default: 'South Indian',
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    deliveryTime: {
      type: Number,
      default: 30,
      min: 0,
    },
    deliveryCharge: {
      type: Number,
      default: 30,
      min: 0,
    },
    minimumOrder: {
      type: Number,
      default: 100,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    address: {
      addressLine1: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    },
    timings: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' },
    },
  },
  {
    timestamps: true,
  }
);

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;

