import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true }, // Primary price (for backward compatibility)
  salePrice: { type: Number }, // Price for sale
  rentPrice: { type: Number }, // Price for rent
  category: { type: String, required: true },
  listingType: { 
    type: String, 
    enum: ['For Sale', 'For Rent', 'Both'], 
    default: 'For Sale' 
  },
  rentalPeriod: { 
    type: String, 
    enum: ['Per Day', 'Per Week', 'Per Month'], 
  },
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

// ============================================
// INDEXES (Performance Optimization)
// ============================================
// Note: "Campus" = emailDomain field

// Original index (kept for backward compatibility)
itemSchema.index({ emailDomain: 1, createdAt: -1 });

// Priority 1: Home page load optimization (most frequent query)
// Supports: emailDomain + moderationStatus filter + date sort
itemSchema.index({ emailDomain: 1, moderationStatus: 1, createdAt: -1 });

// Priority 1: Category filtering (high frequency)
// Supports: emailDomain + category filter + date sort
itemSchema.index({ emailDomain: 1, category: 1, createdAt: -1 });

// Priority 2: User's own items (Profile page + security)
// Supports: emailDomain + userId lookup + date sort
itemSchema.index({ emailDomain: 1, userId: 1, createdAt: -1 });

// Priority 2: Available items filter (buyer UX)
// Supports: emailDomain + available filter + date sort
itemSchema.index({ emailDomain: 1, available: 1, createdAt: -1 });

// ============================================
// QUERY MIDDLEWARE (Security & Safety)
// ============================================

// PRODUCTION SAFEGUARD: Enforce emailDomain filter on all queries (except by _id)
itemSchema.pre(/^find/, function(next) {
  const query = this.getQuery();
  
  // Skip check for findById (uses _id which is always safe)
  if (query._id) {
    return next();
  }
  
  // Check if emailDomain filter exists
  if (!query.emailDomain) {
    const error = new Error('SECURITY: Query missing emailDomain filter! Campus isolation breach detected.');
    console.error('⚠️  SECURITY WARNING: Query missing emailDomain filter!');
    console.error('   Query:', JSON.stringify(query));
    console.error('   Stack:', new Error().stack.split('\n').slice(2, 5).join('\n'));
    
    // PRODUCTION: Throw error for sensitive operations
    if (process.env.NODE_ENV === 'production') {
      // Allow certain safe queries in production (aggregation pipelines handle it separately)
      const operation = this.op;
      if (operation === 'find' || operation === 'findOne' || operation === 'count' || operation === 'countDocuments') {
        throw error;
      }
    }
  }
  
  next();
});

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);

export default Item;
