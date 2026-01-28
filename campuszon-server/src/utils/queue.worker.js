// campuszon-server/src/utils/queue.worker.js

const Job = require('../models/queue.model');
const sharp = require('sharp');
const axios = require('axios');

class QueueWorker {
  constructor() {
    this.isProcessing = false;
    this.processingJobId = null;
    this.maxRetries = 3;
    this.retryDelays = [1000, 5000, 15000]; // 1s, 5s, 15s
  }

  /**
   * Process the next job in queue (non-blocking)
   * This is the main entry point called by QueueManager
   */
  async processNext() {
    // Prevent multiple workers running simultaneously
    if (this.isProcessing) {
      return;
    }

    // Check if shutting down
    const QueueManager = require('./queue.manager');
    if (QueueManager.isShuttingDown) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get next job from database
      const job = await Job.getNextJob();
      
      if (!job) {
        // No jobs to process
        this.isProcessing = false;
        return;
      }

      this.processingJobId = job.id;
      console.log(`[Worker] Processing job ${job.id} (type: ${job.type}, attempt: ${job.retryCount + 1})`);

      // Process the job based on type
      await this.executeJob(job);

      // Mark job as completed
      await Job.findOneAndUpdate(
        { id: job.id },
        { 
          status: 'completed',
          completedAt: new Date(),
          $unset: { error: 1, lockedUntil: 1 }
        }
      );

      console.log(`[Worker] ✅ Job ${job.id} completed successfully`);

    } catch (error) {
      await this.handleJobError(error);
    } finally {
      this.isProcessing = false;
      this.processingJobId = null;

      // Force garbage collection
      if (global.gc) {
        global.gc();
      }

      // Check if more jobs exist before recursing
      try {
        const pendingCount = await Job.countDocuments({ 
          status: 'pending',
          retryCount: { $lt: 3 }
        });
        
        if (pendingCount > 0) {
          // Wait longer between jobs for GC and memory cleanup
          setTimeout(() => {
            this.processNext();
          }, 2000); // 2 second gap
        }
      } catch (countError) {
        console.error('[Worker] Failed to check pending jobs:', countError.message);
        // Retry anyway after longer delay
        setTimeout(() => {
          this.processNext();
        }, 5000);
      }
    }
  }

  /**
   * Execute job based on type
   * @param {object} job - Job document from database
   */
  async executeJob(job) {
    switch (job.type) {
      case 'IMAGE_PROCESS':
        await this.processImages(job);
        break;
        
      case 'EMAIL_SEND':
        await this.sendEmail(job);
        break;
        
      case 'CLEANUP':
        await this.cleanup(job);
        break;
        
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  /**
   * Process images using Sharp (main use case)
   * @param {object} job - Job with image processing payload
   */
  async processImages(job) {
    const { itemId, imageUrls, callbackUrl } = job.payload;
    
    if (!itemId || !imageUrls || !Array.isArray(imageUrls)) {
      throw new Error('Invalid image processing payload');
    }

    console.log(`[Worker] Processing ${imageUrls.length} images for item ${itemId}`);
    
    const processedImages = [];
    
    // Process images sequentially (concurrency = 1)
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      
      try {
        console.log(`[Worker] Processing image ${i + 1}/${imageUrls.length}`);
        
        // Download image with timeout
        const response = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 30000, // 30 second timeout
          maxContentLength: 5 * 1024 * 1024 // 5MB max (reduced from 10MB)
        });
        
        const inputBuffer = Buffer.from(response.data);
        const originalSize = inputBuffer.length;
        
        // Process with Sharp (memory-efficient settings for 512MB tier)
        const processedBuffer = await sharp(inputBuffer, {
          limitInputPixels: 16777216, // 4k x 4k max (16MP) - reduced from 268M
          sequentialRead: true,
          failOnError: false
        })
          .resize(800, 800, { // Reduced from 1200 to save memory
            fit: 'inside', 
            withoutEnlargement: true,
            kernel: sharp.kernel.lanczos3
          })
          .jpeg({ // JPEG uses less memory than WebP
            quality: 75, // Reduced from 85
            progressive: true,
            optimizeScans: true
          })
          .toBuffer({ resolveWithObject: false }); // Reduce memory footprint
        
        const processedSize = processedBuffer.length;
        const reduction = ((originalSize - processedSize) / originalSize * 100).toFixed(1);
        
        // Upload processed image
        const processedUrl = await this.uploadImage(processedBuffer);
        
        processedImages.push(processedUrl);
        
        console.log(`[Worker] ✅ Image ${i + 1}: ${Math.round(originalSize/1024)}KB → ${Math.round(processedSize/1024)}KB (${reduction}% smaller)`);
        
        // Force garbage collection hint
        if (global.gc) {
          global.gc();
        }
        
      } catch (imageError) {
        console.error(`[Worker] ❌ Failed to process image ${i + 1}:`, imageError.message);
        // Keep original URL as fallback
        processedImages.push(imageUrl);
      }
    }
    
    // Update item with processed images
    await this.updateItemImages(itemId, processedImages);
    
    // Call callback if provided
    if (callbackUrl) {
      try {
        await axios.post(callbackUrl, {
          itemId,
          images: processedImages,
          success: true
        }, { timeout: 10000 });
      } catch (callbackError) {
        console.error(`[Worker] Callback failed for ${itemId}:`, callbackError.message);
        // Don't fail the job for callback errors
      }
    }
  }

  /**
   * Upload processed image to storage
   * @param {Buffer} buffer - Image buffer
   * @returns {Promise<string>} Image URL
   */
  async uploadImage(buffer) {
    const FormData = require('form-data');
    
    const form = new FormData();
    form.append('image', buffer.toString('base64'));
    
    const response = await axios.post('https://api.imgbb.com/1/upload', form, {
      params: { key: process.env.IMGBB_API_KEY },
      headers: form.getHeaders(),
      timeout: 30000
    });
    
    return response.data.data.url;
  }

  /**
   * Update item with processed images
   * @param {string} itemId - Item ID
   * @param {string[]} imageUrls - Processed image URLs
   */
  async updateItemImages(itemId, imageUrls) {
    const Item = require('../models/item.mongo.model');
    
    await Item.findByIdAndUpdate(itemId, {
      images: imageUrls,
      optimizationStatus: 'completed',
      optimizedAt: new Date()
    });
  }

  /**
   * Send email (placeholder for future use)
   * @param {object} job - Email job
   */
  async sendEmail(job) {
    const { to, subject, body } = job.payload;
    console.log(`[Worker] Sending email to ${to}: ${subject}`);
    
    // Implement email sending logic here
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
  }

  /**
   * Cleanup task (placeholder for future use)
   * @param {object} job - Cleanup job
   */
  async cleanup(job) {
    console.log(`[Worker] Running cleanup task: ${job.payload.task}`);
    
    // Implement cleanup logic here
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate work
  }

  /**
   * Handle job execution errors with retry logic
   * @param {Error} error - Error that occurred during job execution
   */
  async handleJobError(error) {
    if (!this.processingJobId) {
      console.error('[Worker] Error occurred but no job ID available:', error.message);
      return;
    }

    const jobId = this.processingJobId;
    
    try {
      const job = await Job.findOne({ id: jobId });
      
      if (!job) {
        console.error(`[Worker] Job ${jobId} not found for error handling`);
        return;
      }

      const newRetryCount = job.retryCount + 1;
      
      if (newRetryCount >= this.maxRetries) {
        // Max retries reached - mark as failed
        await Job.findOneAndUpdate(
          { id: jobId },
          {
            status: 'failed',
            $inc: { retryCount: 1 }, // Atomic increment
            error: {
              message: error.message,
              stack: error.stack,
              lastFailedAt: new Date()
            },
            $unset: { lockedUntil: 1 }
          }
        );
        
        console.error(`[Worker] ❌ Job ${jobId} failed permanently after ${newRetryCount} attempts: ${error.message}`);
        
      } else {
        // Schedule retry
        const retryDelay = this.retryDelays[newRetryCount - 1] || 15000;
        
        await Job.findOneAndUpdate(
          { id: jobId },
          {
            status: 'pending',
            $inc: { retryCount: 1 }, // Atomic increment
            error: {
              message: error.message,
              stack: error.stack,
              lastFailedAt: new Date()
            },
            $unset: { processedAt: 1, lockedUntil: 1 }
          }
        );
        
        console.log(`[Worker] 🔄 Job ${jobId} will retry in ${retryDelay}ms (attempt ${newRetryCount + 1}/${this.maxRetries})`);
        
        // Schedule retry (non-blocking)
        setTimeout(() => {
          this.processNext();
        }, retryDelay);
      }
      
    } catch (dbError) {
      console.error(`[Worker] Failed to handle error for job ${jobId}:`, dbError.message);
    }
  }

  /**
   * Get current processing status
   * @returns {object} Worker status
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      processingJobId: this.processingJobId,
      maxRetries: this.maxRetries
    };
  }
}

// Export singleton instance
module.exports = new QueueWorker();