import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';
import {
  getTokenPackages,
  purchaseTokens,
  verifyTokenPurchase,
  getTokenBalance
} from '../controllers/token.controller.js';

const router = express.Router();

// Get all token packages
router.get('/packages', authenticate, getTokenPackages);

// Purchase token package
// RATE LIMITED: 10 payment operations per 15 minutes
router.post('/purchase', authenticate, paymentLimiter, purchaseTokens);

// Verify token purchase payment
// RATE LIMITED: 10 payment operations per 15 minutes
router.post('/verify', authenticate, paymentLimiter, verifyTokenPurchase);

// Get user's token balance and history
router.get('/balance', authenticate, getTokenBalance);

export default router;
