import express from 'express';
import { signupUser, loginUser, sendOTP, verifyOTP, getProfile, updateProfile, getUserById } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';

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

// PUT /api/user/profile - Update user profile (protected)
router.put('/profile', authenticate, updateProfile);

export default router;
