/**
 * Image Moderation Queue Worker
 * Processes image moderation asynchronously using a queue system
 * Handles retries, failures, and logging
 */

import ImageModeration from '../models/imageModeration.model.js';
import ModerationAuditLog from '../models/moderationAuditLog.model.js';
import aiModerationService from './aiModerationService.js';
import { processImageUpload } from './imageValidator.js';
import imgbbUploader from 'imgbb-uploader';
import axios from 'axios';

/**
 * In-memory queue for image moderation
 * In production, replace with Redis Queue (Bull), RabbitMQ, or AWS SQS
 */
class ModerationQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.concurrency = 3; // Process 3 images simultaneously
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Add image to moderation queue
   * @param {Object} job - Job details
   */
  async addJob(job) {
    this.queue.push({
      ...job,
      id: Date.now() + Math.random(),
      attempts: 0,
      addedAt: new Date(),
      status: 'QUEUED'
    });

    console.log(`Added job to queue. Queue size: ${this.queue.length}`);

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Process queue continuously
   */
  async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      // Process up to N jobs concurrently
      const batch = this.queue.splice(0, this.concurrency);
      
      await Promise.allSettled(
        batch.map(job => this.processJob(job))
      );

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.processing = false;
  }

  /**
   * Process a single moderation job
   * @param {Object} job - Job details
   */
  async processJob(job) {
    const startTime = Date.now();
    console.log(`Processing moderation job: ${job.id}`);

    try {
      // Download image buffer if URL provided
      let imageBuffer;
      if (job.imageBuffer) {
        imageBuffer = job.imageBuffer;
      } else if (job.tempImageUrl) {
        const response = await axios.get(job.tempImageUrl, {
          responseType: 'arraybuffer',
          timeout: 30000
        });
        imageBuffer = Buffer.from(response.data);
      } else {
        throw new Error('No image buffer or URL provided');
      }

      // Step 1: Validate and preprocess image
      const processed = await processImageUpload(imageBuffer, job.fileMetadata || {});
      
      if (!processed.success) {
        await this.handleRejection(job, ['LOW_QUALITY'], processed.error);
        return;
      }

      // Step 2: Run AI moderation
      const moderationResult = await aiModerationService.moderateImage(processed.buffer);

      // Step 3: Check category relevance
      const relevanceScore = aiModerationService.checkCategoryRelevance(
        moderationResult.detectedLabels || [],
        job.category
      );

      // Step 4: Save moderation record
      const moderationRecord = await ImageModeration.create({
        imageUrl: job.tempImageUrl,
        tempImageUrl: job.tempImageUrl,
        imageHash: processed.metadata.imageHash,
        itemId: job.itemId,
        userId: job.userId,
        status: moderationResult.decision === 'AUTO_APPROVED' ? 'APPROVED' : 
                moderationResult.decision === 'AUTO_REJECTED' ? 'REJECTED' : 'FLAGGED',
        aiScores: {
          ...moderationResult.scores,
          relevance: relevanceScore,
          qualityScore: processed.metadata.qualityScore
        },
        aiProvider: moderationResult.provider,
        detectedLabels: moderationResult.detectedLabels || [],
        moderationDecision: moderationResult.decision,
        rejectionReasons: moderationResult.rejectionReasons || [],
        imageMetadata: processed.metadata,
        processingAttempts: job.attempts + 1,
        lastProcessedAt: new Date()
      });

      // Step 5: Create audit log
      await ModerationAuditLog.create({
        action: moderationResult.decision === 'AUTO_APPROVED' ? 'AUTO_APPROVED' :
                moderationResult.decision === 'AUTO_REJECTED' ? 'AUTO_REJECTED' : 'FLAGGED_FOR_REVIEW',
        imageId: moderationRecord._id,
        itemId: job.itemId,
        userId: job.userId,
        actorType: 'AI',
        actorId: moderationResult.provider,
        details: {
          aiScores: moderationResult.scores,
          decision: moderationResult.decision,
          reasons: moderationResult.rejectionReasons,
          processingTime: Date.now() - startTime
        }
      });

      // Step 6: Handle decision
      if (moderationResult.decision === 'AUTO_APPROVED') {
        await this.handleApproval(job, moderationRecord, processed.buffer);
      } else if (moderationResult.decision === 'AUTO_REJECTED') {
        await this.handleRejection(job, moderationResult.rejectionReasons, 'AI moderation rejected');
      } else {
        await this.handleManualReview(job, moderationRecord);
      }

      console.log(`✓ Moderation completed for job ${job.id}: ${moderationResult.decision}`);

    } catch (error) {
      console.error(`✗ Error processing job ${job.id}:`, error.message);
      
      // Retry logic
      if (job.attempts < this.retryAttempts) {
        job.attempts++;
        console.log(`Retrying job ${job.id} (attempt ${job.attempts}/${this.retryAttempts})`);
        
        setTimeout(() => {
          this.queue.push(job);
          if (!this.processing) this.processQueue();
        }, this.retryDelay * job.attempts);
      } else {
        // Max retries exceeded - send to manual review
        await this.handleFailure(job, error.message);
      }
    }
  }

  /**
   * Handle approved images
   */
  async handleApproval(job, moderationRecord, imageBuffer) {
    try {
      // Upload approved image to permanent storage (ImgBB)
      const base64Image = imageBuffer.toString('base64');
      const uploadResponse = await imgbbUploader({
        apiKey: process.env.IMGBB_API_KEY,
        base64string: base64Image,
        name: `approved-${Date.now()}-${job.itemId}`
      });

      // Update moderation record with permanent URL
      moderationRecord.imageUrl = uploadResponse.url;
      moderationRecord.status = 'APPROVED';
      await moderationRecord.save();

      // Call callback if provided
      if (job.onApproved) {
        await job.onApproved(uploadResponse.url, moderationRecord);
      }

      console.log(`Image approved and uploaded: ${uploadResponse.url}`);

    } catch (error) {
      console.error('Error handling approval:', error);
      throw error;
    }
  }

  /**
   * Handle rejected images
   */
  async handleRejection(job, reasons, errorMessage) {
    try {
      // Update moderation record
      await ImageModeration.findOneAndUpdate(
        { itemId: job.itemId, imageUrl: job.tempImageUrl },
        {
          status: 'REJECTED',
          rejectionReasons: reasons,
          errorMessage
        },
        { upsert: true }
      );

      // Call callback if provided
      if (job.onRejected) {
        await job.onRejected(reasons, errorMessage);
      }

      console.log(`Image rejected: ${reasons.join(', ')}`);

    } catch (error) {
      console.error('Error handling rejection:', error);
    }
  }

  /**
   * Handle images requiring manual review
   */
  async handleManualReview(job, moderationRecord) {
    try {
      moderationRecord.status = 'REVIEWING';
      await moderationRecord.save();

      // Notify admins (implement notification system)
      console.log(`Image flagged for manual review: ${moderationRecord._id}`);

      // Call callback if provided
      if (job.onManualReview) {
        await job.onManualReview(moderationRecord);
      }

    } catch (error) {
      console.error('Error handling manual review:', error);
    }
  }

  /**
   * Handle failed moderation
   */
  async handleFailure(job, errorMessage) {
    try {
      await ImageModeration.create({
        imageUrl: job.tempImageUrl,
        tempImageUrl: job.tempImageUrl,
        itemId: job.itemId,
        userId: job.userId,
        status: 'FLAGGED',
        moderationDecision: 'MANUAL_REVIEW_REQUIRED',
        rejectionReasons: ['OTHER'],
        errorMessage: `Moderation failed: ${errorMessage}`,
        processingAttempts: job.attempts
      });

      console.error(`Moderation failed for job ${job.id} after ${job.attempts} attempts`);

    } catch (error) {
      console.error('Error handling failure:', error);
    }
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      concurrency: this.concurrency
    };
  }
}

// Export singleton instance
const moderationQueue = new ModerationQueue();

/**
 * Public API for adding images to moderation queue
 * @param {Object} options - Moderation options
 * @returns {Promise} - Promise that resolves when queued
 */
export async function queueImageModeration(options) {
  const {
    imageBuffer,
    tempImageUrl,
    itemId,
    userId,
    category,
    fileMetadata,
    onApproved,
    onRejected,
    onManualReview
  } = options;

  await moderationQueue.addJob({
    imageBuffer,
    tempImageUrl,
    itemId,
    userId,
    category,
    fileMetadata,
    onApproved,
    onRejected,
    onManualReview
  });
}

/**
 * Get queue statistics
 */
export function getQueueStats() {
  return moderationQueue.getStats();
}

export default moderationQueue;
