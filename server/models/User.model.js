import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian phone number'],
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'restaurant_manager'],
      default: 'user',
    },
    wallet: {
      type: Number,
      default: 0,
      min: 0,
    },
    addresses: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: {
          type: String,
          required: true,
          match: [/^\d{6}$/, 'Pincode must be 6 digits'],
        },
        landmark: { type: String },
        isDefault: { type: Boolean, default: false },
      },
    ],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    favorites: {
      dishes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dish',
      }],
      restaurants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
      }],
    },
    searchHistory: [{
      query: String,
      timestamp: { type: Date, default: Date.now },
    }],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;

