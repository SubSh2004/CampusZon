// campuszon-server/src/utils/queue.manager.js

const Job = require('../models/queue.model');
const { v4: uuidv4 } = require('uuid');

class QueueManager {
  constructor() {
    this.isShuttingDown = false;
  }

  /**
   * Add a new job to the queue
   * @param {string} type - Job type (IMAGE_PROCESS, EMAIL_SEND, etc.)
   * @param {object} payload - Job data
   * @param {number} priority - Higher number = higher priority (default: 0)
   * @returns {Promise<string>} Job ID
   */
  async addJob(type, payload, priority = 0) {
    try {
      const jobId = uuidv4();
      
      const job = new Job({
        id: jobId,
        type,
        payload,
        priority,
        status: 'pending'
      });

      await job.save();
      
      console.log(`[Queue] Added job ${jobId} (type: ${type}, priority: ${priority})`);
      
      // Trigger worker if not already running (non-blocking)
      setImmediate(() => {
        const QueueWorker = require('./queue.worker');
        QueueWorker.processNext();
      });
      
      return jobId;
      
    } catch (error) {
      console.error('[Queue] Failed to add job:', error.message);
      throw new Error(`Failed to queue job: ${error.message}`);
    }
  }

  /**
   * Get job status by ID
   * @param {string} jobId - Job ID
   * @returns {Promise<object|null>} Job status
   */
  async getJobStatus(jobId) {
    try {
      const job = await Job.findOne({ id: jobId }).lean();
      
      if (!job) {
        return null;
      }
      
      return {
        id: job.id,
        type: job.type,
        status: job.status,
        retryCount: job.retryCount,
        createdAt: job.createdAt,
        processedAt: job.processedAt,
        completedAt: job.completedAt,
        error: job.error
      };
      
    } catch (error) {
      console.error(`[Queue] Failed to get job status for ${jobId}:`, error.message);
      return null;
    }
  }

  /**
   * Get queue statistics
   * @returns {Promise<object>} Queue stats
   */
  async getQueueStats() {
    try {
      const stats = await Job.getQueueStats();
      
      // Add processing time info
      const oldestPending = await Job.findOne(
        { status: 'pending' },
        { createdAt: 1 }
      ).sort({ createdAt: 1 });
      
      const oldestProcessing = await Job.findOne(
        { status: 'processing' },
        { processedAt: 1 }
      ).sort({ processedAt: 1 });
      
      return {
        ...stats,
        oldestPendingAge: oldestPending ? 
          Math.floor((Date.now() - oldestPending.createdAt) / 1000) : 0,
        oldestProcessingAge: oldestProcessing ? 
          Math.floor((Date.now() - oldestProcessing.processedAt) / 1000) : 0
      };
      
    } catch (error) {
      console.error('[Queue] Failed to get queue stats:', error.message);
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: 0,
        oldestPendingAge: 0,
        oldestProcessingAge: 0
      };
    }
  }

  /**
   * Cleanup stuck jobs (should be called periodically)
   * @returns {Promise<number>} Number of jobs requeued
   */
  async cleanupStuckJobs() {
    try {
      const requeuedCount = await Job.requeueStuckJobs();
      
      if (requeuedCount > 0) {
        console.log(`[Queue] Requeued ${requeuedCount} stuck jobs`);
      }
      
      return requeuedCount;
      
    } catch (error) {
      console.error('[Queue] Failed to cleanup stuck jobs:', error.message);
      return 0;
    }
  }

  /**
   * Cancel a pending job
   * @param {string} jobId - Job ID
   * @returns {Promise<boolean>} Success status
   */
  async cancelJob(jobId) {
    try {
      const result = await Job.updateOne(
        { id: jobId, status: 'pending' },
        { status: 'failed', error: { message: 'Cancelled by user' } }
      );
      
      return result.modifiedCount > 0;
      
    } catch (error) {
      console.error(`[Queue] Failed to cancel job ${jobId}:`, error.message);
      return false;
    }
  }

  /**
   * Graceful shutdown - wait for current jobs to complete
   * @param {number} timeoutMs - Max wait time in milliseconds
   * @returns {Promise<void>}
   */
  async gracefulShutdown(timeoutMs = 30000) {
    console.log('[Queue] Starting graceful shutdown...');
    this.isShuttingDown = true;
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const stats = await this.getQueueStats();
      
      if (stats.processing === 0) {
        console.log('[Queue] All jobs completed. Shutdown complete.');
        return;
      }
      
      console.log(`[Queue] Waiting for ${stats.processing} jobs to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('[Queue] Shutdown timeout reached. Some jobs may still be processing.');
  }
}

// Export singleton instance
module.exports = new QueueManager();