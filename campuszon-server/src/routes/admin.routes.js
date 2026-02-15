import express from 'express';
import Item from '../models/item.mongo.model.js';
import User from '../models/user.model.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * Get institute statistics by email domain
 * @route GET /api/admin/stats/:emailDomain
 * @access Admin only
 */
router.get('/stats/:emailDomain', authenticate, isAdmin, async (req, res) => {
  try {
    const { emailDomain } = req.params;
    
    // Validate emailDomain format (basic validation)
    if (!emailDomain || !emailDomain.includes('.') || emailDomain.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email domain format'
      });
    }
    
    // Sanitize input - only allow alphanumeric, dots, and hyphens
    const sanitizedDomain = emailDomain.toLowerCase().replace(/[^a-z0-9.-]/g, '');
    
    // Count users with email ending in this domain
    // MongoDB regex to match emails ending with @domain
    const emailPattern = new RegExp(`@${sanitizedDomain.replace(/\./g, '\\.')}$`, 'i');
    const totalUsers = await User.countDocuments({
      email: emailPattern
    });
    
    // Count items by emailDomain
    const totalItems = await Item.countDocuments({
      emailDomain: sanitizedDomain
    });
    
    const activeItems = await Item.countDocuments({
      emailDomain: sanitizedDomain,
      moderationStatus: 'active'
    });
    
    const warnedItems = await Item.countDocuments({
      emailDomain: sanitizedDomain,
      moderationStatus: 'warned'
    });
    
    const removedItems = await Item.countDocuments({
      emailDomain: sanitizedDomain,
      moderationStatus: 'removed'
    });
    
    const reportedItems = await Item.countDocuments({
      emailDomain: sanitizedDomain,
      reportCount: { $gt: 0 }
    });
    
    res.status(200).json({
      success: true,
      data: {
        emailDomain: sanitizedDomain,
        totalUsers,
        totalItems,
        activeItems,
        warnedItems,
        removedItems,
        reportedItems
      }
    });
  } catch (error) {
    console.error('Error fetching institute stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch institute statistics',
      error: error.message
    });
  }
});

/**
 * Run migration to update moderationStatus for all items
 * @route POST /api/admin/migrate-moderation-status
 * @access Admin only
 */
router.post('/migrate-moderation-status', authenticate, isAdmin, async (req, res) => {
  try {
    // SECURITY: Get admin's emailDomain for campus scoping
    const adminEmail = req.user.email;
    const adminDomain = adminEmail.split('@')[1];
    
    if (!adminDomain) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin email format'
      });
    }
    
    // Find all items without moderationStatus field (scoped to admin's campus)
    const result = await Item.updateMany(
      { 
        emailDomain: adminDomain,
        moderationStatus: { $exists: false }
      },
      { 
        $set: { 
          moderationStatus: 'active',
          reportCount: 0,
          reports: []
        } 
      }
    );
    
    // Count items by moderation status (scoped to admin's campus)
    const activeCount = await Item.countDocuments({ emailDomain: adminDomain, moderationStatus: 'active' });
    const warnedCount = await Item.countDocuments({ emailDomain: adminDomain, moderationStatus: 'warned' });
    const removedCount = await Item.countDocuments({ emailDomain: adminDomain, moderationStatus: 'removed' });
    const totalCount = await Item.countDocuments({ emailDomain: adminDomain });
    
    res.status(200).json({
      success: true,
      message: 'Migration completed successfully',
      updated: result.modifiedCount,
      statistics: {
        total: totalCount,
        active: activeCount,
        warned: warnedCount,
        removed: removedCount
      }
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

export default router;
