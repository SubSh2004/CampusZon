import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String, default: null }, // Keep for backward compatibility
  imageUrls: { type: [String], default: [] }, // Support multiple images (up to 5)
  available: { type: Boolean, default: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userPhone: { type: String, required: true },
  userHostel: { type: String, required: true },
  userEmail: { type: String, required: true },
  emailDomain: { type: String, required: true },
  
  // Interest tracking
  interestedUsers: [{
    userId: { type: String, required: true },
    userName: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Reports tracking
  reports: [{
    userId: { type: String, required: true },
    userName: { type: String },
    userEmail: { type: String },
    reason: { type: String },
    description: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  reportCount: { type: Number, default: 0 },
  
  // Reviews and ratings
  reviews: [{
    userId: { type: String, required: true },
    userName: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now },
    replies: [{
      userId: { type: String, required: true },
      userName: { type: String },
      replyText: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date }
    }]
  }],
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  
  // Admin moderation status
  moderationStatus: { 
    type: String, 
    enum: ['active', 'warned', 'removed'], 
    default: 'active' 
  },
  moderationNotes: { type: String },
  moderatedAt: { type: Date },
  moderatedBy: { type: String },
  
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
