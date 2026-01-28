// campuszon-server/src/models/queue.model.js

const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['IMAGE_PROCESS', 'EMAIL_SEND', 'CLEANUP'],
    index: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  retryCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  error: {
    message: String,
    stack: String,
    lastFailedAt: Date
  },
  priority: {
    type: Number,
    default: 0,
    index: true
  },
  processedAt: Date,
  completedAt: Date,
  lockedUntil: {
    type: Date,
    index: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Compound index for efficient queue queries
jobSchema.index({ status: 1, priority: -1, createdAt: 1 });

// TTL index - auto-delete completed jobs after 7 days
jobSchema.index({ completedAt: 1 }, { expireAfterSeconds: 604800 });

// Static methods for queue operations
jobSchema.statics.getNextJob = async function() {
  const now = new Date();
  const lockUntil = new Date(now.getTime() + 30 * 60 * 1000); // 30 min lock
  
  return this.findOneAndUpdate(
    { 
      status: 'pending',
      retryCount: { $lt: 3 },
      $or: [
        { lockedUntil: { $exists: false } },
        { lockedUntil: { $lt: now } }
      ]
    },
    { 
      status: 'processing',
      processedAt: now,
      lockedUntil: lockUntil
    },
    { 
      sort: { priority: -1, createdAt: 1 },
      new: true 
    }
  );
};

jobSchema.statics.getQueueStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  return result;
};

jobSchema.statics.requeueStuckJobs = async function() {
  // Requeue jobs that have been processing for more than 30 minutes
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  const result = await this.updateMany(
    {
      status: 'processing',
      processedAt: { $lt: thirtyMinutesAgo }
    },
    {
      status: 'pending',
      $unset: { processedAt: 1, lockedUntil: 1 }
    }
  );
  
  return result.modifiedCount;
};

module.exports = mongoose.model('Job', jobSchema);