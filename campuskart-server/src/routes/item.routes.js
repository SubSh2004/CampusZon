import express from 'express';
import { 
  createItem, 
  getAllItems, 
  getItemById, 
  updateItem, 
  deleteItem,
  reportItem,
  addReview,
  getReportedItems,
  getAllItemsForAdmin,
  moderateItem
} from '../controllers/item.controller.js';
import upload from '../middleware/multer.js';
import { authenticateToken } from '../middleware/auth.js';

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
router.post('/add', upload.array('images', 5), createItem);

// GET /api/items - Get all items
router.get('/', getAllItems);

// GET /api/items/reported - Get reported items (Admin only)
router.get('/reported', authenticateToken, requireAdmin, getReportedItems);

// GET /api/items/admin/all - Get all items for admin review (Admin only)
router.get('/admin/all', authenticateToken, requireAdmin, getAllItemsForAdmin);

// GET /api/items/:id - Get item by ID
router.get('/:id', getItemById);

// PUT /api/items/:id - Update item by ID
router.put('/:id', updateItem);

// DELETE /api/items/:id - Delete item by ID
router.delete('/:id', deleteItem);

// POST /api/items/:id/report - Report an item
router.post('/:id/report', reportItem);

// POST /api/items/:id/review - Add/update review for an item
router.post('/:id/review', addReview);

// POST /api/items/:id/moderate - Admin action on item (keep/warn/remove)
router.post('/:id/moderate', authenticateToken, requireAdmin, moderateItem);

export default router;
