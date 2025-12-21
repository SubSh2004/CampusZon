import mongoose from 'mongoose';

/**
 * ImageModeration Model
 * Stores moderation results for each uploaded image
 */
const imageModerationSchema = new mongoose.Schema({
  // Image identification
  imageUrl: { type: String, required: true },
  tempImageUrl: { type: String }, // Temporary URL before approval
  imageHash: { type: String, index: true }, // For detecting duplicates
  
  // Related entities
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
  userId: { type: String, required: true, index: true },
  
  // Moderation status
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED', 'REVIEWING'],
    default: 'PENDING',
    index: true
  },
  
  // AI Moderation scores (0-1, where 1 is most likely to contain that content)
  aiScores: {
    adult: { type: Number, default: 0 },
    violence: { type: Number, default: 0 },
    racy: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    spoof: { type: Number, default: 0 }, // Memes, fake, misleading
    
    // AWS Rekognition specific
    nudity: { type: Number, default: 0 },
    explicitNudity: { type: Number, default: 0 },
    suggestive: { type: Number, default: 0 },
    drugs: { type: Number, default: 0 },
    weapons: { type: Number, default: 0 },
    hate: { type: Number, default: 0 },
    gambling: { type: Number, default: 0 },
    
    // Custom scores
    relevance: { type: Number, default: 0 }, // How relevant to listing category
    qualityScore: { type: Number, default: 0 }, // Image quality
  },
  
  // AI Provider info
  aiProvider: {
    type: String,
    enum: ['GOOGLE_VISION', 'AWS_REKOGNITION', 'AZURE_CONTENT_MODERATOR', 'OPENAI_VISION'],
    default: 'GOOGLE_VISION'
  },
  
  // Detected labels/objects
  detectedLabels: [String],
  
  // Moderation decision
  moderationDecision: {
    type: String,
    enum: ['AUTO_APPROVED', 'AUTO_REJECTED', 'MANUAL_REVIEW_REQUIRED'],
    required: true
  },
  
  // Rejection reasons
  rejectionReasons: [{
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
      'LOW_QUALITY',
      'ANIMATED',
      'FAKE',
      'CELEBRITY',
      'MEME',
      'INAPPROPRIATE',
      'USER_REPORTED',
      'OTHER'
    ]
  }],
  
  // Manual review
  manualReview: {
    reviewedBy: { type: String }, // Admin user ID
    reviewedAt: { type: Date },
    reviewNotes: { type: String },
    finalDecision: {
      type: String,
      enum: ['APPROVED', 'REJECTED']
    }
  },
  
  // User reports
  reportCount: { type: Number, default: 0 },
  reports: [{
    reportedBy: { type: String, required: true },
    reportedAt: { type: Date, default: Date.now },
    reason: {
      type: String,
      enum: ['INAPPROPRIATE', 'PORNOGRAPHIC', 'VIOLENT', 'OFFENSIVE', 'FAKE', 'SPAM'],
      required: true
    },
    comments: { type: String }
  }],
  
  // Image metadata
  imageMetadata: {
    width: { type: Number },
    height: { type: Number },
    format: { type: String },
    size: { type: Number }, // bytes
    hasEXIF: { type: Boolean, default: false }
  },
  
  // Processing info
  processingAttempts: { type: Number, default: 0 },
  lastProcessedAt: { type: Date },
  errorMessage: { type: String },
  
}, {
  timestamps: true,
});

// Compound indices for common queries
imageModerationSchema.index({ status: 1, createdAt: -1 });
imageModerationSchema.index({ userId: 1, status: 1 });
imageModerationSchema.index({ status: 1, moderationDecision: 1 });

const ImageModeration = mongoose.models.ImageModeration || 
  mongoose.model('ImageModeration', imageModerationSchema);

export default ImageModeration;
