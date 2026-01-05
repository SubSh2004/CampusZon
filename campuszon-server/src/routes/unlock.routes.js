import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  expressInterest,
  checkUnlockStatus,
  unlockItem,
  getInterestedBuyers,
  getUserUnlocks
} from '../controllers/unlock.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Express anonymous interest in an item (FREE)
router.post('/items/:itemId/interest', expressInterest);

// Check if user has unlocked an item
router.get('/items/:itemId/status', checkUnlockStatus);

// Unlock item with token
router.post('/items/:itemId/unlock', unlockItem);

// Get interested buyers for seller's item
router.get('/seller/items/:itemId/buyers', getInterestedBuyers);

// Get user's unlock history
router.get('/user/unlocks', getUserUnlocks);

export default router;
