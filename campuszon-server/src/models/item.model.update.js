// Add these fields to your existing Item model
// campuszon-server/src/models/item.mongo.model.js

const itemSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // New optimization fields
  optimizationStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  
  optimizedAt: {
    type: Date,
    default: null
  },
  
  failedAt: {
    type: Date,
    default: null
  },
  
  // Optional: track original vs optimized sizes
  imageStats: {
    originalSizes: [Number], // Array of original file sizes in bytes
    optimizedSizes: [Number], // Array of optimized file sizes in bytes
    totalReduction: Number // Percentage reduction
  }
  
}, { timestamps: true });