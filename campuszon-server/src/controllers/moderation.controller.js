/**
 * Moderation Controller
 * Handles admin moderation dashboard and user reporting APIs
 */

import ImageModeration from '../models/imageModeration.model.js';
import UserViolation from '../models/userViolation.model.js';
import ModerationAuditLog from '../models/moderationAuditLog.model.js';
import Item from '../models/item.mongo.model.js';
import Notification from '../models/notification.model.js';
import { recordViolation, getUserViolationStats } from '../utils/enforcementSystem.js';
import { createBlurredPreview } from '../utils/imageValidator.js';
import { emitNotification } from '../index.js';
import axios from 'axios';

/**
 * Get images pending manual review
 * @route GET /api/moderation/pending
 * @access Admin only
 */
export const getPendingReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'REVIEWING' } = req.query;

    const images = await ImageModeration.find({
      status: { $in: ['REVIEWING', 'FLAGGED'] }
    })
      .populate('itemId', 'title category description userId userName userEmail userPhone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await ImageModeration.countDocuments({
      status: { $in: ['REVIEWING', 'FLAGGED'] }
    });

    res.json({
      success: true,
      images,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending reviews',
      error: error.message
    });
  }
};

/**
 * Get moderation details for a specific image
 * @route GET /api/moderation/:imageId
 * @access Admin only
 */
export const getModerationDetails = async (req, res) => {
  try {
    const { imageId } = req.params;

    const moderation = await ImageModeration.findById(imageId)
      .populate('itemId', 'title category description price userId userName userEmail');

    if (!moderation) {
      return res.status(404).json({
        success: false,
        message: 'Moderation record not found'
      });
    }

    // Get user violation history
    const userStats = await getUserViolationStats(moderation.userId);

    // Get audit logs for this image
    const auditLogs = await ModerationAuditLog.find({ imageId })
      .sort({ timestamp: -1 })
      .limit(20);

    res.json({
      success: true,
      moderation,
      userStats,
      auditLogs
    });

  } catch (error) {
    console.error('Error fetching moderation details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch moderation details',
      error: error.message
    });
  }
};

/**
 * Approve an image (manual review)
 * @route POST /api/moderation/:imageId/approve
 * @access Admin only
 */
export const approveImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { notes } = req.body;
    const adminId = req.user?.userId || 'ADMIN'; // From auth middleware

    const moderation = await ImageModeration.findById(imageId);

    if (!moderation) {
      return res.status(404).json({
        success: false,
        message: 'Moderation record not found'
      });
    }

    // Update moderation record
    moderation.status = 'APPROVED';
    moderation.manualReview = {
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewNotes: notes,
      finalDecision: 'APPROVED'
    };
    await moderation.save();

    // Update item with approved image
    const item = await Item.findById(moderation.itemId);
    if (item) {
      // Make sure image is in public URLs
      if (!item.imageUrls.includes(moderation.imageUrl)) {
        item.imageUrls.push(moderation.imageUrl);
        if (!item.imageUrl) {
          item.imageUrl = moderation.imageUrl;
        }
        await item.save();
      }
    }

    // Create audit log
    await ModerationAuditLog.create({
      action: 'MANUAL_APPROVED',
      imageId: moderation._id,
      itemId: moderation.itemId,
      userId: moderation.userId,
      actorType: 'ADMIN',
      actorId: adminId,
      details: {
        previousStatus: moderation.status,
        newStatus: 'APPROVED',
        moderatorNotes: notes
      }
    });
    // Send notification to user
    const approveNotification = await Notification.create({
      userId: moderation.userId,
      type: 'ITEM_APPROVED',
      title: 'Item Approved!',
      message: `Your item "${item?.title || 'Unknown'}" has been approved and is now live.`,
      itemId: moderation.itemId,
      imageUrl: moderation.imageUrl,
      read: false
    });
    
    console.log(`✅ Notification created for user ${moderation.userId}:`, {
      type: 'ITEM_APPROVED',
      itemId: moderation.itemId,
      notificationId: approveNotification._id
    });

    // Send real-time notification
    emitNotification(moderation.userId, approveNotification);

    res.json({
      success: true,
      message: 'Image approved successfully',
      moderation
    });

  } catch (error) {
    console.error('Error approving image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve image',
      error: error.message
    });
  }
};

