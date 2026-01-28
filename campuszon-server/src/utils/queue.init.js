// campuszon-server/src/utils/queue.init.js
// Queue initialization and cleanup utilities

const QueueManager = require('./queue.manager');
const QueueWorker = require('./queue.worker');

class QueueInitializer {
  constructor() {
    this.cleanupInterval = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the queue system
   * Call this after database connection is established
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[Queue] Already initialized');
      return;
    }

    try {
      console.log('[Queue] Initializing queue system...');

      // Cleanup any stuck jobs from previous runs
      const requeuedCount = await QueueManager.cleanupStuckJobs();
      if (requeuedCount > 0) {
        console.log(`[Queue] Requeued ${requeuedCount} stuck jobs from previous session`);
      }

      // Start processing existing jobs
      setImmediate(() => {
        QueueWorker.processNext();
      });

      // Set up periodic cleanup (every 5 minutes)
      this.cleanupInterval = setInterval(async () => {
        try {
          await QueueManager.cleanupStuckJobs();
        } catch (error) {
          console.error('[Queue] Periodic cleanup failed:', error.message);
        }
      }, 5 * 60 * 1000); // 5 minutes

      // Log queue stats every 10 minutes (optional)
      setInterval(async () => {
        try {
          const stats = await QueueManager.getQueueStats();
          if (stats.total > 0) {
            console.log(`[Queue] Stats - Pending: ${stats.pending}, Processing: ${stats.processing}, Completed: ${stats.completed}, Failed: ${stats.failed}`);
          }
        } catch (error) {
          console.error('[Queue] Stats logging failed:', error.message);
        }
      }, 10 * 60 * 1000); // 10 minutes

      this.isInitialized = true;
      console.log('[Queue] ✅ Queue system initialized successfully');

    } catch (error) {
      console.error('[Queue] ❌ Failed to initialize queue system:', error.message);
      throw error;
    }
  }

  /**
   * Graceful shutdown of queue system
   * Call this in your server shutdown handler
   */
  async shutdown() {
    console.log('[Queue] Shutting down queue system...');

    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Wait for current jobs to complete
    await QueueManager.gracefulShutdown(30000); // 30 second timeout

    this.isInitialized = false;
    console.log('[Queue] ✅ Queue system shutdown complete');
  }

  /**
   * Health check for queue system
   * @returns {Promise<object>} Health status
   */
  async healthCheck() {
    try {
      const stats = await QueueManager.getQueueStats();
      const workerStatus = QueueWorker.getStatus();

      return {
        healthy: true,
        initialized: this.isInitialized,
        stats,
        worker: workerStatus,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

// Export singleton instance
module.exports = new QueueInitializer();