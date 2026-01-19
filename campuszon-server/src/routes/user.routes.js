import express from 'express';
import { signupUser, loginUser, sendOTP, verifyOTP, getProfile, updateProfile, getUserById, forgotPassword, resetPassword } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';
import Unlock from '../models/unlock.model.js';

const router = express.Router();

// POST /api/user/send-otp - Send OTP for email verification
// RATE LIMITED: 3 requests per 15 minutes
router.post('/send-otp', otpLimiter, sendOTP);

// POST /api/user/verify-otp - Verify OTP
router.post('/verify-otp', verifyOTP);

// POST /api/user/signup - Register a new user
// RATE LIMITED: 5 requests per 15 minutes
router.post('/signup', authLimiter, signupUser);

// POST /api/user/login - Login user
// RATE LIMITED: 5 requests per 15 minutes
router.post('/login', authLimiter, loginUser);

// POST /api/user/forgot-password - Send OTP for password reset
// RATE LIMITED: 3 requests per 15 minutes
router.post('/forgot-password', otpLimiter, forgotPassword);

// POST /api/user/reset-password - Reset password with OTP
// RATE LIMITED: 5 requests per 15 minutes
router.post('/reset-password', authLimiter, resetPassword);

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

// PUT /api/user/preferences - Update user preferences (protected)
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { skipUnlockConfirmation } = req.body;

    const User = (await import('../models/user.model.js')).default;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { skipUnlockConfirmation },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: {
        skipUnlockConfirmation: updatedUser.skipUnlockConfirmation
      }
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
});

export default router;