/**
 * Reject an image (manual review)
 * @route POST /api/moderation/:imageId/reject
 * @access Admin only
 */
export const rejectImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { reasons, notes, addViolation = true } = req.body;
    const adminId = req.user?.userId || 'ADMIN';

    if (!reasons || reasons.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reasons are required'
      });
    }

    const moderation = await ImageModeration.findById(imageId);

    if (!moderation) {
      return res.status(404).json({
        success: false,
        message: 'Moderation record not found'
      });
    }

    // Update moderation record
    moderation.status = 'REJECTED';
    moderation.rejectionReasons = reasons;
    moderation.manualReview = {
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewNotes: notes,
      finalDecision: 'REJECTED'
    };
    await moderation.save();

    // Remove image from item
    const item = await Item.findById(moderation.itemId);
    if (item) {
      item.imageUrls = item.imageUrls.filter(url => url !== moderation.imageUrl);
      if (item.imageUrl === moderation.imageUrl) {
        item.imageUrl = item.imageUrls[0] || null;
      }
      await item.save();
    }

    // Record violation if requested
    let enforcement;
    if (addViolation) {
      enforcement = await recordViolation({
        userId: moderation.userId,
        imageId: moderation._id,
        itemId: moderation.itemId,
        violationType: reasons[0],
        aiScores: moderation.aiScores,
        description: notes,
        actedBy: adminId
      });
    }

    // Create audit log
    await ModerationAuditLog.create({
      action: 'MANUAL_REJECTED',
      imageId: moderation._id,
      itemId: moderation.itemId,
      userId: moderation.userId,
      actorType: 'ADMIN',
      actorId: adminId,
      details: {
        previousStatus: moderation.status,
        newStatus: 'REJECTED',
        reasons,
        moderatorNotes: notes,
        violationAdded: addViolation,
        enforcement: enforcement?.enforcement
      }
    });

    // Send notification to user
    const rejectNotification = await Notification.create({
      userId: moderation.userId,
      type: 'ITEM_REJECTED',
      title: 'Item Rejected',
      message: notes || `Your item "${item?.title || 'Unknown'}" was rejected. Reasons: ${reasons.join(', ')}`,
      itemId: moderation.itemId,
      imageUrl: moderation.imageUrl,
      read: false,
      metadata: new Map([['reasons', reasons]])
    });
    
    console.log(`🚫 Notification created for user ${moderation.userId}:`, {
      type: 'ITEM_REJECTED',
      itemId: moderation.itemId,
      notificationId: rejectNotification._id,
      reasons
    });

    // Send real-time notification
    emitNotification(moderation.userId, rejectNotification);

    res.json({
      success: true,
      message: 'Image rejected and user notified',
      moderation,
      enforcement
    });

  } catch (error) {
    console.error('Error rejecting image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject image',
      error: error.message
    });
  }
};

/**
 * User reports an image
 * @route POST /api/moderation/report/:itemId
 * @access Authenticated users
 */
export const reportImage = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { imageUrl, reason, comments } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Validate reason
    const validReasons = ['INAPPROPRIATE', 'PORNOGRAPHIC', 'VIOLENT', 'OFFENSIVE', 'FAKE', 'SPAM'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report reason'
      });
    }

    // Find or create moderation record for this image
    let moderation = await ImageModeration.findOne({
      itemId,
      imageUrl
    });

    if (!moderation) {
      // Create a new moderation record for reported image
      const item = await Item.findById(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      moderation = await ImageModeration.create({
        imageUrl,
        tempImageUrl: imageUrl,
        itemId,
        userId: item.userId,
        status: 'FLAGGED',
        moderationDecision: 'MANUAL_REVIEW_REQUIRED',
        rejectionReasons: ['USER_REPORTED'],
        reportCount: 0,
        reports: []
      });
    }

    // Check if user already reported this image
    const existingReport = moderation.reports.find(r => r.reportedBy === userId);
    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this image'
      });
    }

    // Add report
    moderation.reports.push({
      reportedBy: userId,
      reportedAt: new Date(),
      reason,
      comments
    });
    moderation.reportCount = moderation.reports.length;

    // Auto-hide image if reports exceed threshold
    const REPORT_THRESHOLD = 3;
    if (moderation.reportCount >= REPORT_THRESHOLD && moderation.status === 'APPROVED') {
      moderation.status = 'FLAGGED';
      
      // Remove from item temporarily
      const item = await Item.findById(itemId);
      if (item) {
        item.imageUrls = item.imageUrls.filter(url => url !== imageUrl);
        if (item.imageUrl === imageUrl) {
          item.imageUrl = item.imageUrls[0] || null;
        }
        await item.save();
      }

      // Record violation for multiple reports
      await recordViolation({
        userId: moderation.userId,
        imageId: moderation._id,
        itemId,
        violationType: 'MULTIPLE_REPORTS',
        description: `Image received ${moderation.reportCount} user reports`,
        actedBy: 'SYSTEM'
      });
    }

    await moderation.save();

    // Create audit log
    await ModerationAuditLog.create({
      action: 'USER_REPORTED',
      imageId: moderation._id,
      itemId,
      userId: moderation.userId,
      actorType: 'USER',
      actorId: userId,
      details: {
        reason,
        comments,
        totalReports: moderation.reportCount,
        autoHidden: moderation.reportCount >= REPORT_THRESHOLD
      }
    });

    res.json({
      success: true,
      message: 'Image reported successfully',
      reportCount: moderation.reportCount
    });

  } catch (error) {
    console.error('Error reporting image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report image',
      error: error.message
    });
  }
};

