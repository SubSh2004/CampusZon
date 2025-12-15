import mongoose from 'mongoose';

const unlockSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
    index: true
  },
  sellerId: {
    type: String,
    required: true,
    index: true
  },
  tier: {
    type: String,
    enum: ['basic', 'premium'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  isFreeCredit: {
    type: Boolean,
    default: false
  },
  paymentId: {
    type: String,
    default: null
  },
  messageCount: {
    type: Number,
    default: 0
  },
  messageLimit: {
    type: Number,
    default: 20 // Basic tier limit - COMBINED total for both users
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for faster queries
unlockSchema.index({ userId: 1, itemId: 1 });
unlockSchema.index({ sellerId: 1, createdAt: -1 });

const Unlock = mongoose.model('Unlock', unlockSchema);

export default Unlock;
