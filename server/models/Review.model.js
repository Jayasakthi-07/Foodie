import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dish: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dish',
      required: false,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: false,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: false,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    images: [{
      type: String,
    }],
    isVerified: {
      type: Boolean,
      default: false, // Verified if user actually ordered
    },
  },
  {
    timestamps: true,
  }
);

// Ensure user can only review dishes/restaurants they ordered
reviewSchema.index({ user: 1, dish: 1 });
reviewSchema.index({ user: 1, restaurant: 1 });
reviewSchema.index({ dish: 1 });
reviewSchema.index({ restaurant: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;