/**
 * Get moderation statistics
 * @route GET /api/moderation/stats
 * @access Admin only
 */
export const getModerationStats = async (req, res) => {
  try {
    const stats = await Promise.all([
      ImageModeration.countDocuments({ status: 'PENDING' }),
      ImageModeration.countDocuments({ status: 'REVIEWING' }),
      ImageModeration.countDocuments({ status: 'FLAGGED' }),
      ImageModeration.countDocuments({ status: 'APPROVED' }),
      ImageModeration.countDocuments({ status: 'REJECTED' }),
      UserViolation.countDocuments({ accountStatus: 'WARNING' }),
      UserViolation.countDocuments({ accountStatus: 'SUSPENDED' }),
      UserViolation.countDocuments({ accountStatus: 'BANNED' }),
      ImageModeration.countDocuments({
        reportCount: { $gte: 1 }
      })
    ]);

    // Get recent activity
    const recentActivity = await ModerationAuditLog.find()
      .sort({ timestamp: -1 })
      .limit(10);

    // Get top violators
    const topViolators = await UserViolation.find()
      .sort({ lifetimeStrikes: -1 })
      .limit(10)
      .select('userId lifetimeStrikes activeStrikes accountStatus stats');

    res.json({
      success: true,
      stats: {
        pending: stats[0],
        reviewing: stats[1],
        flagged: stats[2],
        approved: stats[3],
        rejected: stats[4],
        usersWarned: stats[5],
        usersSuspended: stats[6],
        usersBanned: stats[7],
        reportedImages: stats[8]
      },
      recentActivity,
      topViolators
    });

  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

/**
 * Get blurred preview of image (for moderator safety)
 * @route GET /api/moderation/:imageId/preview
 * @access Admin only
 */
export const getBlurredPreview = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { blur = true } = req.query;

    const moderation = await ImageModeration.findById(imageId);

    if (!moderation) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Download image
    const response = await axios.get(moderation.imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });

    const imageBuffer = Buffer.from(response.data);

    // Create blurred preview if requested
    let outputBuffer = imageBuffer;
    if (blur === 'true' || blur === true) {
      outputBuffer = await createBlurredPreview(imageBuffer);
    }

    res.set('Content-Type', 'image/jpeg');
    res.send(outputBuffer);

  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate preview',
      error: error.message
    });
  }
};

/**
 * Get all images by status with search
 * @route GET /api/moderation/images
 * @access Admin only
 */
