import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  hostelName: {
    type: String,
    required: [true, 'Hostel name is required'],
    trim: true,
  },
  unlockTokens: {
    type: Number,
    default: 2, // Every new user gets 2 free unlock tokens
  },
  totalUnlocks: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  verifiedSeller: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

export default User;
