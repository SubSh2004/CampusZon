import mongoose from 'mongoose';

/**
 * UserViolation Model
 * Tracks violations and strikes for enforcement
 */
const userViolationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true, unique: true },
  
  // Violation tracking
  totalViolations: { type: Number, default: 0 },
  activeStrikes: { type: Number, default: 0 }, // Current strikes (can be reduced over time)
  lifetimeStrikes: { type: Number, default: 0 }, // Total strikes ever received
  
  // Account status
  accountStatus: {
    type: String,
    enum: ['ACTIVE', 'WARNING', 'SUSPENDED', 'BANNED'],
    default: 'ACTIVE',
    index: true
  },
  
  // Suspension info
  suspendedUntil: { type: Date },
  suspensionReason: { type: String },
  
  // Ban info
  permanentlyBanned: { type: Boolean, default: false },
  banReason: { type: String },
  bannedAt: { type: Date },
  
  // Individual violations
  violations: [{
    violationId: { type: mongoose.Schema.Types.ObjectId, auto: true },
    imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'ImageModeration' },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    
    violationType: {
      type: String,
      enum: [
        'NUDITY',
        'PORNOGRAPHY',
        'VIOLENCE',
        'GORE',
        'HATE_SYMBOLS',
        'DRUGS',
        'WEAPONS',
        'SPAM',
        'IRRELEVANT',
        'MISLEADING',
        'MULTIPLE_REPORTS',
        'OTHER'
      ],
      required: true
    },
    
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM'
    },
    
    action: {
      type: String,
      enum: ['WARNING', 'IMAGE_REMOVED', 'ITEM_REMOVED', 'TEMPORARY_SUSPENSION', 'PERMANENT_BAN'],
      required: true
    },
    
    description: { type: String },
    detectedAt: { type: Date, default: Date.now },
    actedBy: { type: String }, // Admin who took action
    actedAt: { type: Date, default: Date.now },
    
    // Strike penalty
    strikesAdded: { type: Number, default: 0 },
    
    // Appeal info
    appealed: { type: Boolean, default: false },
    appealStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED']
    },
    appealNotes: { type: String }
  }],
  
  // Warnings sent
  warnings: [{
    sentAt: { type: Date, default: Date.now },
    reason: { type: String },
    acknowledged: { type: Boolean, default: false }
  }],
  
  // Statistics
  stats: {
    totalImagesUploaded: { type: Number, default: 0 },
    imagesRejected: { type: Number, default: 0 },
    imagesReported: { type: Number, default: 0 },
    rejectionRate: { type: Number, default: 0 }, // Percentage
    lastViolationDate: { type: Date }
  },
  
  // Rehabilitation tracking
  goodBehaviorDays: { type: Number, default: 0 }, // Days without violations
  lastGoodBehaviorCheck: { type: Date, default: Date.now },
  
}, {
  timestamps: true,
});

// Indices
userViolationSchema.index({ accountStatus: 1, suspendedUntil: 1 });
userViolationSchema.index({ 'stats.rejectionRate': -1 });

const UserViolation = mongoose.models.UserViolation || 
  mongoose.model('UserViolation', userViolationSchema);

export default UserViolation;