export const getImagesByStatus = async (req, res) => {
  try {
    const { 
      status = 'APPROVED', 
      page = 1, 
      limit = 20,
      search = '',
      userId = ''
    } = req.query;

    // Build query
    const query = { status };
    
    // Add search filter
    if (search) {
      const items = await Item.find({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { userName: { $regex: search, $options: 'i' } },
          { userEmail: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      query.itemId = { $in: items.map(i => i._id) };
    }
    
    if (userId) {
      query.userId = userId;
    }

    const images = await ImageModeration.find(query)
      .populate('itemId', 'title category description userId userName userEmail userPhone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await ImageModeration.countDocuments(query);

    res.json({
      success: true,
      images,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching images by status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch images',
      error: error.message
    });
  }
};

/**
 * Get user violations with search
 * @route GET /api/moderation/violations
 * @access Admin only
 */
export const getUserViolations = async (req, res) => {
  try {
    const { 
      status = 'all',
      page = 1, 
      limit = 20,
      search = ''
    } = req.query;

    // Build query
    const query = {};
    
    if (status !== 'all') {
      query.accountStatus = status.toUpperCase();
    }
    
    // Search by userId (email pattern)
    if (search) {
      query.userId = { $regex: search, $options: 'i' };
    }

    const violations = await UserViolation.find(query)
      .sort({ lastViolationDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await UserViolation.countDocuments(query);

    res.json({
      success: true,
      violations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching violations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch violations',
      error: error.message
    });
  }
};

/**
 * Reverse moderation decision
 * @route POST /api/moderation/:imageId/reverse
 * @access Admin only
 */
export const reverseDecision = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { newStatus, notes } = req.body;
    const adminId = req.user?.userId || 'ADMIN';

    const moderation = await ImageModeration.findById(imageId);

    if (!moderation) {
      return res.status(404).json({
        success: false,
        message: 'Moderation record not found'
      });
    }

    const previousStatus = moderation.status;

    // Update moderation record
    moderation.status = newStatus;
    moderation.manualReview = {
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewNotes: notes,
      finalDecision: newStatus,
      reversed: true,
      previousDecision: previousStatus
    };
    await moderation.save();

    // Update item accordingly
    const item = await Item.findById(moderation.itemId);
    if (item) {
      if (newStatus === 'APPROVED') {
        // Add image back if reversing rejection
        if (!item.imageUrls.includes(moderation.imageUrl)) {
          item.imageUrls.push(moderation.imageUrl);
          if (!item.imageUrl) {
            item.imageUrl = moderation.imageUrl;
          }
        }
      } else if (newStatus === 'REJECTED') {
        // Remove image if reversing approval
        item.imageUrls = item.imageUrls.filter(url => url !== moderation.imageUrl);
        if (item.imageUrl === moderation.imageUrl) {
          item.imageUrl = item.imageUrls[0] || null;
        }
      }
      await item.save();
    }

    // Create audit log
    await ModerationAuditLog.create({
      action: 'DECISION_REVERSED',
      imageId: moderation._id,
      itemId: moderation.itemId,
      userId: moderation.userId,
      actorType: 'ADMIN',
      actorId: adminId,
      details: {
        previousStatus,
        newStatus,
        moderatorNotes: notes,
        reversed: true
      }
    });

    // Send notification to user
    const notificationTitle = newStatus === 'APPROVED' 
      ? 'Item Re-approved!' 
      : 'Item Status Changed';
    const notificationMessage = notes || 
      (newStatus === 'APPROVED' 
        ? `Your item "${item?.title || 'Unknown'}" has been re-approved.`
        : `Your item "${item?.title || 'Unknown'}" status has been updated.`);

    const reverseNotification = await Notification.create({
      userId: moderation.userId,
      type: newStatus === 'APPROVED' ? 'ITEM_APPROVED' : 'ITEM_REJECTED',
      title: notificationTitle,
      message: notificationMessage,
      itemId: moderation.itemId,
      imageUrl: moderation.imageUrl,
      read: false
    });

    // Send real-time notification
    emitNotification(moderation.userId, reverseNotification);

    res.json({
      success: true,
      message: 'Decision reversed successfully',
      moderation
    });

  } catch (error) {
    console.error('Error reversing decision:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reverse decision',
      error: error.message
    });
  }
};

/**
 * Get audit logs
 * @route GET /api/moderation/audit-logs
 * @access Admin only
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, userId, startDate, endDate } = req.query;

    const query = {};
    if (action) query.action = action;
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await ModerationAuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await ModerationAuditLog.countDocuments(query);

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
};

export default {
  getPendingReviews,
  getModerationDetails,
  approveImage,
  rejectImage,
  reportImage,
  getModerationStats,
  getBlurredPreview,
  getAuditLogs,
  getImagesByStatus,
  getUserViolations,
  reverseDecision
};
