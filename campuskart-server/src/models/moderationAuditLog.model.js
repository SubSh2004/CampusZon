import mongoose from 'mongoose';

/**
 * ModerationAuditLog Model
 * Immutable audit trail of all moderation actions
 */
const moderationAuditLogSchema = new mongoose.Schema({
  // Action info
  action: {
    type: String,
    enum: [
      'IMAGE_UPLOADED',
      'AI_MODERATION_COMPLETED',
      'AUTO_APPROVED',
      'AUTO_REJECTED',
      'FLAGGED_FOR_REVIEW',
      'MANUAL_REVIEW_STARTED',
      'MANUAL_APPROVED',
      'MANUAL_REJECTED',
      'USER_REPORTED',
      'IMAGE_REMOVED',
      'USER_WARNED',
      'USER_SUSPENDED',
      'USER_BANNED',
      'STRIKE_ADDED',
      'APPEAL_SUBMITTED',
      'APPEAL_RESOLVED'
    ],
    required: true,
    index: true
  },
  
  // Related entities
  imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'ImageModeration', index: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', index: true },
  userId: { type: String, index: true },
  
  // Actor (who performed the action)
  actorType: {
    type: String,
    enum: ['SYSTEM', 'AI', 'ADMIN', 'USER'],
    required: true
  },
  actorId: { type: String }, // Admin ID or 'system' or AI provider name
  
  // Action details
  details: {
    previousStatus: { type: String },
    newStatus: { type: String },
    reason: { type: String },
    aiScores: { type: mongoose.Schema.Types.Mixed },
    moderatorNotes: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  
  // IP and user agent for security
  ipAddress: { type: String },
  userAgent: { type: String },
  
  // Timestamp (indexed for efficient queries)
  timestamp: { type: Date, default: Date.now, index: true, immutable: true },
  
}, {
  timestamps: false, // Using custom timestamp field
  strict: true
});

// Make all fields immutable after creation
moderationAuditLogSchema.pre('save', function(next) {
  if (!this.isNew) {
    throw new Error('Audit logs cannot be modified');
  }
  next();
});

// Compound indices for common queries
moderationAuditLogSchema.index({ action: 1, timestamp: -1 });
moderationAuditLogSchema.index({ userId: 1, timestamp: -1 });
moderationAuditLogSchema.index({ actorId: 1, timestamp: -1 });

const ModerationAuditLog = mongoose.models.ModerationAuditLog || 
  mongoose.model('ModerationAuditLog', moderationAuditLogSchema);

export default ModerationAuditLog;
