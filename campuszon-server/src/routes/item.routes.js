import express from 'express';
import { 
  createItem, 
  getAllItems, 
  getMyItems,
  getItemById, 
  updateItem, 
  deleteItem,
  reportItem,
  addReview,
  addReplyToReview,
  updateReply,
  deleteReply,
  getReportedItems,
  getAllItemsForAdmin,
  moderateItem
} from '../controllers/item.controller.js';
import upload from '../middleware/multer.js';
import { authenticateToken } from '../middleware/auth.js';
import { itemCreationLimiter, reportLimiter } from '../middleware/rateLimiter.js';
import { 
  validateItemCreation, 
  validateItemUpdate, 
  validateObjectId,
  validateSearchQuery,
  validateEmailDomain,
  validateReview,
  validateReply,
  validateReplyDelete
} from '../middleware/validation.js';

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
};

// POST /api/items/add - Create a new item with image upload (up to 5 images)
// REQUIRES AUTHENTICATION - only logged-in users can create items
// RATE LIMITED: 20 items per hour to prevent spam
// VALIDATED: All item fields with sanitization
router.post('/add', authenticateToken, itemCreationLimiter, upload.array('images', 5), validateItemCreation, createItem);

// GET /api/items - Get all items
// VALIDATED: Search query, pagination, email domain
router.get('/', validateSearchQuery, validateEmailDomain, getAllItems);

// GET /api/items/my - Get user's own items (all statuses)
// REQUIRES AUTHENTICATION
router.get('/my', authenticateToken, getMyItems);

// GET /api/items/reported - Get reported items (Admin only)
router.get('/reported', authenticateToken, requireAdmin, getReportedItems);

// GET /api/items/admin/all - Get all items for admin review (Admin only)
router.get('/admin/all', authenticateToken, requireAdmin, getAllItemsForAdmin);

// GET /api/items/:id - Get item by ID
// VALIDATED: MongoDB ObjectID format
router.get('/:id', validateObjectId('id'), getItemById);

// PUT /api/items/:id - Update item by ID
// REQUIRES AUTHENTICATION - only logged-in users can update items
// VALIDATED: ObjectID and update fields
router.put('/:id', authenticateToken, validateObjectId('id'), validateItemUpdate, updateItem);

// DELETE /api/items/:id - Delete item by ID
// REQUIRES AUTHENTICATION - only logged-in users can delete items
// VALIDATED: MongoDB ObjectID format
router.delete('/:id', authenticateToken, validateObjectId('id'), deleteItem);

// POST /api/items/:id/report - Report an item
// REQUIRES AUTHENTICATION - only logged-in users can report items
// RATE LIMITED: 10 reports per hour
router.post('/:id/report', authenticateToken, reportLimiter, reportItem);

// POST /api/items/:id/review - Add/update review for an item
// REQUIRES AUTHENTICATION - only logged-in users can review items
// VALIDATED: Rating (1-5), review text, user info
router.post('/:id/review', authenticateToken, validateObjectId('id'), validateReview, addReview);

// POST /api/items/:id/review/:reviewIndex/reply - Add reply to a review
// REQUIRES AUTHENTICATION - only logged-in users can reply
// VALIDATED: Reply text, user info, review index
router.post('/:id/review/:reviewIndex/reply', authenticateToken, validateObjectId('id'), validateReply, addReplyToReview);

// PUT /api/items/:id/review/:reviewIndex/reply/:replyIndex - Update a reply
// REQUIRES AUTHENTICATION - only reply owner can update
// VALIDATED: Reply text, user info, indices
router.put('/:id/review/:reviewIndex/reply/:replyIndex', authenticateToken, validateObjectId('id'), validateReply, updateReply);

// DELETE /api/items/:id/review/:reviewIndex/reply/:replyIndex - Delete a reply
// REQUIRES AUTHENTICATION - only reply owner or item owner can delete
// VALIDATED: User info, indices
router.delete('/:id/review/:reviewIndex/reply/:replyIndex', authenticateToken, validateObjectId('id'), validateReplyDelete, deleteReply);

// POST /api/items/:id/moderate - Admin action on item (keep/warn/remove)
router.post('/:id/moderate', authenticateToken, requireAdmin, moderateItem);

export default router;
