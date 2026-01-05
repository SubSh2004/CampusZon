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
  tokensUsed: {
    type: Number,
    default: 1 // 1 token per unlock
  },
  wasFreeToken: {
    type: Boolean,
    default: false
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
