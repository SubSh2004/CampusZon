import express from 'express';
import Item from '../models/item.mongo.model.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * Run migration to update moderationStatus for all items
 * @route POST /api/admin/migrate-moderation-status
 * @access Admin only
 */
router.post('/migrate-moderation-status', authenticate, isAdmin, async (req, res) => {
  try {
    // Find all items without moderationStatus field
    const result = await Item.updateMany(
      { moderationStatus: { $exists: false } },
      { 
        $set: { 
          moderationStatus: 'active',
          reportCount: 0,
          reports: []
        } 
      }
    );
    
    // Count items by moderation status
    const activeCount = await Item.countDocuments({ moderationStatus: 'active' });
    const warnedCount = await Item.countDocuments({ moderationStatus: 'warned' });
    const removedCount = await Item.countDocuments({ moderationStatus: 'removed' });
    const totalCount = await Item.countDocuments({});
    
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
