import express from 'express';
import { signupUser, loginUser, sendOTP, verifyOTP, getProfile, updateProfile, getUserById } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
import Unlock from '../models/unlock.model.js';

const router = express.Router();

// POST /api/user/send-otp - Send OTP for email verification
router.post('/send-otp', sendOTP);

// POST /api/user/verify-otp - Verify OTP
router.post('/verify-otp', verifyOTP);

// POST /api/user/signup - Register a new user
router.post('/signup', signupUser);

// POST /api/user/login - Login user
router.post('/login', loginUser);

// GET /api/user/profile - Get user profile (protected)
router.get('/profile', authenticate, getProfile);

// GET /api/users/:userId - Get user by ID (protected)
router.get('/:userId', authenticate, getUserById);

// Check unlock limits between current user and another user
router.get('/unlock/check-limits', authenticate, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { otherUserId } = req.query;

    console.log('🔍 Checking unlock limits between:', currentUserId, 'and', otherUserId);

    // Find unlock where current user unlocked an item sold by the other user
    const unlock = await Unlock.findOne({
      userId: currentUserId
    }).populate({
      path: 'itemId',
      match: { sellerId: otherUserId }
    });

    // If no unlock found or itemId not populated (no match)
    if (!unlock || !unlock.itemId) {
      console.log('❌ No unlock found between these users');
      return res.json({ hasUnlock: false });
    }

    console.log('✅ Found unlock:', {
      tier: unlock.tier,
      messageCount: unlock.messageCount,
      messageLimit: unlock.tier === 'basic' ? 10 : null
    });

    res.json({
      hasUnlock: true,
      tier: unlock.tier,
      messageCount: unlock.messageCount || 0,
      messageLimit: unlock.tier === 'basic' ? 10 : null
    });
  } catch (error) {
    console.error('❌ Error checking unlock limits:', error);
    res.status(500).json({ error: 'Failed to check unlock limits' });
  }
});

// PUT /api/user/profile - Update user profile (protected)
router.put('/profile', authenticate, updateProfile);

export default router;
