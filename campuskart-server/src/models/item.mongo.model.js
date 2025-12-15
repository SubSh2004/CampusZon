import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String, default: null },
  available: { type: Boolean, default: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userPhone: { type: String, required: true },
  userHostel: { type: String, required: true },
  userEmail: { type: String, required: true },
  emailDomain: { type: String, required: true },
  originalPostgresId: { type: Number, index: true, sparse: true },
  
  // Interest tracking
  interestedUsers: [{
    userId: { type: String, required: true },
    userName: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Analytics
  viewCount: { type: Number, default: 0 },
  unlockCount: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Index for faster queries by emailDomain and createdAt
itemSchema.index({ emailDomain: 1, createdAt: -1 });

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);

export default Item;
