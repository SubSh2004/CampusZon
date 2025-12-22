import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  expressInterest,
  checkUnlockStatus,
  unlockBasic,
  unlockPremium,
  unlockItem,
  verifyPayment,
  getInterestedBuyers,
  getUserUnlocks,
  incrementMessageCount
} from '../controllers/unlock.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Express anonymous interest in an item (FREE)
router.post('/items/:itemId/interest', expressInterest);

// Check if user has unlocked an item
router.get('/items/:itemId/status', checkUnlockStatus);

// NEW: Unified unlock endpoint (₹11 single plan)
router.post('/items/:itemId/unlock', unlockItem);

// Legacy routes (kept for backwards compatibility)
router.post('/items/:itemId/unlock/basic', unlockBasic);
router.post('/items/:itemId/unlock/premium', unlockPremium);

// Verify payment after Razorpay checkout
router.post('/payment/verify', verifyPayment);

// Get interested buyers for seller's item
router.get('/seller/items/:itemId/buyers', getInterestedBuyers);

// Get user's unlock history
router.get('/user/unlocks', getUserUnlocks);

// Increment message count (for basic tier limit tracking)
router.post('/items/:itemId/message-count', incrementMessageCount);

export default router;
