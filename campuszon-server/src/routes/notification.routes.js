import express from 'express';
import Notification from '../models/notification.model.js';
import { authenticate } from '../middleware/auth.js';
import { getCache, setCache } from '../utils/cache.js';

const router = express.Router();

/**
 * Get user notifications
 * @route GET /api/notifications
 * @access Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { limit = 20, unreadOnly = false } = req.query;
    
    // Try cache first (30 second TTL for notifications)
    const cacheKey = `notifications:${userId}:${limit}:${unreadOnly}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const query = { userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ userId, read: false });

    const responseData = {
      success: true,
      notifications,
      unreadCount
    };
    
    // Cache for 30 seconds
    await setCache(cacheKey, responseData, 30);
    
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

/**
 * Mark notification as read
 * @route PUT /api/notifications/:id/read
 * @access Private
 */
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
});

/**
 * Mark all notifications as read
 * @route PUT /api/notifications/read-all
 * @access Private
 */
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const userId = req.user._id.toString();

    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notifications',
      error: error.message
    });
  }
});

/**
 * Delete a single notification
 * @route DELETE /api/notifications/:id
 * @access Private
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    console.log(`🗑️ Deleted notification ${id} for user ${userId}`);

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

/**
 * Clear all notifications
 * @route DELETE /api/notifications/clear-all
 * @access Private
 */
router.delete('/clear-all/all', authenticate, async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const result = await Notification.deleteMany({ userId });

    console.log(`🗑️ Cleared ${result.deletedCount} notifications for user ${userId}`);

    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} notifications`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications',
      error: error.message
    });
  }
});

export default router;
