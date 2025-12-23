import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Ensure a user has only one cart
cartSchema.index({ userId: 1 }, { unique: true });

// Remove duplicate items
cartSchema.pre('save', function(next) {
  const seen = new Set();
  this.items = this.items.filter(item => {
    const id = item.itemId.toString();
    if (seen.has(id)) {
      return false;
    }
    seen.add(id);
    return true;
  });
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
