import mongoose from 'mongoose';

const dishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Dish name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    image: {
      type: String,
      default: '',
    },
    images: [{
      type: String,
    }],
    spiceLevel: {
      type: Number,
      enum: [0, 1, 2, 3, 4, 5],
      default: 2,
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    addOns: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],
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
    preparationTime: {
      type: Number,
      default: 15,
      min: 0,
    },
    tags: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Index for search
dishSchema.index({ name: 'text', description: 'text' });
dishSchema.index({ restaurant: 1, category: 1, isAvailable: 1 });

const Dish = mongoose.model('Dish', dishSchema);

export default Dish;

